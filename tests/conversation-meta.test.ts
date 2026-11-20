import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanContactName, cleanRelationship } from '../lib/conversation-meta';

test('contact names come through clean, junk does not', () => {
  assert.equal(cleanContactName('Maya 🌸'), 'Maya');
  assert.equal(cleanContactName('  José  Luis '), 'José Luis');
  assert.equal(cleanContactName('+1 (555) 201-3344'), null);
  assert.equal(cleanContactName('unknown'), null);
  assert.equal(cleanContactName('x'.repeat(40)), null);
  assert.equal(cleanContactName(42), null);
});

test('relationships map to Coach’s choices and low-confidence guesses are dropped', () => {
  assert.equal(cleanRelationship('colleague'), 'colleague');
  assert.equal(cleanRelationship('Work'), 'colleague');
  assert.equal(cleanRelationship('new match'), 'new_match');
  assert.equal(cleanRelationship('crush', 'low'), null);
  assert.equal(cleanRelationship('landlord'), null);
  assert.equal(cleanRelationship(null), null);
});
