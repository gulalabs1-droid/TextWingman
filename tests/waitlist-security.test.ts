import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextRequest } from 'next/server';

test('waitlist validates input, rate-limits, and does not disclose existing emails', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.example.invalid';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  const originalFetch = globalThis.fetch;
  let limited = false;
  let duplicate = false;
  let inserts = 0;
  globalThis.fetch = async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const path = new URL(request.url).pathname;
    if (path.endsWith('/rpc/take_security_rate_limit')) {
      return new Response(JSON.stringify([{ allowed: !limited, retry_after_seconds: 60 }]), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (path.endsWith('/v2_waitlist') && request.method === 'POST') {
      inserts++;
      if (duplicate) return new Response(JSON.stringify({ code: '23505', message: 'duplicate' }), { status: 409, headers: { 'content-type': 'application/json' } });
      return new Response(null, { status: 201 });
    }
    throw new Error('Unexpected test request');
  };
  try {
    const { POST } = await import('../app/api/waitlist/route');
    const request = (body: string) => new NextRequest('https://example.invalid/api/waitlist', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
    assert.equal((await POST(request('{'))).status, 400);
    assert.equal((await POST(request(JSON.stringify({ email: 'not-an-email' })))).status, 400);
    const first = await POST(request(JSON.stringify({ email: 'TEST@example.invalid' })));
    assert.equal(first.status, 200);
    const firstBody = await first.json();
    duplicate = true;
    const second = await POST(request(JSON.stringify({ email: 'TEST@example.invalid' })));
    assert.equal(second.status, 200);
    assert.deepEqual(await second.json(), firstBody);
    limited = true;
    assert.equal((await POST(request(JSON.stringify({ email: 'TEST@example.invalid' })))).status, 429);
    assert.equal(inserts, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
