import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_MESSAGE_LENGTH, MAX_SCREENSHOT_BYTES, validateMessage, validateQuickReplies, validateScreenshot } from '../lib/quick-reply';

test('messages are trimmed and validated before generation', () => {
  assert.deepEqual(validateMessage('  we need to talk  '), { message: 'we need to talk', error: null });
  for (const value of [null, {}, [], 42, '', '   ']) assert.ok(validateMessage(value).error);
  assert.equal(validateMessage('x'.repeat(MAX_MESSAGE_LENGTH)).error, null);
  assert.ok(validateMessage('x'.repeat(MAX_MESSAGE_LENGTH + 1)).error);
});

test('screenshots leave room for base64 within the hosting body limit', () => {
  assert.equal(validateScreenshot({ type: 'image/png', size: MAX_SCREENSHOT_BYTES }), null);
  assert.equal(validateScreenshot({ type: 'image/jpeg', size: 1024 }), null);
  assert.equal(validateScreenshot({ type: 'image/webp', size: 1024 }), null);
  assert.ok(validateScreenshot({ type: 'image/png', size: MAX_SCREENSHOT_BYTES + 1 }));
  assert.ok(validateScreenshot({ type: 'image/heic', size: 1024 }));
  assert.ok(validateScreenshot({ type: 'image/png', size: 0 }));
  assert.ok(Math.ceil(MAX_SCREENSHOT_BYTES / 3) * 4 + 1024 < 4.5 * 1024 * 1024);
});

test('three valid reply tones are presented in consistent order', () => {
  assert.deepEqual(validateQuickReplies([
    { tone: 'softer', text: ' Warm reply. ' },
    { tone: 'spicier', text: 'Another angle.' },
    { tone: 'shorter', text: 'Short reply.' },
    { tone: '__proto__', text: 'Not a reply tone.' },
  ]), [
    { tone: 'shorter', text: 'Short reply.' },
    { tone: 'spicier', text: 'Another angle.' },
    { tone: 'softer', text: 'Warm reply.' },
  ]);
});

test('malformed or partial replies do not masquerade as a successful set', () => {
  for (const value of [null, {}, [], [{ tone: 'shorter', text: 'Only one.' }], [null]]) {
    assert.throws(() => validateQuickReplies(value));
  }
  assert.throws(() => validateQuickReplies([
    { tone: 'shorter', text: 'Short.' }, { tone: 'spicier', text: '   ' }, { tone: 'softer', text: 'Warm.' },
  ]));
});
