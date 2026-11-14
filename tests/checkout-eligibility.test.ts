import assert from 'node:assert/strict';
import { test } from 'node:test';
import type Stripe from 'stripe';
import { findCheckoutBlocker, type CheckoutBillingRecord } from '../lib/checkout-eligibility';

const userId = '00000000-0000-0000-0000-000000000001';
type FakeSub = { id: string; status: string; metadata: { user_id?: string }; items: { data: { price: { id: string } }[] } };
const sub = (id: string, status: string, owner?: string, price = 'price_gula'): FakeSub => ({ id, status, metadata: owner ? { user_id: owner } : {}, items: { data: [{ price: { id: price } }] } });

function fakeStripe(options: { direct?: Record<string, FakeSub>; search?: FakeSub[]; customers?: string[]; byCustomer?: Record<string, FakeSub[]>; sessions?: Record<string, unknown>[]; fail?: boolean } = {}): Stripe {
  return {
    subscriptions: {
      retrieve: async (id: string) => { if (options.fail || !options.direct?.[id]) throw new Error('unavailable'); return options.direct[id]; },
      search: async function* () { if (options.fail) throw new Error('unavailable'); yield* options.search || []; },
      list: async function* ({ customer }: { customer: string }) { yield* options.byCustomer?.[customer] || []; },
    },
    customers: { list: async function* () { for (const id of options.customers || []) yield { id }; } },
    checkout: { sessions: { list: async function* () { yield* options.sessions || []; } } },
  } as unknown as Stripe;
}

async function check(stripe: Stripe, records: CheckoutBillingRecord[] = [], ignoreAttemptId?: string) {
  return findCheckoutBlocker({ stripe, userId, email: 'qa@example.invalid', records, knownPriceIds: new Set(['price_gula']), ignoreAttemptId });
}

test('checkout blocks active, trialing, paused and past-due subscriptions', async () => {
  for (const status of ['active', 'trialing', 'paused', 'past_due', 'unpaid', 'incomplete']) {
    assert.equal(await check(fakeStripe({ search: [sub('sub_1', status, userId)] })), 'existing_subscription');
  }
  assert.equal(await check(fakeStripe({ search: [sub('sub_1', 'canceled', userId)] })), null);
});

test('checkout detects matching legacy subscriptions and ambiguous active billing', async () => {
  assert.equal(await check(fakeStripe({ customers: ['cus_1'], byCustomer: { cus_1: [sub('sub_1', 'active')] } })), 'existing_subscription');
  assert.equal(await check(fakeStripe({ customers: ['cus_1'], byCustomer: { cus_1: [sub('sub_1', 'active', undefined, 'price_other')] } })), 'unverified_subscription');
  assert.equal(await check(fakeStripe({ customers: ['cus_1'], byCustomer: { cus_1: [sub('sub_1', 'active', '00000000-0000-0000-0000-000000000002')] } })), null);
  assert.equal(await check(fakeStripe(), [{ status: 'active', stripe_subscription_id: 'pending_sync' }]), 'unverified_subscription');
});

test('checkout blocks old open sessions while ignoring its own guarded attempt', async () => {
  const stripe = fakeStripe({ sessions: [{ status: 'open', client_reference_id: userId, metadata: { checkout_guard_id: 'attempt_1' } }] });
  assert.equal(await check(stripe), 'existing_checkout');
  assert.equal(await check(stripe, [], 'attempt_1'), null);
  assert.equal(await check(fakeStripe({ sessions: [{ status: 'complete', client_reference_id: userId, subscription: null }] })), 'unverified_subscription');
  assert.equal(await check(fakeStripe({ direct: { sub_1: sub('sub_1', 'active', userId) }, sessions: [{ status: 'complete', client_reference_id: userId, subscription: 'sub_1' }] })), 'existing_subscription');
  assert.equal(await check(fakeStripe({ sessions: [{ status: null, client_reference_id: userId }] })), 'unverified_subscription');
});

test('checkout fails closed when Stripe cannot be checked or identity is invalid', async () => {
  await assert.rejects(check(fakeStripe({ fail: true })));
  assert.equal(await findCheckoutBlocker({ stripe: fakeStripe(), userId: "bad'query", email: 'qa@example.invalid', records: [], knownPriceIds: new Set() }), 'unverified_subscription');
  assert.equal(await check(fakeStripe({ direct: { sub_1: sub('sub_1', 'active', '00000000-0000-0000-0000-000000000002') } }), [{ status: 'active', stripe_subscription_id: 'sub_1' }]), 'unverified_subscription');
});
