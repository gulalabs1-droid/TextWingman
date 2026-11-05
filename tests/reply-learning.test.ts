import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isOutcomeDue, OUTCOME_ASK_AFTER_MS, OUTCOME_EXPIRES_AFTER_MS, type PendingOutcome } from '../lib/reply-learning';

const pending = (copiedAt: number): PendingOutcome => ({
  generationId: 'gen_1',
  replyId: 'gen_1:shorter',
  tone: 'shorter',
  context: 'crush',
  theirMessagePreview: 'haha maybe',
  copiedAt,
});

test('return-visit outcome prompt waits until a reply could have arrived', () => {
  const now = 1_800_000_000_000;
  assert.equal(isOutcomeDue(pending(now - 60_000), now), false);
  assert.equal(isOutcomeDue(pending(now - OUTCOME_ASK_AFTER_MS), now), true);
  assert.equal(isOutcomeDue(pending(now - 2 * 24 * 60 * 60 * 1000), now), true);
});

test('return-visit outcome prompt expires and ignores missing data', () => {
  const now = 1_800_000_000_000;
  assert.equal(isOutcomeDue(pending(now - OUTCOME_EXPIRES_AFTER_MS - 1), now), false);
  assert.equal(isOutcomeDue(null, now), false);
  assert.equal(isOutcomeDue(pending(Number.NaN), now), false);
});
