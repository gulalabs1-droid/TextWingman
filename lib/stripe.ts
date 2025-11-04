import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export const PRICING = {
  monthly: {
    price: 7,
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY!,
    interval: 'month' as const,
  },
  annual: {
    price: 29,
    priceId: process.env.STRIPE_PRICE_ID_ANNUAL!,
    interval: 'year' as const,
  },
};
