import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export const PRICING = {
  monthly: {
    price: 9.99,
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY || 'price_monthly',
  },
  annual: {
    price: 79,
    priceId: process.env.STRIPE_PRICE_ID_ANNUAL || 'price_annual',
  },
};
