import assert from 'node:assert/strict';
import { test } from 'node:test';
import type Stripe from 'stripe';
import { hasUnfinishedBilling, subscriptionCanStillBill } from '../lib/account-deletion';

function fakeStripe(options: { status?: string; checkoutUser?: string; checkoutStatus?: string; checkoutSubscription?: string; fail?: boolean } = {}): Stripe {
  async function* customers() {
    if (options.fail) throw new Error('Stripe unavailable');
    yield { id: 'cus_test' };
  }
  async function* subscriptions() {
    if (options.status) yield { status: options.status };
  }
  async function* checkouts() {
    if (options.checkoutUser) yield { client_reference_id: options.checkoutUser, metadata: null, status: options.checkoutStatus || 'open', subscription: options.checkoutSubscription || null };
  }
  return {
    customers: { list: customers },
    subscriptions: { list: subscriptions, search: subscriptions, retrieve: async () => ({ status: options.status || 'canceled' }) },
    checkout: { sessions: { list: checkouts } },
  } as unknown as Stripe;
}

test('account deletion blocks active billing, open checkout and uncertainty', async () => {
  assert.equal(subscriptionCanStillBill('canceled'), false);
  assert.equal(subscriptionCanStillBill('paused'), true);
  assert.equal(await hasUnfinishedBilling(fakeStripe({ status: 'active' }), 'user-a', 'test@example.invalid', []), true);
  assert.equal(await hasUnfinishedBilling(fakeStripe({ checkoutUser: 'user-a' }), 'user-a', 'test@example.invalid', []), true);
  assert.equal(await hasUnfinishedBilling(fakeStripe({ checkoutUser: 'user-a', checkoutStatus: 'complete' }), 'user-a', 'test@example.invalid', []), true);
  assert.equal(await hasUnfinishedBilling(fakeStripe({ checkoutUser: 'user-a', checkoutStatus: 'complete', checkoutSubscription: 'sub_test' }), 'user-a', 'test@example.invalid', []), false);
  assert.equal(await hasUnfinishedBilling(fakeStripe({ status: 'canceled' }), 'user-a', 'test@example.invalid', []), false);
  assert.equal(await hasUnfinishedBilling(fakeStripe(), 'user-a', 'test@example.invalid', [{ status: 'active' }]), true);
  await assert.rejects(() => hasUnfinishedBilling(fakeStripe({ fail: true }), 'user-a', 'test@example.invalid', []));
});
