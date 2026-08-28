import Stripe from 'stripe';
import { PLAN_PRICES } from '@/lib/pricing';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export const PRICING = {
  weekly: {
    price: PLAN_PRICES.weekly.amount,
    priceId: process.env.STRIPE_PRICE_ID_WEEKLY || 'price_weekly',
  },
  monthly: {
    price: PLAN_PRICES.monthly.amount,
    // Price IDs are public Stripe references; keep this fallback deploy-safe.
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY || 'price_1U9FJCHpik4qZqqSxWQOqixC',
  },
  annual: {
    price: PLAN_PRICES.annual.amount,
    priceId: process.env.STRIPE_PRICE_ID_ANNUAL || 'price_annual',
  },
};

export type BillingPlan = keyof typeof PRICING;

export function planForStripePriceId(priceId: string | null | undefined): BillingPlan | null {
  if (priceId === PRICING.weekly.priceId) return 'weekly';
  if (priceId === PRICING.monthly.priceId) return 'monthly';
  if (priceId === PRICING.annual.priceId) return 'annual';
  return null;
}
