import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCoachReply, readCoachStream, visibleCoachText, type CoachStreamEvent } from '../lib/coach-stream';

test('streamed coach text never shows the draft block or a partial marker', () => {
  assert.equal(visibleCoachText('She is into it. Keep it light.'), 'She is into it. Keep it light.');
  assert.equal(visibleCoachText('Keep it light.\n\nDRA'), 'Keep it light.');
  assert.equal(visibleCoachText('Keep it light.\n\nDRAFT: {"shorter": "bet'), 'Keep it light.');
  assert.equal(visibleCoachText('D'), '');
  assert.equal(visibleCoachText('Do this'), 'Do this');
});

test('visible text only ever grows while the model keeps writing', () => {
  const full = 'You are chasing. Pull back.\n\nDRAFT: {"shorter": "all good", "spicier": "your loss", "softer": "no rush"}';
  let shown = '';
  for (let i = 1; i <= full.length; i++) {
    const visible = visibleCoachText(full.slice(0, i));
    if (visible.length > shown.length) {
      assert.ok(visible.startsWith(shown));
      shown = visible;
    }
  }
  assert.equal(shown, 'You are chasing. Pull back.');
});

test('final reply separates coaching from drafts and survives bad JSON', () => {
  assert.deepEqual(parseCoachReply('Pull back.\n\nDRAFT: {"shorter": "all good"}'), { reply: 'Pull back.', draft: { shorter: 'all good' } });
  assert.deepEqual(parseCoachReply('Just coaching.'), { reply: 'Just coaching.', draft: null });
  assert.deepEqual(parseCoachReply('Oops DRAFT: {broken}'), { reply: 'Oops DRAFT: {broken}', draft: null });
});

test('stream reader handles events split across chunks', async () => {
  const encoder = new TextEncoder();
  const chunks = ['{"t":"delta","v":"Pull"}\n{"t":"del', 'ta","v":" back."}\n', '{"t":"done","reply":"Pull back.","draft":null,"verified":false}'];
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  const events: CoachStreamEvent[] = [];
  await readCoachStream(body, event => events.push(event));
  assert.deepEqual(events.map(event => event.t), ['delta', 'delta', 'done']);
  assert.equal(events[1].t === 'delta' && events[1].v, ' back.');
});
