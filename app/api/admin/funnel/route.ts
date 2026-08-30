import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase, requireAdmin } from '@/lib/admin';
import { getCanonicalFunnel } from '@/lib/admin-funnel';
import { getStripeBillingSnapshot } from '@/lib/billing-health';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { user, isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requestedDays = Number(new URL(request.url).searchParams.get('days') || 30);
  const days = Number.isFinite(requestedDays) ? Math.min(Math.max(Math.round(requestedDays), 1), 90) : 30;

  try {
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
    const funnel = await getCanonicalFunnel(getAdminSupabase(), {
      rangeDays: days,
      currentAdminId: user?.id,
      verifiedPaidIds,
      verifiedPaidSubscriptionIds,
    });
    return NextResponse.json({
      ...funnel,
      billing: {
        verified: stripeSnapshot.connected,
        pricesVerified: stripeSnapshot.pricesVerified,
        checkedAt: stripeSnapshot.checkedAt,
        stripeActiveSubs: stripeSnapshot.activeSubs,
        error: stripeSnapshot.error,
      },
    });
  } catch (error) {
    console.error('Admin funnel error:', error);
    return NextResponse.json({ error: 'Unable to load funnel data' }, { status: 500 });
  }
}
