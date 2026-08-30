import type Stripe from 'stripe';
import { PLAN_PRICES } from '@/lib/pricing';
import { planForStripePriceId, PRICING, stripe, type BillingPlan } from '@/lib/stripe';

export type PriceHealth = {
  configured: boolean;
  active: boolean;
  amountCents: number | null;
  currency: string | null;
  interval: string | null;
  intervalCount: number | null;
  matchesApp: boolean;
};

export type StripeSubscriptionSummary = {
  id: string;
  userId: string | null;
  priceId: string | null;
  planType: BillingPlan | null;
  status: string;
  createdAt: string | null;
};

export type StripeBillingSnapshot = {
  connected: boolean;
  pricesVerified: boolean;
  checkedAt: string;
  activeSubs: number;
  canceledSubs: number;
  hasMore: boolean;
  allSubscriptions: StripeSubscriptionSummary[];
  activeSubscriptions: StripeSubscriptionSummary[];
  priceConfig: {
    monthly: PriceHealth;
    weekly: PriceHealth;
    annual: PriceHealth;
  };
  error: string | null;
};

function inspectPrice(price: Stripe.Price | null, expectedAmount: number, expectedInterval: string): PriceHealth {
  const amountCents = price?.unit_amount ?? null;
  const interval = price?.recurring?.interval ?? null;
  const intervalCount = price?.recurring?.interval_count ?? null;
  return {
    configured: Boolean(price),
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

function unavailableSnapshot(error: unknown): StripeBillingSnapshot {
  const message = error instanceof Error ? error.message : 'Stripe could not be checked';
  return {
    connected: false,
    pricesVerified: false,
    checkedAt: new Date().toISOString(),
    activeSubs: 0,
    canceledSubs: 0,
    hasMore: false,
    allSubscriptions: [],
    activeSubscriptions: [],
    priceConfig: {
      monthly: inspectPrice(null, PLAN_PRICES.monthly.amount, 'month'),
      weekly: inspectPrice(null, PLAN_PRICES.weekly.amount, 'week'),
      annual: inspectPrice(null, PLAN_PRICES.annual.amount, 'year'),
    },
    error: message.slice(0, 200),
  };
}

/** Read Stripe directly. This is intentionally read-only and never mutates app rows. */
export async function getStripeBillingSnapshot(): Promise<StripeBillingSnapshot> {
  try {
    const [firstSubscriptionPage, monthlyPrice, weeklyPrice, annualPrice] = await Promise.all([
      stripe.subscriptions.list({ status: 'all', limit: 100 }),
      stripe.prices.retrieve(PRICING.monthly.priceId).catch(() => null),
      stripe.prices.retrieve(PRICING.weekly.priceId).catch(() => null),
      stripe.prices.retrieve(PRICING.annual.priceId).catch(() => null),
    ]);

    // Stripe returns subscriptions in pages. Do not silently undercount revenue
    // once the account grows beyond the first 100 records.
    const subscriptions: Stripe.Subscription[] = [...firstSubscriptionPage.data];
    let hasMore = firstSubscriptionPage.has_more;
    let pageCount = 1;
    const maxSubscriptions = 5000;
    while (hasMore && subscriptions.length < maxSubscriptions && pageCount < 50) {
      const lastSubscription = subscriptions[subscriptions.length - 1];
      if (!lastSubscription) break;
      const nextPage = await stripe.subscriptions.list({
        status: 'all',
        limit: 100,
        starting_after: lastSubscription.id,
      });
      if (!nextPage.data.length) break;
      subscriptions.push(...nextPage.data);
      hasMore = nextPage.has_more;
      pageCount += 1;
    }

    const priceConfig = {
      monthly: inspectPrice(monthlyPrice, PLAN_PRICES.monthly.amount, 'month'),
      weekly: inspectPrice(weeklyPrice, PLAN_PRICES.weekly.amount, 'week'),
      annual: inspectPrice(annualPrice, PLAN_PRICES.annual.amount, 'year'),
    };
    const summarize = (row: Stripe.Subscription): StripeSubscriptionSummary => {
      const priceId = row.items.data[0]?.price?.id || null;
      return {
        id: row.id,
        userId: row.metadata?.user_id || null,
        priceId,
        planType: planForStripePriceId(priceId),
        status: row.status,
        createdAt: row.created ? new Date(row.created * 1000).toISOString() : null,
      };
    };
    const allSubscriptions = subscriptions.map(summarize);
    const activeRows = subscriptions.filter(row => ['active', 'trialing'].includes(row.status));
    return {
      connected: true,
      pricesVerified: Object.values(priceConfig).every(price => price.matchesApp),
      checkedAt: new Date().toISOString(),
      activeSubs: activeRows.length,
      canceledSubs: subscriptions.filter(row => row.status === 'canceled').length,
      hasMore,
      allSubscriptions,
      activeSubscriptions: activeRows.map(summarize),
      priceConfig,
      error: null,
    };
  } catch (error) {
    console.error('Stripe billing snapshot failed:', error);
    return unavailableSnapshot(error);
  }
}

export function monthlyEquivalent(planType: string | null | undefined): number {
  if (planType === 'weekly') return PLAN_PRICES.weekly.amount * 52 / 12;
  if (planType === 'monthly') return PLAN_PRICES.monthly.amount;
  if (planType === 'annual') return PLAN_PRICES.annual.amount / 12;
  return 0;
}
