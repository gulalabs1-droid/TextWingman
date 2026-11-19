import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextRequest } from 'next/server';

test('checkout rejects malformed trial requests and pauses all new Pro trials', async () => {
  const previousKey = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = 'sk_test_local_only';
  try {
    const { POST } = await import('../app/api/checkout/route');
    for (const body of [
      { plan: 'monthly', trial: 'false' },
      { plan: 'monthly', trial: null },
      { plan: 'monthly', trial: {} },
    ]) {
      const response = await POST(new NextRequest('https://example.invalid/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }));
      assert.equal(response.status, 400, `Expected trial request ${JSON.stringify(body)} to be rejected`);
    }
    for (const plan of ['monthly', 'weekly', 'annual']) {
      const response = await POST(new NextRequest('https://example.invalid/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan, trial: true }),
      }));
      assert.equal(response.status, 409, `Expected a new ${plan} trial to be unavailable`);
    }
  } finally {
    if (previousKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previousKey;
  }
});
