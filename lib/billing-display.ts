export type BillingStatus = 'active' | 'trialing' | 'paused' | 'past_due' | 'unpaid' | 'incomplete';

export const BILLING_STATUSES: BillingStatus[] = [
  'active', 'trialing', 'paused', 'past_due', 'unpaid', 'incomplete',
];

export function billingStatusLabel(status: BillingStatus): string {
  switch (status) {
    case 'active': return 'Active';
    case 'trialing': return 'Trial';
    case 'paused': return 'Paused';
    case 'past_due': return 'Payment past due';
    case 'unpaid': return 'Unpaid';
    case 'incomplete': return 'Payment incomplete';
  }
}

export function needsBillingHelp(status: BillingStatus): boolean {
  return status !== 'active' && status !== 'trialing';
}
