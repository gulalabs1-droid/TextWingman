export const PLAN_PRICES = {
  // Keep weekly for legacy subscriptions; new customers see monthly first.
  weekly: {
    amount: 9.99,
    interval: 'week',
    displayAmount: '$9.99',
    displayInterval: '/week',
  },
  monthly: {
    amount: 12.99,
    interval: 'month',
    displayAmount: '$12.99',
    displayInterval: '/month',
  },
  annual: {
    amount: 99.99,
    interval: 'year',
    displayAmount: '$99.99',
    displayInterval: '/year',
  },
} as const;

const MONTHS_PER_YEAR = 12;

export const ANNUAL_MONTHLY_EQUIVALENT = PLAN_PRICES.annual.amount / MONTHS_PER_YEAR;
export const ANNUAL_SAVINGS = PLAN_PRICES.monthly.amount * MONTHS_PER_YEAR - PLAN_PRICES.annual.amount;
export const ANNUAL_SAVINGS_PERCENT = Math.round((ANNUAL_SAVINGS / (PLAN_PRICES.monthly.amount * MONTHS_PER_YEAR)) * 100);

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export const ANNUAL_MONTHLY_EQUIVALENT_DISPLAY = formatUsd(ANNUAL_MONTHLY_EQUIVALENT);
export const ANNUAL_SAVINGS_DISPLAY = formatUsd(ANNUAL_SAVINGS);
