import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FREE_REPLY_LIMIT,
  REPLY_USAGE_WINDOW_HOURS,
  freeLimitReached,
  remainingFreeUses,
  replyUsageCutoff,
} from '../lib/usage-limits';
import { hasPro } from '../lib/entitlements';

test('free users can make three uses in a rolling 24-hour window', () => {
  assert.equal(FREE_REPLY_LIMIT, 3);
  assert.equal(REPLY_USAGE_WINDOW_HOURS, 24);
  assert.equal(replyUsageCutoff(Date.parse('2026-11-10T12:00:00Z')), '2026-11-09T12:00:00.000Z');
  assert.deepEqual([0, 1, 2, 3, 4].map(remainingFreeUses), [3, 2, 1, 0, 0]);
  assert.deepEqual([0, 1, 2, 3, 4].map(freeLimitReached), [false, false, false, true, true]);
});

test('Pro and Elite access remain separate from the free allowance', () => {
  assert.equal(hasPro('free'), false);
  assert.equal(hasPro('pro'), true);
  assert.equal(hasPro('elite'), true);
});
