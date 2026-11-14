import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import type Stripe from 'stripe';
import { guardedCheckout, type CheckoutAttempt, type CheckoutGuardStore, type CheckoutPlan } from '../lib/checkout-guard';

const userId = '00000000-0000-0000-0000-000000000001';

function candidate(plan: CheckoutPlan = 'monthly'): CheckoutAttempt {
  const attemptId = randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  return {
    user_id: userId, attempt_id: attemptId, plan, stripe_session_id: null,
    expires_at: new Date(expiresAt * 1000).toISOString(),
    session_params: {
      mode: 'subscription', client_reference_id: userId, expires_at: expiresAt,
      metadata: { user_id: userId, checkout_guard_id: attemptId },
      subscription_data: { metadata: { user_id: userId, checkout_guard_id: attemptId } },
      line_items: [{ price: 'price_test', quantity: 1 }],
      success_url: 'https://example.invalid/success', cancel_url: 'https://example.invalid/cancel',
    },
  };
}

class MemoryStore implements CheckoutGuardStore {
  row: CheckoutAttempt | null = null;
  async reserve(value: CheckoutAttempt) { if (!this.row) this.row = structuredClone(value); return structuredClone(this.row); }
  async saveSession(attempt: CheckoutAttempt, id: string) {
    if (this.row?.attempt_id !== attempt.attempt_id) return false;
    this.row.stripe_session_id = id;
    return true;
  }
  async replace(previous: CheckoutAttempt, value: CheckoutAttempt) {
    if (this.row?.attempt_id !== previous.attempt_id) return false;
    this.row = structuredClone(value);
    return true;
  }
}

function fakeStripe() {
  const sessions = new Map<string, { id: string; status: string; mode: string; client_reference_id: string; metadata: Record<string, string>; url: string; subscription: string | null }>();
  const requests = new Map<string, string>();
  let subscriptionStatus = 'active';
  const stripe = {
    checkout: { sessions: {
      create: async (params: Stripe.Checkout.SessionCreateParams, options: { idempotencyKey: string }) => {
        const existing = requests.get(options.idempotencyKey);
        const serialized = JSON.stringify(params);
        if (!existing && typeof params.expires_at === 'number' && params.expires_at <= Date.now() / 1000) {
          throw Object.assign(new Error('Expired checkout'), { type: 'StripeInvalidRequestError', param: 'expires_at' });
        }
        if (existing) assert.equal(existing, serialized, 'Idempotent retries must use identical parameters');
        else requests.set(options.idempotencyKey, serialized);
        const id = `cs_${options.idempotencyKey}`;
        if (!sessions.has(id)) sessions.set(id, { id, status: 'open', mode: 'subscription', client_reference_id: userId, metadata: params.metadata as Record<string, string>, url: `https://example.invalid/${id}`, subscription: null });
        await new Promise(resolve => setTimeout(resolve, 2));
        return sessions.get(id);
      },
      retrieve: async (id: string) => sessions.get(id),
    } },
    subscriptions: { retrieve: async () => ({ status: subscriptionStatus }) },
  } as unknown as Stripe;
  return { stripe, sessions, requests, setSubscriptionStatus: (status: string) => { subscriptionStatus = status; } };
}

test('concurrent checkout clicks reuse one Stripe session with one idempotency key', async () => {
  const store = new MemoryStore();
  const fake = fakeStripe();
  const run = () => guardedCheckout({ stripe: fake.stripe, store, userId, plan: 'monthly', candidate, findBlocker: async () => null });
  const results = await Promise.all(Array.from({ length: 12 }, run));
  assert.equal(fake.sessions.size, 1);
  assert.equal(fake.requests.size, 1);
  const urls = results.map(result => 'url' in result ? result.url : null);
  assert.ok(urls.every(url => url && url === urls[0]));
});

test('an open checkout cannot silently switch plans, and an expired one can be replaced', async () => {
  const store = new MemoryStore();
  const fake = fakeStripe();
  const run = (plan: CheckoutPlan) => guardedCheckout({ stripe: fake.stripe, store, userId, plan, candidate: () => candidate(plan), findBlocker: async () => null });
  await run('monthly');
  assert.deepEqual(await run('annual'), { blocker: 'different_plan' });
  assert.equal(fake.sessions.size, 1);
  fake.sessions.values().next().value!.status = 'expired';
  assert.ok('url' in await run('annual'));
  assert.equal(fake.sessions.size, 2);
});

test('concurrent clicks on different plans cannot produce two sessions', async () => {
  const store = new MemoryStore();
  const fake = fakeStripe();
  const run = (plan: CheckoutPlan) => guardedCheckout({ stripe: fake.stripe, store, userId, plan, candidate: () => candidate(plan), findBlocker: async () => null });
  const results = await Promise.all([run('monthly'), run('annual')]);
  assert.equal(fake.sessions.size, 1);
  assert.equal(results.filter(result => 'url' in result).length, 1);
  assert.equal(results.filter(result => 'blocker' in result && result.blocker === 'different_plan').length, 1);
});

test('a completed active subscription blocks a new checkout; a canceled one can be replaced', async () => {
  const store = new MemoryStore();
  const fake = fakeStripe();
  const run = () => guardedCheckout({ stripe: fake.stripe, store, userId, plan: 'monthly', candidate, findBlocker: async () => null });
  await run();
  const session = fake.sessions.values().next().value!;
  session.status = 'complete';
  session.subscription = 'sub_test';
  assert.deepEqual(await run(), { blocker: 'existing_subscription' });
  fake.setSubscriptionStatus('canceled');
  assert.ok('url' in await run());
  assert.equal(fake.sessions.size, 2);
});

test('billing uncertainty and corrupted attempt ownership fail closed', async () => {
  const store = new MemoryStore();
  const fake = fakeStripe();
  const args = { stripe: fake.stripe, store, userId, plan: 'monthly' as const, candidate, findBlocker: async () => 'unverified_subscription' as const };
  assert.deepEqual(await guardedCheckout(args), { blocker: 'unverified_subscription' });
  assert.equal(fake.sessions.size, 0);
  store.row!.session_params.client_reference_id = 'another-user';
  await assert.rejects(guardedCheckout(args));
  assert.equal(fake.sessions.size, 0);
});

test('an expired attempt that never reached Stripe can be safely replaced', async () => {
  const store = new MemoryStore();
  const fake = fakeStripe();
  store.row = candidate('monthly');
  const oldExpiry = Math.floor(Date.now() / 1000) - 120;
  store.row.session_params.expires_at = oldExpiry;
  store.row.expires_at = new Date(oldExpiry * 1000).toISOString();
  const result = await guardedCheckout({ stripe: fake.stripe, store, userId, plan: 'annual', candidate: () => candidate('annual'), findBlocker: async () => null });
  assert.ok('url' in result);
  assert.equal(store.row?.plan, 'annual');
  assert.equal(fake.sessions.size, 1);
});
