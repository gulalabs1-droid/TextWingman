import assert from 'node:assert/strict';
import { test } from 'node:test';
import { replySafetyInstructions } from '../lib/reply-safety';

test('serious texts override playful relationship guidance', () => {
  assert.match(replySafetyInstructions('we need to talk'), /SERIOUS MESSAGE OVERRIDE/);
  assert.match(replySafetyInstructions("i'm hurt"), /SERIOUS MESSAGE OVERRIDE/);
});

test('explicit boundaries take precedence over serious-message guidance', () => {
  assert.match(replySafetyInstructions("we need to talk. don't contact me"), /BOUNDARY OVERRIDE/);
});

test('only the latest incoming message selects the thread safety override', () => {
  assert.equal(replySafetyInstructions('Them: we need to talk\nYou: okay\nThem: thanks for listening, dinner was fun'), '');
  assert.match(replySafetyInstructions('Them: dinner was fun\nYou: another date?\nThem: not interested'), /BOUNDARY OVERRIDE/);
});
