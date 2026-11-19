import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeShareSlug } from '../lib/share';

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

test('share links round-trip, including emoji and accents', () => {
  const data = decodeShareSlug(encode({ theirMessage: 'café tonight? 😏', myReply: 'only if you’re buying ☕', tone: 'spicier', timestamp: 1 }));
  assert.deepEqual(data, { theirMessage: 'café tonight? 😏', myReply: 'only if you’re buying ☕', tone: 'spicier' });
});

test('unknown or hostile tones are cleaned, and bad links return null', () => {
  assert.equal(decodeShareSlug(encode({ theirMessage: 'hi', myReply: 'hey', tone: '"><script>' }))?.tone, 'script');
  assert.equal(decodeShareSlug(encode({ theirMessage: 'hi', myReply: 'hey' }))?.tone, 'best');
  assert.equal(decodeShareSlug(encode({ theirMessage: 'hi' })), null);
  assert.equal(decodeShareSlug('not-base64-json'), null);
});
