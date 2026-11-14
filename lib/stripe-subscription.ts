type SubscriptionPeriod = {
  current_period_end?: unknown;
  items?: { data?: Array<{ current_period_end?: unknown }> };
};

// Stripe moved the billing period from the subscription to its item in newer
// event versions. The app sells one item per subscription.
export function subscriptionPeriodEnd(subscription: unknown): string | null {
  const source = subscription as SubscriptionPeriod | null;
  const seconds = [source?.current_period_end, source?.items?.data?.[0]?.current_period_end]
    .find(value => typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 8640000000000);
  return typeof seconds === 'number' ? new Date(seconds * 1000).toISOString() : null;
}
