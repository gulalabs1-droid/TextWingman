export const PLAN_PRICES = {
  weekly: {
    amount: 9.99,
    interval: 'week',
    displayAmount: '$9.99',
    displayInterval: '/week',
  },
  annual: {
    amount: 99.99,
    interval: 'year',
    displayAmount: '$99.99',
    displayInterval: '/year',
  },
} as const;

const WEEKS_PER_YEAR = 52;

export const ANNUAL_WEEKLY_EQUIVALENT = PLAN_PRICES.annual.amount / WEEKS_PER_YEAR;
export const ANNUAL_SAVINGS = PLAN_PRICES.weekly.amount * WEEKS_PER_YEAR - PLAN_PRICES.annual.amount;
export const ANNUAL_SAVINGS_PERCENT = Math.round((ANNUAL_SAVINGS / (PLAN_PRICES.weekly.amount * WEEKS_PER_YEAR)) * 100);

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export const ANNUAL_WEEKLY_EQUIVALENT_DISPLAY = formatUsd(ANNUAL_WEEKLY_EQUIVALENT);
export const ANNUAL_SAVINGS_DISPLAY = formatUsd(ANNUAL_SAVINGS);
