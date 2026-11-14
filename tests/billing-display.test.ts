import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BILLING_STATUSES, billingStatusLabel, needsBillingHelp } from '../lib/billing-display';

test('billing labels distinguish trials and payment issues from active subscriptions', () => {
  assert.equal(billingStatusLabel('active'), 'Active');
  assert.equal(billingStatusLabel('trialing'), 'Trial');
  assert.equal(billingStatusLabel('paused'), 'Paused');
  assert.equal(billingStatusLabel('past_due'), 'Payment past due');
  assert.equal(needsBillingHelp('trialing'), false);
  assert.equal(needsBillingHelp('paused'), true);
  assert.equal(needsBillingHelp('unpaid'), true);
  assert.ok(BILLING_STATUSES.includes('incomplete'));
});
