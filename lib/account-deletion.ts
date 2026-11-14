import type Stripe from 'stripe';

type LocalSubscription = {
  status?: string | null;
  stripe_customer_id?: string | null;
  customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_id?: string | null;
};

export function subscriptionCanStillBill(status: string | null | undefined): boolean {
  return status !== 'canceled' && status !== 'incomplete_expired';
}

/** Read Stripe only. Account deletion must never silently cancel a customer's plan. */
export async function hasUnfinishedBilling(
  stripe: Stripe,
  userId: string,
  email: string,
  localSubscriptions: LocalSubscription[],
): Promise<boolean> {
  const customerIds = new Set<string>();
  const subscriptionIds = new Set<string>();

  for (const local of localSubscriptions) {
    const customerId = local.stripe_customer_id || local.customer_id;
    const subscriptionId = local.stripe_subscription_id || local.subscription_id;
    if (customerId) customerIds.add(customerId);
    if (subscriptionId) subscriptionIds.add(subscriptionId);
    if (!customerId && !subscriptionId && subscriptionCanStillBill(local.status)) return true;
  }

  for await (const customer of stripe.customers.list({ email, limit: 100 })) {
    customerIds.add(customer.id);
  }

  for (const id of subscriptionIds) {
    const subscription = await stripe.subscriptions.retrieve(id);
    if (subscriptionCanStillBill(subscription.status)) return true;
  }

  // Catch subscriptions whose customer email or local billing row changed.
  for await (const subscription of stripe.subscriptions.search({ query: `metadata['user_id']:'${userId}'`, limit: 100 })) {
    if (subscriptionCanStillBill(subscription.status)) return true;
  }

  for (const customer of customerIds) {
    for await (const subscription of stripe.subscriptions.list({ customer, status: 'all', limit: 100 })) {
      if (subscriptionCanStillBill(subscription.status)) return true;
    }
  }

  // A just-completed checkout can precede its webhook or Stripe search index.
  let checked = 0;
  for await (const session of stripe.checkout.sessions.list({ created: { gte: Math.floor(Date.now() / 1000) - 25 * 60 * 60 }, limit: 100 })) {
    if (++checked > 2000) throw new Error('Checkout history exceeds safe deletion limit');
    if (session.client_reference_id !== userId && session.metadata?.user_id !== userId) continue;
    if (session.status === 'open') return true;
    if (session.status === 'complete') {
      if (!session.subscription) return true;
      const subscription = typeof session.subscription === 'string'
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription;
      if (subscriptionCanStillBill(subscription.status)) return true;
    } else if (session.status !== 'expired') {
      return true;
    }
  }

  return false;
}
