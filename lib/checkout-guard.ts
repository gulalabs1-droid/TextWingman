import type Stripe from 'stripe';
import { subscriptionCanStillBill } from './account-deletion';
import type { CheckoutBlocker } from './checkout-eligibility';

export type CheckoutPlan = 'monthly' | 'weekly' | 'annual';
export type CheckoutAttempt = {
  user_id: string;
  attempt_id: string;
  plan: CheckoutPlan;
  session_params: Stripe.Checkout.SessionCreateParams;
  stripe_session_id: string | null;
  expires_at: string;
};
export interface CheckoutGuardStore {
  reserve(candidate: CheckoutAttempt): Promise<CheckoutAttempt>;
  saveSession(attempt: CheckoutAttempt, sessionId: string): Promise<boolean>;
  replace(previous: CheckoutAttempt, candidate: CheckoutAttempt): Promise<boolean>;
}
export type CheckoutGuardResult =
  | { url: string }
  | { blocker: CheckoutBlocker | 'different_plan' | 'processing' | 'retry' };

function validAttempt(attempt: CheckoutAttempt, userId: string): boolean {
  const params = attempt.session_params;
  return attempt.user_id === userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attempt.attempt_id) &&
    ['monthly', 'weekly', 'annual'].includes(attempt.plan) && params?.mode === 'subscription' &&
    params.client_reference_id === userId && params.metadata?.user_id === userId &&
    params.metadata?.checkout_guard_id === attempt.attempt_id &&
    params.subscription_data?.metadata?.user_id === userId &&
    params.subscription_data?.metadata?.checkout_guard_id === attempt.attempt_id &&
    params.subscription_data?.trial_period_days === undefined && params.subscription_data?.trial_end === undefined &&
    params.payment_method_collection !== 'if_required' && typeof params.expires_at === 'number' &&
    Number.isFinite(params.expires_at) && Date.parse(attempt.expires_at) === params.expires_at * 1000;
}

/** Persist one request before contacting Stripe, and reuse it on every retry. */
export async function guardedCheckout(input: {
  stripe: Stripe;
  store: CheckoutGuardStore;
  userId: string;
  plan: CheckoutPlan;
  candidate: () => CheckoutAttempt;
  findBlocker: (attemptId: string) => Promise<CheckoutBlocker | null>;
}): Promise<CheckoutGuardResult> {
  for (let tries = 0; tries < 3; tries++) {
    const attempt = await input.store.reserve(input.candidate());
    if (!validAttempt(attempt, input.userId)) throw new Error('Invalid persisted checkout attempt');
    const blocker = await input.findBlocker(attempt.attempt_id);
    if (blocker) return { blocker };
    if (!attempt.stripe_session_id && attempt.plan !== input.plan && Date.parse(attempt.expires_at) > Date.now()) {
      return { blocker: 'different_plan' };
    }

    let sessionId = attempt.stripe_session_id;
    if (!sessionId) {
      let created: Stripe.Checkout.Session;
      try {
        created = await input.stripe.checkout.sessions.create(attempt.session_params, {
          idempotencyKey: `text-wingman-checkout-${attempt.attempt_id}`,
        });
      } catch (error) {
        const stripeError = error as { type?: string; param?: string };
        if (Date.parse(attempt.expires_at) <= Date.now() && stripeError.type === 'StripeInvalidRequestError' && stripeError.param === 'expires_at') {
          await input.store.replace(attempt, input.candidate());
          continue;
        }
        throw error;
      }
      sessionId = created.id;
      if (!await input.store.saveSession(attempt, sessionId)) return { blocker: 'retry' };
    }
    const session = await input.stripe.checkout.sessions.retrieve(sessionId);
    if (session.mode !== 'subscription' || session.client_reference_id !== input.userId ||
        session.metadata?.checkout_guard_id !== attempt.attempt_id || session.metadata?.user_id !== input.userId) {
      throw new Error('Checkout session does not match its owner');
    }
    if (session.status === 'open') {
      if (attempt.plan !== input.plan) return { blocker: 'different_plan' };
      if (!session.url) return { blocker: 'retry' };
      return { url: session.url };
    }
    if (session.status === 'complete') {
      if (!session.subscription) return { blocker: 'processing' };
      const subscription = typeof session.subscription === 'string'
        ? await input.stripe.subscriptions.retrieve(session.subscription)
        : session.subscription;
      if (subscriptionCanStillBill(subscription.status)) return { blocker: 'existing_subscription' };
    } else if (session.status !== 'expired') {
      return { blocker: 'processing' };
    }

    // Compare-and-swap makes concurrent replacements choose the same next attempt.
    await input.store.replace(attempt, input.candidate());
  }
  return { blocker: 'retry' };
}
