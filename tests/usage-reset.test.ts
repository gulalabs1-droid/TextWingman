import assert from 'node:assert/strict';
import test from 'node:test';
import { formatTimeUntil, nextFreeUseAt } from '../lib/usage-limits';

const now = Date.parse('2026-11-19T12:00:00Z');

test('the next free use returns 24 hours after the oldest use in the window', () => {
  assert.equal(nextFreeUseAt('2026-11-18T15:30:00Z', now), '2026-11-19T15:30:00.000Z');
});

test('no reset time when there is no use or it has already expired', () => {
  assert.equal(nextFreeUseAt(null, now), null);
  assert.equal(nextFreeUseAt('not a date', now), null);
  assert.equal(nextFreeUseAt('2026-11-18T11:00:00Z', now), null);
});

test('the wait reads naturally', () => {
  assert.equal(formatTimeUntil('2026-11-19T15:12:00Z', now), '3h 12m');
  assert.equal(formatTimeUntil('2026-11-19T15:00:00Z', now), '3h');
  assert.equal(formatTimeUntil('2026-11-19T12:45:00Z', now), '45m');
  assert.equal(formatTimeUntil('2026-11-19T12:00:30Z', now), 'under a minute');
  assert.equal(formatTimeUntil('2026-11-19T11:00:00Z', now), null);
  assert.equal(formatTimeUntil(null, now), null);
});
