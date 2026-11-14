import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { subscriptionPeriodEnd } from '../lib/stripe-subscription';

test('billing periods work with old and current Stripe event formats', () => {
  const expected = new Date(2000000000 * 1000).toISOString();
  assert.equal(subscriptionPeriodEnd({ current_period_end: 2000000000 }), expected);
  assert.equal(subscriptionPeriodEnd({ items: { data: [{ current_period_end: 2000000000 }] } }), expected);
  assert.equal(subscriptionPeriodEnd({ items: { data: [] } }), null);
  assert.equal(subscriptionPeriodEnd({ current_period_end: Infinity }), null);
});

test('signed current-version subscription webhooks update stored access', async () => {
  const previous = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  };
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.example.invalid';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  process.env.STRIPE_SECRET_KEY = 'sk_test_local_only';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_local_test_only';

  const originalFetch = globalThis.fetch;
  const updates: Array<Record<string, unknown>> = [];
  let returnRows = true;
  globalThis.fetch = async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    assert.ok(['POST', 'PATCH'].includes(request.method));
    assert.equal(new URL(request.url).pathname, '/rest/v1/subscriptions');
    updates.push(await request.json() as Record<string, unknown>);
    return new Response(JSON.stringify(returnRows ? [{ id: 'row_test' }] : []), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  };

  try {
    const { POST } = await import('../app/api/webhooks/stripe/route');
    const { stripe: appStripe } = await import('../lib/stripe');
    const subscriptions = appStripe.subscriptions as unknown as { retrieve: (id: string) => Promise<unknown> };
    const originalRetrieve = subscriptions.retrieve;
    let currentSubscription: Record<string, unknown> = {};
    subscriptions.retrieve = async () => currentSubscription;
    const stripe = new Stripe('sk_test_local_only', { apiVersion: '2024-04-10' });
    for (const [eventType, snapshotStatus, currentStatus] of [
      ['customer.subscription.created', 'trialing', 'paused'],
      ['customer.subscription.updated', 'trialing', 'paused'],
      ['customer.subscription.paused', 'paused', 'paused'],
      ['customer.subscription.resumed', 'active', 'active'],
    ]) {
      currentSubscription = {
        id: 'sub_test', customer: 'cus_test', status: currentStatus,
        metadata: { user_id: '00000000-0000-0000-0000-000000000001' },
        items: { data: [{ price: { id: 'price_1U9FJCHpik4qZqqSxWQOqixC' }, current_period_end: 2000000000 }] },
        cancel_at_period_end: false, canceled_at: null,
      };
      const payload = JSON.stringify({
        id: `evt_${eventType}`,
        object: 'event',
        type: eventType,
        data: { object: {
          id: 'sub_test', customer: 'cus_test', status: snapshotStatus, metadata: { user_id: '00000000-0000-0000-0000-000000000001' },
          items: { data: [{ price: { id: 'price_1U9FJCHpik4qZqqSxWQOqixC' }, current_period_end: 2000000000 }] },
          cancel_at_period_end: false, canceled_at: null,
        } },
      });
      const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_local_test_only' });
      const response = await POST(new NextRequest('https://example.invalid/api/webhooks/stripe', {
        method: 'POST', headers: { 'stripe-signature': signature }, body: payload,
      }));
      assert.equal(response.status, 200);
    }
    assert.deepEqual(updates.map(update => update.status), ['paused', 'paused', 'paused', 'active']);
    assert.ok(updates.every(update => update.current_period_end === new Date(2000000000 * 1000).toISOString()));

    const userId = '00000000-0000-0000-0000-000000000001';
    const sendEvent = async (event: Record<string, unknown>) => {
      const payload = JSON.stringify(event);
      const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_local_test_only' });
      return POST(new NextRequest('https://example.invalid/api/webhooks/stripe', {
        method: 'POST', headers: { 'stripe-signature': signature }, body: payload,
      }));
    };
    currentSubscription = {
      id: 'sub_test', customer: 'cus_test', status: 'active', metadata: { user_id: userId },
      items: { data: [{ price: { id: 'price_1U9FJCHpik4qZqqSxWQOqixC' }, current_period_end: 2000000000 }] },
      cancel_at_period_end: false, canceled_at: null,
    };
    const checkoutResponse = await sendEvent({
      id: 'evt_checkout', object: 'event', type: 'checkout.session.completed',
      data: { object: { id: 'cs_test', customer: 'cus_test', subscription: 'sub_test', client_reference_id: userId } },
    });
    assert.equal(checkoutResponse.status, 200);
    assert.equal(updates.at(-1)?.user_id, userId);
    assert.equal(updates.at(-1)?.stripe_subscription_id, 'sub_test');
    assert.equal(updates.at(-1)?.status, 'active');

    const canceledResponse = await sendEvent({
      id: 'evt_canceled', object: 'event', type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_test' } },
    });
    assert.equal(canceledResponse.status, 200);
    assert.equal(updates.at(-1)?.status, 'canceled');

    const updateCount = updates.length;
    const unsignedResponse = await POST(new NextRequest('https://example.invalid/api/webhooks/stripe', {
      method: 'POST', body: '{}',
    }));
    assert.equal(unsignedResponse.status, 400);
    const invalidSignatureResponse = await POST(new NextRequest('https://example.invalid/api/webhooks/stripe', {
      method: 'POST', headers: { 'stripe-signature': 'invalid' }, body: '{}',
    }));
    assert.equal(invalidSignatureResponse.status, 400);
    assert.equal(updates.length, updateCount);

    returnRows = false;
    const missingPayload = JSON.stringify({ id: 'evt_missing', object: 'event', type: 'customer.subscription.updated', data: { object: { id: 'sub_test' } } });
    const missingSignature = stripe.webhooks.generateTestHeaderString({ payload: missingPayload, secret: 'whsec_local_test_only' });
    const missingResponse = await POST(new NextRequest('https://example.invalid/api/webhooks/stripe', {
      method: 'POST', headers: { 'stripe-signature': missingSignature }, body: missingPayload,
    }));
    assert.equal(missingResponse.status, 500);
    subscriptions.retrieve = originalRetrieve;
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
