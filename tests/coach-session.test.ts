import assert from 'node:assert/strict';
import test from 'node:test';
import { restoreCoachSession, serializeCoachMessage } from '../lib/coach-session';

const analysis = {
  mode: 'orchestrate',
  winner: { text: 'thursday works, pick the spot' },
  strategy: { momentum: 'Rising', balance: 'Even', move: { energy: 'escalate', one_liner: 'Lock a day.' } },
};

test('a saved Coach chat keeps the screenshot conversation and the Deep Analysis', () => {
  const stored = [
    serializeCoachMessage({ role: 'user', content: '', images: ['data:image/jpeg;base64,AAAA'], threadText: 'Them: drinks?\nYou: depends' }),
    serializeCoachMessage({ role: 'assistant', content: '', orchestration: analysis }),
  ];
  assert.equal(stored[0].content, '📷 Screenshot');
  assert.ok(!('images' in stored[0]), 'screenshots themselves are not stored');

  const restored = restoreCoachSession('coach', JSON.parse(JSON.stringify(stored)));
  assert.equal(restored.threadText, 'Them: drinks?\nYou: depends');
  assert.equal(restored.history[1].orchestration?.winner?.text, 'thursday works, pick the spot');
  assert.equal(restored.read?.momentum, 'Rising');
});

test('the latest screenshot conversation wins', () => {
  const restored = restoreCoachSession('coach', [
    { role: 'user', content: '📷 Screenshot', thread: 'Them: first' },
    { role: 'assistant', content: 'read one' },
    { role: 'user', content: '📷 Screenshot', thread: 'Them: second' },
  ]);
  assert.equal(restored.threadText, 'Them: second');
});

test('a chat without a screenshot or analysis restores empty context, not stale context', () => {
  const restored = restoreCoachSession('coach', [
    { role: 'user', content: 'she said hey' },
    { role: 'assistant', content: 'Keep it light.', draft: { shorter: 'hey you' } },
  ]);
  assert.equal(restored.threadText, '');
  assert.equal(restored.read, null);
  assert.equal(restored.history[1].draft?.shorter, 'hey you');
});

test('older chats saved before this change still load', () => {
  const restored = restoreCoachSession('coach', [
    { role: 'user', content: 'what now' },
    { role: 'assistant', content: '', orchestration: null },
  ]);
  assert.equal(restored.history.length, 2);
  assert.equal(restored.threadText, '');
});

test('a saved reply thread becomes the conversation Coach reasons about', () => {
  const restored = restoreCoachSession('thread', [
    { role: 'them', text: 'Can you send the deck by 5?' },
    { role: 'you', text: 'Yes, finishing it now' },
  ]);
  assert.equal(restored.threadText, 'Them: Can you send the deck by 5?\nYou: Yes, finishing it now');
  assert.equal(restored.history[0].role, 'user');
  assert.equal(restored.read, null);
});

test('malformed saved data does not throw', () => {
  assert.deepEqual(restoreCoachSession('coach', null).history, []);
  assert.deepEqual(restoreCoachSession('coach', [null, 3, 'x']).history, []);
});

test('the homepage handoff becomes a Coach chat with its replies', async () => {
  const { coachSessionFromPending } = await import('../lib/coach-session');
  const session = coachSessionFromPending({
    thread: [{ role: 'them', text: 'are we still on for friday?' }],
    replies: [{ tone: 'shorter', text: 'yep, 8?' }, { tone: 'softer', text: 'wouldn’t miss it' }, { tone: 'weird', text: 'x' }],
    lastGeneratedMessage: 'are we still on for friday?',
  });
  assert.equal(session?.history[0].content, 'They sent me: "are we still on for friday?"\nWhat should I reply?');
  assert.deepEqual(session?.history[1].draft, { shorter: 'yep, 8?', spicier: undefined, softer: 'wouldn’t miss it' });
  assert.equal(session?.threadText, 'Them: are we still on for friday?');
});

test('a handoff without replies still opens Coach on the message', async () => {
  const { coachSessionFromPending } = await import('../lib/coach-session');
  const session = coachSessionFromPending({ thread: [{ role: 'them', text: 'wyd' }] });
  assert.equal(session?.history.length, 1);
  assert.equal(coachSessionFromPending({ thread: [] }), null);
});
