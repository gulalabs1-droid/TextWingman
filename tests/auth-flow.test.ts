import assert from 'node:assert/strict';
import { test } from 'node:test';
import { friendlyAuthError, isNewlyCreatedUser, isPlausibleOtp, normalizeOtp, postAuthDestination } from '../lib/auth-flow';

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
  assert.equal(postAuthDestination(null, true), '/dashboard');
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
