import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRICING } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/site';
import { getAdminSupabase } from '@/lib/admin';
import { findCheckoutBlocker } from '@/lib/checkout-eligibility';
import { guardedCheckout, type CheckoutAttempt, type CheckoutPlan } from '@/lib/checkout-guard';
import { checkoutGuardStore } from '@/lib/checkout-store';
import { enforceSecurityRateLimit } from '@/lib/security-rate-limit';
import { randomUUID } from 'node:crypto';

export async function POST(request: NextRequest) {
  try {
    const { plan, trial, analytics } = await request.json();

    if (!plan || !['monthly', 'weekly', 'annual'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    if (trial !== undefined && typeof trial !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid trial selection.' },
        { status: 400 }
      );
    }

    if (trial) {
      return NextResponse.json(
        { error: 'New Pro trials are temporarily unavailable. You can use the free plan or review a paid plan.' },
        { status: 409 }
      );
    }

    // Server-side auth — get real user, don't trust client-supplied userId
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in first.' },
        { status: 401 }
      );
    }

    const limited = await enforceSecurityRateLimit(request, 'checkout', 20, 600);
    if (limited) return limited;

    const userId = user.id;
    const userEmail = user.email || '';

    const checkoutPlan = plan as CheckoutPlan;
    const planConfig = PRICING[checkoutPlan];
    const trackingMetadata: Record<string, string> = {};
    const attribution = analytics?.attribution;
    if (attribution && typeof attribution === 'object' && !Array.isArray(attribution)) {
      for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'video_id', 'src', 'culture_origin']) {
        const value = attribution[key];
        if (typeof value === 'string' && value.trim()) trackingMetadata[key] = value.trim().slice(0, 128);
      }
    }
    const successParams = new URLSearchParams({ success: 'true', plan });
    const cancelParams = new URLSearchParams({ canceled: 'true', plan });

    const db = getAdminSupabase();
    const { data: records, error: billingError } = await db.from('subscriptions')
      .select('status,stripe_subscription_id,stripe_customer_id').eq('user_id', userId);
    if (billingError) throw billingError;

    const candidate = (): CheckoutAttempt => {
      const attemptId = randomUUID();
      const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
      const metadata = { user_id: userId, email: userEmail, checkout_guard_id: attemptId, ...trackingMetadata };
      return {
        user_id: userId,
        attempt_id: attemptId,
        plan: checkoutPlan,
        stripe_session_id: null,
        expires_at: new Date(expiresAt * 1000).toISOString(),
        session_params: {
          line_items: [{ price: planConfig.priceId, quantity: 1 }],
          mode: 'subscription',
          expires_at: expiresAt,
          success_url: `${SITE_URL}/app?${successParams.toString()}`,
          cancel_url: `${SITE_URL}/app?${cancelParams.toString()}`,
          allow_promotion_codes: true,
          customer_email: userEmail || undefined,
          client_reference_id: userId,
          metadata,
          subscription_data: { metadata },
        },
      };
    };
    const result = await guardedCheckout({
      stripe,
      store: checkoutGuardStore(db),
      userId,
      plan: checkoutPlan,
      candidate,
      findBlocker: attemptId => findCheckoutBlocker({
        stripe, userId, email: userEmail, records: records || [],
        knownPriceIds: new Set(Object.values(PRICING).map(value => value.priceId)),
        ignoreAttemptId: attemptId,
      }),
    });
    if ('url' in result) return NextResponse.json({ url: result.url });
    const messages = {
      existing_subscription: 'You already have a subscription or trial. Please manage your billing or contact support before starting another.',
      existing_checkout: 'A checkout is already open. Return to it or wait for it to expire before starting another.',
      unverified_subscription: 'We could not verify your billing status. Please contact support before starting checkout.',
      different_plan: 'A checkout for another plan is already open. Return to it or wait for it to expire.',
      processing: 'A previous checkout is still being processed. Please check your billing before trying again.',
      retry: 'Checkout is being prepared. Please try again shortly.',
    };
    return NextResponse.json({ error: messages[result.blocker] }, { status: result.blocker === 'retry' ? 503 : 409 });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
