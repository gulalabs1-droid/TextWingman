import { NextResponse } from 'next/server';
import { getAdminSupabase, requireAdmin } from '@/lib/admin';
import { getCanonicalFunnel } from '@/lib/admin-funnel';
import { isAdminEmail } from '@/lib/isAdmin';
import { getStripeBillingSnapshot, monthlyEquivalent } from '@/lib/billing-health';

function growth(current: number, previous: number): number {
  if (previous > 0) return Math.round(((current - previous) / previous) * 100);
  return current > 0 ? 100 : 0;
}
export async function GET() {
  const { user, isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getAdminSupabase();
    const stripeSnapshot = await getStripeBillingSnapshot();
    const verifiedPaidIds = new Set(
      stripeSnapshot.connected
        ? stripeSnapshot.activeSubscriptions
            .filter(subscription => Boolean(subscription.userId && subscription.planType))
            .map(subscription => subscription.userId as string)
        : [],
    );
    const verifiedPaidSubscriptionIds = new Set(
      stripeSnapshot.connected ? stripeSnapshot.activeSubscriptions.map(subscription => subscription.id) : [],
    );
    const funnel = await getCanonicalFunnel(db, {
      rangeDays: 30,
      currentAdminId: user?.id,
      verifiedPaidIds,
      verifiedPaidSubscriptionIds,
    });
    const now = Date.now();
    const d7 = new Date(now - 7 * 86400_000).toISOString();
    const d30 = new Date(now - 30 * 86400_000).toISOString();

    const [{ data: activeSubs }, { data: cancelingSubs }, { count: churned7d }, { count: churned30d }] = await Promise.all([
      db.from('subscriptions').select('user_id, plan_type, status, stripe_subscription_id').in('status', ['active', 'trialing']).limit(50000),
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
    const stripeActiveIds = new Set(stripeSnapshot.activeSubscriptions.map(subscription => subscription.id));
    const appUserByStripeId = new Map(
      activeSubscriptionRows
        .filter(subscription => subscription.stripe_subscription_id && subscription.user_id)
        .map(subscription => [subscription.stripe_subscription_id as string, subscription.user_id as string]),
    );
    const staleAppRows = stripeSnapshot.connected
      ? activeSubscriptionRows.filter(subscription =>
          !subscription.stripe_subscription_id || !stripeActiveIds.has(subscription.stripe_subscription_id),
        ).length
      : null;
    const verifiedActiveSubs = stripeSnapshot.connected
      ? stripeSnapshot.activeSubscriptions
        .map(subscription => ({
          ...subscription,
          userId: subscription.userId || appUserByStripeId.get(subscription.id) || null,
        }))
        .filter(subscription =>
          Boolean(
            subscription.userId &&
            !internalSubscriptionIds.has(subscription.userId) &&
            subscription.planType,
          ),
        )
      : [];

    let mrr = 0;
    const planBreakdown: Record<string, number> = {};
    for (const subscription of verifiedActiveSubs) {
      const plan = subscription.planType || 'unknown';
      planBreakdown[plan] = (planBreakdown[plan] || 0) + 1;
      mrr += monthlyEquivalent(plan);
    }

    const thisWeekOutputs = funnel.windows.d7.replySuccesses;
    const previousWeekOutputs = funnel.windows.previous7.replySuccesses;
    const thisWeekSignups = funnel.windows.d7.signups;
    const previousWeekSignups = funnel.windows.previous7.signups;
    const signupGrowthPct = growth(thisWeekSignups, previousWeekSignups);
    const genGrowthPct = growth(thisWeekOutputs, previousWeekOutputs);
    const paidUsers = stripeSnapshot.connected
      ? new Set(verifiedActiveSubs.map(subscription => subscription.userId).filter((id): id is string => Boolean(id))).size
      : 0;
    const verifiedConversionRate = funnel.account.registered > 0
      ? Math.round((paidUsers / funnel.account.registered) * 1000) / 10
      : 0;

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
      freeUsers: Math.max(funnel.account.registered - paidUsers, 0),
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(mrr * 12 * 100) / 100,
      projectedMrr: Math.round(mrr * (signupGrowthPct > 0 ? 1 + signupGrowthPct / 100 : 1) * 100) / 100,
      conversionRate: verifiedConversionRate,
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
      billing: {
        verified: stripeSnapshot.connected,
        pricesVerified: stripeSnapshot.pricesVerified,
        checkedAt: stripeSnapshot.checkedAt,
        stripeActiveSubs: stripeSnapshot.activeSubs,
        appActiveSubs: activeSubscriptionRows.length,
        staleAppRows,
        error: stripeSnapshot.error,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return NextResponse.json({ error: 'Unable to load overview data' }, { status: 500 });
  }
}
