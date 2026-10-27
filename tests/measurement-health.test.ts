import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasFreshExternalEvents } from '../lib/measurement-health';

test('an old event does not make collection health green', () => {
  const now = Date.parse('2026-10-27T12:00:00Z');
  assert.equal(hasFreshExternalEvents('2026-10-26T12:00:00Z', now), true);
  assert.equal(hasFreshExternalEvents('2026-10-12T12:00:00Z', now), false);
  assert.equal(hasFreshExternalEvents('2026-10-28T12:00:00Z', now), false);
  assert.equal(hasFreshExternalEvents(null, now), false);
  assert.equal(hasFreshExternalEvents('invalid', now), false);
});
