import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSiteUrl } from '../lib/site';

test('uses the current domain when configuration is missing, local, invalid, or retired', () => {
  for (const value of [undefined, '', 'not a url', 'http://localhost:3000', 'http://127.0.0.1:3000', 'https://gula-agents2.vercel.app/']) {
    assert.equal(resolveSiteUrl(value), 'https://textwingman.app');
  }
});

test('preserves an explicitly configured non-legacy domain', () => {
  assert.equal(resolveSiteUrl('https://preview.example.com/'), 'https://preview.example.com');
  assert.equal(resolveSiteUrl('https://textwingman.app/'), 'https://textwingman.app');
});
