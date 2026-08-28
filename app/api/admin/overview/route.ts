import { NextResponse } from 'next/server';
import { getAdminSupabase, requireAdmin } from '@/lib/admin';
import { getCanonicalFunnel } from '@/lib/admin-funnel';
import { isAdminEmail } from '@/lib/isAdmin';
import { PLAN_PRICES } from '@/lib/pricing';

const PRICE_MAP: Record<string, { amount: number; interval: 'week' | 'month' | 'year' }> = {
  weekly: { amount: PLAN_PRICES.weekly.amount, interval: 'week' },
  monthly: { amount: PLAN_PRICES.monthly.amount, interval: 'month' },
  annual: { amount: PLAN_PRICES.annual.amount, interval: 'year' },
};

function growth(current: number, previous: number): number {
  if (previous > 0) return Math.round(((current - previous) / previous) * 100);
  return current > 0 ? 100 : 0;
}
export async function GET() {
  const { user, isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getAdminSupabase();
    const funnel = await getCanonicalFunnel(db, { rangeDays: 30, currentAdminId: user?.id });
    const now = Date.now();
    const d7 = new Date(now - 7 * 86400_000).toISOString();
    const d30 = new Date(now - 30 * 86400_000).toISOString();

    const [{ data: activeSubs }, { data: cancelingSubs }, { count: churned7d }, { count: churned30d }] = await Promise.all([
      db.from('subscriptions').select('user_id, plan_type, status').in('status', ['active', 'trialing']).limit(50000),
      db.from('subscriptions').select('user_id').eq('cancel_at_period_end', true).limit(50000),
      db.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'canceled').gte('updated_at', d7),
      db.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'canceled').gte('updated_at', d30),
    ]);

    const activeSubscriptionRows = activeSubs || [];
    const activeSubscriptionIds = activeSubscriptionRows
      .map(subscription => subscription.user_id)
      .filter((id): id is string => typeof id === 'string');
    const { data: subscriptionProfiles } = activeSubscriptionIds.length
      ? await db.from('profiles').select('id, email').in('id', activeSubscriptionIds)
      : { data: [] as { id: string; email: string | null }[] };
    const internalSubscriptionIds = new Set<string>(user?.id ? [user.id] : []);
    for (const profile of subscriptionProfiles || []) if (isAdminEmail(profile.email)) internalSubscriptionIds.add(profile.id);
    const externalActiveSubs = activeSubscriptionRows.filter((subscription: { user_id: string | null }) =>
      typeof subscription.user_id === 'string' && !internalSubscriptionIds.has(subscription.user_id),
    );

    let mrr = 0;
    const planBreakdown: Record<string, number> = {};
    for (const subscription of externalActiveSubs) {
      const plan = subscription.plan_type || 'unknown';
      planBreakdown[plan] = (planBreakdown[plan] || 0) + 1;
      const price = PRICE_MAP[plan];
      if (!price) continue;
      if (price.interval === 'week') mrr += price.amount * 52 / 12;
      else if (price.interval === 'year') mrr += price.amount / 12;
      else mrr += price.amount;
    }

    const thisWeekOutputs = funnel.windows.d7.replySuccesses;
    const previousWeekOutputs = funnel.windows.previous7.replySuccesses;
    const thisWeekSignups = funnel.windows.d7.signups;
    const previousWeekSignups = funnel.windows.previous7.signups;
    const signupGrowthPct = growth(thisWeekSignups, previousWeekSignups);
    const genGrowthPct = growth(thisWeekOutputs, previousWeekOutputs);
    const paidUsers = funnel.account.paid;

    return NextResponse.json({
      totalUsers: funnel.account.registered,
      signups: {
        h24: funnel.windows.h24.signups,
        d7: thisWeekSignups,
        d30: funnel.windows.d30.signups,
      },
      generations: {
        total: funnel.outputs.allTime,
        h24: funnel.windows.h24.replySuccesses,
        d7: thisWeekOutputs,
        d30: funnel.windows.d30.replySuccesses,
      },
      activatedUsers: funnel.account.activated,
      anonymous: {
        people: funnel.windows.d30.anonymousVisitors,
        people7d: funnel.windows.d7.anonymousVisitors,
        activated: funnel.windows.d30.anonymousActivated,
      },
      paidUsers,
      freeUsers: funnel.account.free,
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(mrr * 12 * 100) / 100,
      projectedMrr: Math.round(mrr * (signupGrowthPct > 0 ? 1 + signupGrowthPct / 100 : 1) * 100) / 100,
      conversionRate: funnel.account.paidRate ?? 0,
      activationRate: funnel.account.activationRate ?? 0,
      planBreakdown,
      churn: { d7: churned7d || 0, d30: churned30d || 0 },
      cancelingCount: cancelingSubs?.length || 0,
      genByDay: funnel.outputs.byDay,
      signupsByDay: funnel.signupsByDay,
      signupGrowthPct,
      genGrowthPct,
      recentActivity: funnel.recentActivity,
      funnel,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return NextResponse.json({ error: 'Unable to load overview data' }, { status: 500 });
  }
}
