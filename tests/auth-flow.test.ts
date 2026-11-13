import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { authEmailOptions, friendlyAuthError, isNewlyCreatedUser, isPlausibleOtp, normalizeOtp, passwordSignupError, postAuthDestination } from '../lib/auth-flow';

test('email codes accept pasted formatting and reject partial codes', () => {
  assert.equal(normalizeOtp(' 123 456 '), '123456');
  assert.equal(normalizeOtp('12-34-56-78'), '12345678');
  assert.equal(isPlausibleOtp('123456'), true);
  assert.equal(isPlausibleOtp('12345'), false);
  assert.equal(isPlausibleOtp('12345a'), false);
});

test('after sign-in, a saved thread or plan wins over onboarding', () => {
  assert.equal(postAuthDestination('/app?restore=1', false), '/app?restore=1');
  assert.equal(postAuthDestination('/pricing?plan=annual', false), '/pricing?plan=annual');
  assert.equal(postAuthDestination(null, false), '/onboarding');
  assert.equal(postAuthDestination(null, true), '/app');
});

test('new accounts are distinguished from returning sign-ins', () => {
  const now = Date.parse('2026-11-05T12:00:00Z');
  assert.equal(isNewlyCreatedUser('2026-11-05T11:58:00Z', now), true);
  assert.equal(isNewlyCreatedUser('2026-10-01T00:00:00Z', now), false);
  assert.equal(isNewlyCreatedUser(undefined, now), false);
});

test('auth errors are shown in plain language', () => {
  assert.match(friendlyAuthError('For security purposes, you can only request this after 42 seconds.'), /Wait a minute/);
  assert.match(friendlyAuthError('email rate limit exceeded'), /Wait a minute/);
  assert.match(friendlyAuthError('Token has expired or is invalid'), /wrong or expired/);
  assert.match(friendlyAuthError('Invalid login credentials'), /incorrect/);
  assert.match(friendlyAuthError('Unable to validate email address: invalid format'), /valid email/);
  assert.equal(friendlyAuthError('weird upstream failure'), 'Something went wrong. Please try again.');
});

test('new password validation requires sufficient length and a matching confirmation', () => {
  assert.match(passwordSignupError('short', 'short') || '', /at least 8/);
  assert.match(passwordSignupError('long-enough', 'different') || '', /do not match/);
  assert.equal(passwordSignupError('long-enough', 'long-enough'), null);
});

test('confirmation options preserve selected plans and invites without inventing a return', () => {
  const plan = '/pricing?plan=monthly&trial=1';
  assert.deepEqual(authEmailOptions('https://textwingman.app', plan), {
    emailRedirectTo: 'https://textwingman.app/auth/confirm?next=%2Fpricing%3Fplan%3Dmonthly%26trial%3D1',
    data: { signup_return_to: plan },
  });
  assert.deepEqual(authEmailOptions('https://textwingman.app', '/invite/abc123').data, {
    pending_invite_code: 'ABC123',
    signup_return_to: '/invite/abc123',
  });
  assert.deepEqual(authEmailOptions('https://textwingman.app', null).data, {});
});

test('password signup sends the plan to Supabase and waits for confirmation', async () => {
  let requestUrl = '';
  let requestBody: Record<string, unknown> = {};
  const supabase = createClient('https://example.supabase.co', 'test-anon-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        requestUrl = String(input);
        requestBody = JSON.parse(String(init?.body));
        return new Response(JSON.stringify({ id: 'test-user', email: 'test@example.invalid' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      },
    },
  });
  const plan = '/pricing?plan=monthly&trial=1';
  const { data, error } = await supabase.auth.signUp({
    email: 'test@example.invalid',
    password: 'example-password',
    options: authEmailOptions('https://textwingman.app', plan),
  });
  assert.equal(error, null);
  assert.equal(data.session, null);
  assert.equal(new URL(requestUrl).searchParams.get('redirect_to'), `https://textwingman.app/auth/confirm?next=${encodeURIComponent(plan)}`);
  assert.equal(requestBody.email, 'test@example.invalid');
  assert.deepEqual(requestBody.data, { signup_return_to: plan });
});
