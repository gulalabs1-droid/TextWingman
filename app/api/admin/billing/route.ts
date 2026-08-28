import { NextResponse } from 'next/server';
import { requireAdmin, getAdminSupabase } from '@/lib/admin';
import { planForStripePriceId, stripe } from '@/lib/stripe';
import { PLAN_PRICES } from '@/lib/pricing';
import type Stripe from 'stripe';

type PriceHealth = {
  configured: boolean;
  active: boolean;
  amountCents: number | null;
  currency: string | null;
  interval: string | null;
  intervalCount: number | null;
  matchesApp: boolean;
};

function inspectPrice(price: Stripe.Price | null, configured: boolean, expectedAmount: number, expectedInterval: string): PriceHealth {
  const amountCents = price?.unit_amount ?? null;
  const interval = price?.recurring?.interval ?? null;
  const intervalCount = price?.recurring?.interval_count ?? null;
  return {
    configured,
    active: Boolean(price?.active),
    amountCents,
    currency: price?.currency ?? null,
    interval,
    intervalCount,
    matchesApp: Boolean(
      price?.active &&
      price?.currency === 'usd' &&
      amountCents === Math.round(expectedAmount * 100) &&
      interval === expectedInterval &&
      intervalCount === 1,
    ),
  };
}

export async function GET() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getAdminSupabase();
  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: allSubs },
    { data: cancelingSubs },
    { data: upcomingRenewals },
  ] = await Promise.all([
    db.from('subscriptions').select('*'),
    db.from('subscriptions').select('*, profiles!inner(email)').eq('cancel_at_period_end', true),
    db.from('subscriptions').select('*, profiles!inner(email)').in('status', ['active', 'trialing']).lte('current_period_end', in7d).gte('current_period_end', now.toISOString()),
  ]);

  // Orphaned: active/trialing but missing stripe ids
  const orphaned = allSubs?.filter(s =>
    ['active', 'trialing'].includes(s.status) &&
    (!s.stripe_subscription_id || !s.stripe_customer_id)
  ) || [];

  // Mismatch: profile.plan doesn't match derived plan
  const activeUserIds = new Set(allSubs?.filter(s => s.status === 'active' || s.status === 'trialing').map(s => s.user_id));
  const { data: profiles } = await db.from('profiles').select('id, plan, email');
  const mismatches = profiles?.filter(p => {
    const hasActiveSub = activeUserIds.has(p.id);
    // plan column is stale — just flag if someone has plan='disabled'
    return p.plan === 'disabled';
  }) || [];

  // Recent admin events (last 50)
  const { data: recentEvents } = await db.from('admin_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  // Stripe is the billing source of truth. Keep this check read-only so an
  // environment or webhook mismatch is visible without mutating customer data.
  let stripeHealth: {
    connected: boolean;
    checkedAt: string;
    activeSubs: number;
    canceledSubs: number;
    databaseActiveSubs: number;
    staleDatabaseSubs: number;
    orphanedStripeSubs: number;
    priceMismatches: number;
    unknownActivePrices: number;
    hasMore: boolean;
    priceConfig: {
      weekly: PriceHealth;
      annual: PriceHealth;
    };
  } = {
    connected: false,
    checkedAt: new Date().toISOString(),
    activeSubs: 0,
    canceledSubs: 0,
    databaseActiveSubs: allSubs?.filter(s => ['active', 'trialing'].includes(s.status)).length || 0,
    staleDatabaseSubs: 0,
    orphanedStripeSubs: 0,
    priceMismatches: 0,
    unknownActivePrices: 0,
    hasMore: false,
    priceConfig: {
      weekly: inspectPrice(null, Boolean(process.env.STRIPE_PRICE_ID_WEEKLY), PLAN_PRICES.weekly.amount, 'week'),
      annual: inspectPrice(null, Boolean(process.env.STRIPE_PRICE_ID_ANNUAL), PLAN_PRICES.annual.amount, 'year'),
    },
  };

  try {
    const [stripeResult, weeklyPrice, annualPrice] = await Promise.all([
      stripe.subscriptions.list({ status: 'all', limit: 100 }),
      process.env.STRIPE_PRICE_ID_WEEKLY ? stripe.prices.retrieve(process.env.STRIPE_PRICE_ID_WEEKLY).catch(() => null) : Promise.resolve(null),
      process.env.STRIPE_PRICE_ID_ANNUAL ? stripe.prices.retrieve(process.env.STRIPE_PRICE_ID_ANNUAL).catch(() => null) : Promise.resolve(null),
    ]);
    const stripeRows = stripeResult.data;
    const stripeActiveRows = stripeRows.filter(s => ['active', 'trialing'].includes(s.status));
    const stripeActiveIds = new Set(stripeActiveRows.map(s => s.id));
    const dbActiveRows = allSubs?.filter(s => ['active', 'trialing'].includes(s.status)) || [];
    const dbActiveIds = new Set(dbActiveRows.map(s => s.stripe_subscription_id).filter(Boolean));

    stripeHealth = {
      connected: true,
      checkedAt: new Date().toISOString(),
      activeSubs: stripeActiveRows.length,
      canceledSubs: stripeRows.filter(s => s.status === 'canceled').length,
      databaseActiveSubs: dbActiveRows.length,
      staleDatabaseSubs: dbActiveRows.filter(s => !s.stripe_subscription_id || !stripeActiveIds.has(s.stripe_subscription_id)).length,
      orphanedStripeSubs: stripeActiveRows.filter(s => !dbActiveIds.has(s.id)).length,
      priceMismatches: dbActiveRows.filter(dbSub => {
        const stripeSub = stripeActiveRows.find(s => s.id === dbSub.stripe_subscription_id);
        const stripePriceId = stripeSub?.items.data[0]?.price?.id;
        return Boolean(stripeSub && dbSub.price_id && stripePriceId && dbSub.price_id !== stripePriceId);
      }).length,
      unknownActivePrices: stripeActiveRows.filter(s => !planForStripePriceId(s.items.data[0]?.price?.id)).length,
      hasMore: stripeResult.has_more,
      priceConfig: {
        weekly: inspectPrice(weeklyPrice, Boolean(process.env.STRIPE_PRICE_ID_WEEKLY), PLAN_PRICES.weekly.amount, 'week'),
        annual: inspectPrice(annualPrice, Boolean(process.env.STRIPE_PRICE_ID_ANNUAL), PLAN_PRICES.annual.amount, 'year'),
      },
    };
  } catch (error) {
    console.error('Stripe billing health check failed:', error);
  }

  return NextResponse.json({
    totalSubs: allSubs?.length || 0,
    activeSubs: allSubs?.filter(s => s.status === 'active' || s.status === 'trialing').length || 0,
    canceledSubs: allSubs?.filter(s => s.status === 'canceled').length || 0,
    orphaned,
    cancelingSubs: cancelingSubs || [],
    upcomingRenewals: upcomingRenewals || [],
    mismatches,
    recentEvents: recentEvents || [],
    stripeHealth,
  });
}
