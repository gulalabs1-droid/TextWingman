import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readBatches } from '../lib/read-batches';

test('reads every page and stops after the final partial batch', async () => {
  const values = Array.from({ length: 2300 }, (_, index) => index);
  const result = await readBatches<number>(() => ({
    range: async (from, to) => ({ data: values.slice(from, to + 1), error: null }),
  }), 5000);
  assert.deepEqual(result.data, values);
  assert.equal(result.truncated, false);
});

test('reports when its safety cap is reached and preserves query errors', async () => {
  const values = Array.from({ length: 1500 }, (_, index) => index);
  const capped = await readBatches<number>(() => ({
    range: async (from, to) => ({ data: values.slice(from, to + 1), error: null }),
  }), 1000);
  assert.equal(capped.data.length, 1000);
  assert.equal(capped.truncated, true);

  const failed = await readBatches<number>(() => ({
    range: async () => ({ data: null, error: { message: 'unavailable' } }),
  }), 1000);
  assert.equal(failed.error?.message, 'unavailable');
});
