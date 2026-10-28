import test from 'node:test';
import assert from 'node:assert/strict';
import { firstPaidDates, paidSubscriptionIds } from '../lib/billing-classification';

test('only positive paid subscription invoices count as payment evidence', () => {
  const result = paidSubscriptionIds([
    { amount_paid: 0, subscription: 'trial' },
    { amount_paid: 1299, subscription: 'monthly' },
    { amount_paid: 9999, subscription: { id: 'annual' } },
    { amount_paid: 200, subscription: null },
  ]);
  assert.deepEqual([...result], ['monthly', 'annual']);
});

test('first payment date is taken from a positive invoice, not trial creation', () => {
  const result = firstPaidDates([
    { amount_paid: 0, subscription: 'sub', status_transitions: { paid_at: 10 } },
    { amount_paid: 1299, subscription: 'sub', status_transitions: { paid_at: 30 } },
    { amount_paid: 1299, subscription: 'sub', status_transitions: { paid_at: 20 } },
    { amount_paid: 1299, subscription: 'unknown-date' },
  ]);
  assert.equal(result.get('sub'), new Date(20_000).toISOString());
  assert.equal(result.has('unknown-date'), false);
});
