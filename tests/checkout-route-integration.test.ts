import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import { test } from 'node:test';

const userId = '00000000-0000-0000-0000-000000000001';
const user = { id: userId, email: 'checkout-qa@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} };

function cookie() {
  const b64 = (x: unknown) => Buffer.from(JSON.stringify(x)).toString('base64url');
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: userId, exp: expires, role: 'authenticated' })}.mock`;
  return `sb-127-auth-token=base64-${b64({ access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: expires, refresh_token: 'mock-refresh', user })}`;
}

test('checkout route prevents duplicate sessions and pauses new trials', { timeout: 60000 }, async () => {
  type Row = { user_id: string; attempt_id: string; stripe_session_id: string | null; [key: string]: unknown };
  type Session = { id: string; object: string; mode: string; status: string; url: string; client_reference_id: string; metadata: Record<string, string>; subscription: string | null };
  let guard: Row | null = null;
  let subscriptionStatus: 'active' | 'canceled' | null = null;
  let failGuard = false;
  const sessions = new Map<string, Session>();
  const requests = new Map<string, string>();
  const send = (res: ServerResponse, status: number, body: unknown, extra: Record<string, string> = {}) => {
    res.writeHead(status, { 'content-type': 'application/json', ...extra });
    res.end(body === null ? '' : JSON.stringify(body));
  };
  const readBody = async (req: IncomingMessage) => { let raw = ''; for await (const chunk of req) raw += chunk; return raw; };
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      if (url.pathname === '/auth/v1/user') return send(res, 200, user);
      if (url.pathname === '/rest/v1/rpc/take_security_rate_limit') return send(res, 200, [{ allowed: true, retry_after_seconds: 600 }]);
      if (url.pathname === '/rest/v1/subscriptions') return send(res, 200, []);
      if (url.pathname === '/rest/v1/checkout_guards') {
        if (failGuard) return send(res, 500, { code: 'test_failure', message: 'Unavailable' });
        if (req.method === 'POST') {
          const value = JSON.parse(await readBody(req)) as Row;
          if (guard) return send(res, 409, { code: '23505', message: 'Duplicate key' });
          guard = value;
          return send(res, 201, null);
        }
        if (req.method === 'GET') return guard ? send(res, 200, guard) : send(res, 406, { code: 'PGRST116' });
        if (req.method === 'PATCH') {
          const value = JSON.parse(await readBody(req)) as Partial<Row>;
          const expectedAttempt = url.searchParams.get('attempt_id')?.replace(/^eq\./, '');
          if (!guard || guard.attempt_id !== expectedAttempt) return send(res, 200, []);
          guard = { ...guard, ...value };
          return send(res, 200, [{ attempt_id: guard.attempt_id }]);
        }
      }
      if (url.pathname === '/stripe/v1/subscriptions/search') {
        const data = subscriptionStatus ? [{ id: 'sub_local', object: 'subscription', status: subscriptionStatus, metadata: { user_id: userId }, items: { data: [{ price: { id: 'price_monthly' } }] } }] : [];
        return send(res, 200, { object: 'search_result', data, has_more: false, next_page: null, url: '/v1/subscriptions/search' });
      }
      if (url.pathname === '/stripe/v1/customers') return send(res, 200, { object: 'list', data: [], has_more: false, url: '/v1/customers' });
      if (url.pathname === '/stripe/v1/checkout/sessions' && req.method === 'GET') return send(res, 200, { object: 'list', data: [...sessions.values()], has_more: false, url: '/v1/checkout/sessions' });
      if (url.pathname === '/stripe/v1/checkout/sessions' && req.method === 'POST') {
        const body = await readBody(req);
        const idempotencyKey = String(req.headers['idempotency-key'] || '');
        if (!idempotencyKey.startsWith('text-wingman-checkout-')) return send(res, 400, { error: { type: 'invalid_request_error', message: 'Missing test idempotency key' } });
        const existing = requests.get(idempotencyKey);
        if (existing && existing !== body) return send(res, 400, { error: { type: 'idempotency_error', message: 'Parameters changed' } });
        requests.set(idempotencyKey, body);
        const id = `cs_test_${idempotencyKey.slice(-36)}`;
        if (!sessions.has(id)) {
          const data = new URLSearchParams(body);
          if (data.get('client_reference_id') !== userId || data.has('subscription_data[trial_period_days]')) return send(res, 400, { error: { type: 'invalid_request_error', message: 'Invalid test request' } });
          sessions.set(id, { id, object: 'checkout.session', mode: 'subscription', status: 'open', url: `https://checkout.stripe.com/c/pay/${id}`, client_reference_id: userId, metadata: { user_id: userId, checkout_guard_id: data.get('metadata[checkout_guard_id]') || '' }, subscription: null });
        }
        return send(res, 200, sessions.get(id), { 'request-id': 'req_local_checkout' });
      }
      if (url.pathname.startsWith('/stripe/v1/checkout/sessions/') && req.method === 'GET') {
        const session = sessions.get(url.pathname.split('/').pop() || '');
        return session ? send(res, 200, session, { 'request-id': 'req_local_session' }) : send(res, 404, { error: { type: 'invalid_request_error', message: 'Missing session' } });
      }
      if (url.pathname === '/stripe/v1/subscriptions/sub_local') return send(res, 200, { id: 'sub_local', object: 'subscription', status: subscriptionStatus, metadata: { user_id: userId }, items: { data: [{ price: { id: 'price_monthly' } }] } });
      return send(res, 404, { error: 'Unexpected local test request' });
    } catch {
      return send(res, 500, { error: 'Local test server failed' });
    }
  });

  let app: ChildProcess | undefined;
  let output = '';
  try {
    await new Promise<void>(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No local test port');
    const probe = createServer();
    await new Promise<void>(resolveListen => probe.listen(0, '127.0.0.1', resolveListen));
    const appAddress = probe.address();
    if (!appAddress || typeof appAddress === 'string') throw new Error('No local app port');
    const appPort = appAddress.port;
    await new Promise<void>((resolveClose, reject) => probe.close(error => error ? reject(error) : resolveClose()));
    app = spawn('./node_modules/.bin/next', ['dev', '--hostname', '127.0.0.1', '--port', String(appPort)], {
      cwd: process.cwd(),
      env: { ...process.env, NODE_OPTIONS: `--require ${resolve('tests/fixtures/stripe-local-only.cjs')}`, CHECKOUT_TEST_PORT: String(address.port), NODE_ENV: 'development', NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${address.port}`, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon', SUPABASE_SERVICE_ROLE_KEY: 'test-service', STRIPE_SECRET_KEY: 'sk_test_local_only', STRIPE_PRICE_ID_MONTHLY: 'price_monthly', STRIPE_PRICE_ID_ANNUAL: 'price_annual', NEXT_PUBLIC_APP_URL: 'https://example.invalid', OPENAI_API_KEY: 'test-openai' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    app.stdout?.on('data', chunk => { output = (output + chunk.toString()).slice(-8000); });
    app.stderr?.on('data', chunk => { output = (output + chunk.toString()).slice(-8000); });
    for (let i = 0; i < 100 && !/Ready in/.test(output); i++) {
      if (app.exitCode !== null) throw new Error('Local app exited before it was ready');
      await new Promise(resolveWait => setTimeout(resolveWait, 300));
    }
    if (!/Ready in/.test(output)) throw new Error('Local app did not start');
    const checkout = (body: object, signedIn = true) => fetch(`http://127.0.0.1:${appPort}/api/checkout`, { method: 'POST', headers: { 'content-type': 'application/json', ...(signedIn ? { cookie: cookie() } : {}) }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    assert.equal((await checkout({ plan: 'monthly' }, false)).status, 401);
    assert.equal((await checkout({ plan: 'monthly', trial: true })).status, 409);
    const concurrent = await Promise.all(Array.from({ length: 8 }, () => checkout({ plan: 'monthly' })));
    assert.ok(concurrent.every(response => response.status === 200), `Concurrent checkout responses: ${concurrent.map(response => response.status).join(', ')}`);
    const urls = await Promise.all(concurrent.map(async response => (await response.json()).url));
    assert.ok(urls.every(url => url === urls[0]));
    assert.equal(sessions.size, 1);
    assert.equal((await checkout({ plan: 'annual' })).status, 409);

    const firstSession = sessions.values().next().value!;
    firstSession.status = 'complete';
    firstSession.subscription = 'sub_local';
    subscriptionStatus = 'active';
    assert.equal((await checkout({ plan: 'monthly' })).status, 409);
    subscriptionStatus = 'canceled';
    assert.equal((await checkout({ plan: 'annual' })).status, 200);
    assert.equal(sessions.size, 2);
    failGuard = true;
    assert.equal((await checkout({ plan: 'monthly' })).status, 500);
    assert.equal(sessions.size, 2);
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : 'Integration test failed'}\n${output.replace(/(?:sk|rk)_(?:test|live)_[A-Za-z0-9_]+/g, '[redacted]')}`);
  } finally {
    if (app) app.kill('SIGTERM');
    await new Promise<void>(resolveClose => { server.close(() => resolveClose()); server.closeAllConnections(); });
  }
});
