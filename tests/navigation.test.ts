import assert from 'node:assert/strict';
import { test } from 'node:test';
import { confirmationDestination, confirmationReturnPath, isSavedThreadReturn, safeReturnPath } from '../lib/navigation';

test('return destinations preserve saved threads and selected plans', () => {
  for (const path of ['/app?restore=1', '/pricing?plan=annual&utm_source=youtube', '/invite/FRIENDSV2']) {
    assert.equal(safeReturnPath(path), path);
  }
  assert.equal(isSavedThreadReturn('/app?utm_source=youtube&restore=1'), true);
  assert.equal(isSavedThreadReturn('/app?restore=0'), false);
  assert.equal(isSavedThreadReturn('/other?next=/app?restore=1'), false);
});

test('return destinations reject external and disguised external navigation', () => {
  for (const path of ['https://example.com', '//example.com', '/\\example.com', '/\n/example.com', 'javascript:alert(1)', null, '']) {
    assert.equal(safeReturnPath(path), '/dashboard');
  }
  assert.equal(safeReturnPath(null, '/onboarding'), '/onboarding');
});

test('email confirmation preserves a selected plan or saved thread before onboarding', () => {
  assert.equal(confirmationDestination(null, '/pricing?plan=monthly&utm_source=youtube', false), '/pricing?plan=monthly&utm_source=youtube');
  assert.equal(confirmationDestination('/pricing?plan=annual', '/pricing?plan=monthly', false), '/pricing?plan=annual');
  assert.equal(confirmationDestination(null, '/app?restore=1', false), '/app?restore=1');
  assert.equal(confirmationDestination(null, null, false), '/onboarding');
  assert.equal(confirmationDestination(null, null, true), '/dashboard');
  assert.equal(confirmationDestination(null, '/invite/FRIENDSV2', true), '/invite/FRIENDSV2');
});

test('email confirmation ignores untrusted destinations', () => {
  for (const path of ['https://evil.example', '//evil.example', '/\\evil.example', '/pricing-evil']) {
    assert.equal(confirmationDestination(null, path, false), '/onboarding');
  }
});

test('email links retain the requested trial only from an approved callback origin', () => {
  const destination = '/pricing?plan=monthly&trial=1&utm_source=youtube';
  const callback = `https://textwingman.app/auth/confirm?next=${encodeURIComponent(destination)}`;
  assert.equal(confirmationReturnPath(callback), destination);
  assert.equal(confirmationDestination(confirmationReturnPath(callback), null, false), destination);
  assert.equal(confirmationReturnPath('https://evil.example/auth/confirm?next=%2Fpricing'), null);
  assert.equal(confirmationReturnPath('https://textwingman.app.evil.example/auth/confirm?next=%2Fpricing'), null);
  assert.equal(confirmationReturnPath('https://textwingman.app/other?next=%2Fpricing'), null);
  assert.equal(confirmationDestination(confirmationReturnPath('https://textwingman.app/auth/confirm?next=%2F%2Fevil.example'), null, false), '/onboarding');
});
