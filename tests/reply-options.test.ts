import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseReplyOptions } from '../lib/reply-options';

test('successful generation always contains three nonempty reply options', () => {
  assert.deepEqual(parseReplyOptions({ shorter: ' sure ', spicier: 'when can we talk?', softer: 'of course, i am here' }), [
    { tone: 'shorter', text: 'sure' },
    { tone: 'spicier', text: 'when can we talk?' },
    { tone: 'softer', text: 'of course, i am here' },
  ]);
});

test('malformed model output is not recorded as a usable reply result', () => {
  for (const value of [null, [], {}, { shorter: 'yes', spicier: 3, softer: 'okay' }, { shorter: 'yes', spicier: ' ', softer: 'okay' }]) {
    assert.throws(() => parseReplyOptions(value));
  }
});
