import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isSavedThreadReturn, safeReturnPath } from '../lib/navigation';

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
