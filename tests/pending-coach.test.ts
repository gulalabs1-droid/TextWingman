import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePendingCoach, resumePath, PENDING_COACH_MAX_AGE_MS } from '../lib/pending-coach';
import { isSavedThreadReturn } from '../lib/navigation';

const now = Date.parse('2026-11-20T12:00:00Z');
const saved = (extra: object = {}) => JSON.stringify({
  savedAt: now - 60_000,
  messages: [{ role: 'user', content: 'They sent me: "wyd"' }, { role: 'assistant', content: 'Keep it light.', draft: { shorter: 'nm, you?' } }],
  threadText: 'Them: wyd',
  context: 'crush',
  input: 'what if I say nothing',
  plan: 'monthly',
  ...extra,
});

test('a chat saved before sign-up comes back intact', () => {
  const pending = parsePendingCoach(saved(), now);
  assert.equal(pending?.messages.length, 2);
  assert.equal(pending?.threadText, 'Them: wyd');
  assert.equal(pending?.input, 'what if I say nothing');
  assert.equal(pending?.plan, 'monthly');
});

test('stale, future-dated or broken saves are ignored', () => {
  assert.equal(parsePendingCoach(saved({ savedAt: now - PENDING_COACH_MAX_AGE_MS - 1 }), now), null);
  assert.equal(parsePendingCoach(saved({ savedAt: now + 10 * 60_000 }), now), null);
  assert.equal(parsePendingCoach(saved({ messages: 'nope' }), now), null);
  assert.equal(parsePendingCoach('{', now), null);
  assert.equal(parsePendingCoach(null, now), null);
});

test('unknown plans default to annual', () => {
  assert.equal(parsePendingCoach(saved({ plan: 'weekly' }), now)?.plan, 'annual');
});

test('the resume link survives the email-confirmation return check', () => {
  assert.equal(resumePath('annual'), '/app?resume=1&plan=annual');
  assert.equal(isSavedThreadReturn(resumePath('annual')), true);
});
