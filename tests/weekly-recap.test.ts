import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeWeek } from '../lib/weekly-recap';

const now = Date.parse('2026-11-20T12:00:00Z');
const at = (daysAgo: number) => new Date(now - daysAgo * 86_400_000).toISOString();
const row = (event_type: string, daysAgo: number, tone: string | null = 'spicier', outcome: string | null = null) => ({ event_type, tone, outcome, created_at: at(daysAgo) });

test('the week counts replies used, answers and the style that is landing', () => {
  const recap = summarizeWeek([
    row('copied', 1), row('copied', 2), row('copied', 3), row('copied', 9),
    row('outcome_reported', 1, 'spicier', 'got_reply'), row('outcome_reported', 2, 'spicier', 'got_reply'),
    row('outcome_reported', 3, 'softer', 'no_reply'), row('outcome_reported', 12, 'softer', 'got_reply'),
  ], now);
  assert.deepEqual(recap, { used: 3, answered: 2, reported: 3, bestStyle: 'bold, playful' });
});

test('one lucky answer does not name a best style', () => {
  const recap = summarizeWeek([row('copied', 1), row('outcome_reported', 1, 'softer', 'got_reply')], now);
  assert.equal(recap?.bestStyle, null);
});

test('sends count when nothing was copied, and an empty week returns nothing', () => {
  assert.equal(summarizeWeek([row('sent_confirmed', 1), row('sent_confirmed', 2)], now)?.used, 2);
  assert.equal(summarizeWeek([row('copied', 20)], now), null);
  assert.equal(summarizeWeek([], now), null);
});
