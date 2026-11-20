import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHANGELOG, CURRENT_VERSION, LATEST_UPDATE } from '../lib/changelog';

test('the latest release notes describe the current Coach update', () => {
  assert.equal(CURRENT_VERSION, '4.11.0');
  assert.equal(LATEST_UPDATE, CHANGELOG[0]);
  assert.equal(LATEST_UPDATE.date, '2026-11-20');
  const notes = LATEST_UPDATE.highlights.join(' ');
  assert.match(notes, /same browser/i);
  assert.match(notes, /supported browsers.*microphone permission/i);
  assert.match(notes, /AI provider.*not saved in your chats/i);
  assert.match(notes, /three uses per rolling 24 hours/i);
});
