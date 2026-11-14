import type Stripe from 'stripe';
import { subscriptionCanStillBill } from './account-deletion';

export type CheckoutBillingRecord = {
  status: string | null;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  subscription_id?: string | null;
  customer_id?: string | null;
};

export type CheckoutBlocker = 'existing_subscription' | 'existing_checkout' | 'unverified_subscription';

type Inputs = {
  stripe: Stripe;
  userId: string;
  email: string;
  records: CheckoutBillingRecord[];
  knownPriceIds: Set<string>;
  ignoreAttemptId?: string;
};

const MAX_RESULTS = 2000;

/** Check Stripe as well as the local row; uncertainty blocks a second purchase. */
export async function findCheckoutBlocker({ stripe, userId, email, records, knownPriceIds, ignoreAttemptId }: Inputs): Promise<CheckoutBlocker | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) || !email) {
    return 'unverified_subscription';
  }

  const subscriptions = new Set<string>();
  const customerIds = new Set<string>();
  let unresolvedRecord = false;
  let checked = 0;
  const checkLimit = () => { if (++checked > MAX_RESULTS) throw new Error('Billing history exceeds safe checkout limit'); };

  for (const row of records) {
    checkLimit();
    const id = row.stripe_subscription_id || row.subscription_id;
    const customer = row.stripe_customer_id || row.customer_id;
    if (customer?.startsWith('cus_')) customerIds.add(customer);
    if (!id?.startsWith('sub_')) {
      if (subscriptionCanStillBill(row.status)) unresolvedRecord = true;
      continue;
    }
    const subscription = await stripe.subscriptions.retrieve(id);
    if (subscription.metadata?.user_id && subscription.metadata.user_id !== userId) return 'unverified_subscription';
    subscriptions.add(subscription.id);
    if (subscriptionCanStillBill(subscription.status)) return 'existing_subscription';
  }

  for await (const subscription of stripe.subscriptions.search({ query: `metadata['user_id']:'${userId}'`, limit: 100 })) {
    checkLimit();
    if (subscription.metadata?.user_id !== userId || subscriptions.has(subscription.id)) continue;
    subscriptions.add(subscription.id);
    if (subscriptionCanStillBill(subscription.status)) return 'existing_subscription';
  }

  for await (const customer of stripe.customers.list({ email, limit: 100 })) {
    checkLimit();
    customerIds.add(customer.id);
  }
  for (const customer of customerIds) {
    for await (const subscription of stripe.subscriptions.list({ customer, status: 'all', limit: 100 })) {
      checkLimit();
      if (subscriptions.has(subscription.id)) continue;
      const owner = subscription.metadata?.user_id;
      if (owner && owner !== userId) continue;
      const isKnownPrice = subscription.items.data.some(item => knownPriceIds.has(item.price.id));
      if (!owner && !isKnownPrice) {
        if (subscriptionCanStillBill(subscription.status)) return 'unverified_subscription';
        continue;
      }
      subscriptions.add(subscription.id);
      if (subscriptionCanStillBill(subscription.status)) return 'existing_subscription';
    }
  }

  // Check both open and recently completed sessions to cover a payment in flight.
  for await (const session of stripe.checkout.sessions.list({ created: { gte: Math.floor(Date.now() / 1000) - 25 * 60 * 60 }, limit: 100 })) {
    checkLimit();
    if (session.metadata?.checkout_guard_id === ignoreAttemptId && ignoreAttemptId) continue;
    if (session.client_reference_id !== userId && session.metadata?.user_id !== userId) continue;
    if (session.status === 'open') return 'existing_checkout';
    if (session.status === 'complete') {
      if (!session.subscription) return 'unverified_subscription';
      const subscription = typeof session.subscription === 'string'
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription;
      if (subscriptionCanStillBill(subscription.status)) return 'existing_subscription';
    } else if (session.status !== 'expired') {
      return 'unverified_subscription';
    }
  }

  return unresolvedRecord ? 'unverified_subscription' : null;
}
