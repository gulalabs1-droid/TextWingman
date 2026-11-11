import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FREE_REPLY_LIMIT,
  REPLY_USAGE_WINDOW_HOURS,
  freeLimitReached,
  remainingFreeUses,
  replyUsageCutoff,
} from '../lib/usage-limits';
import { hasPro } from '../lib/entitlements';
import { buildRequestAnalytics } from '../lib/analytics-server';
import { reserveCoachUse } from '../lib/usage-reservation';
import type { SupabaseClient } from '@supabase/supabase-js';

test('free users can make three uses in a rolling 24-hour window', () => {
  assert.equal(FREE_REPLY_LIMIT, 3);
  assert.equal(REPLY_USAGE_WINDOW_HOURS, 24);
  assert.equal(replyUsageCutoff(Date.parse('2026-11-10T12:00:00Z')), '2026-11-09T12:00:00.000Z');
  assert.deepEqual([0, 1, 2, 3, 4].map(remainingFreeUses), [3, 2, 1, 0, 0]);
  assert.deepEqual([0, 1, 2, 3, 4].map(freeLimitReached), [false, false, false, true, true]);
});

test('Pro and Elite access remain separate from the free allowance', () => {
  assert.equal(hasPro('free'), false);
  assert.equal(hasPro('pro'), true);
  assert.equal(hasPro('elite'), true);
});

test('experimental coach reserves a free use and stops at the shared limit', async () => {
  const analytics = buildRequestAnalytics(new Request('https://example.test'), null, 'pending');
  let inserted: Record<string, unknown> | null = null;
  let used = 2;
  let unavailable = false;
  const query = {
    select: () => query,
    eq: () => query,
    gte: async () => ({ count: used, error: unavailable ? new Error('database unavailable') : null }),
    insert: (row: Record<string, unknown>) => {
      inserted = row;
      return { select: () => ({ single: async () => ({ data: { id: 'test-log' }, error: null }) }) };
    },
  };
  const admin = { from: () => query } as unknown as SupabaseClient;

  assert.deepEqual(await reserveCoachUse(admin, 'test-user', analytics), { status: 'reserved', logId: 'test-log' });
  assert.equal((inserted as Record<string, unknown> | null)?.action, 'generate_reply');
  assert.equal((inserted as Record<string, unknown> | null)?.user_id, 'test-user');

  inserted = null;
  used = 3;
  assert.deepEqual(await reserveCoachUse(admin, 'test-user', analytics), { status: 'limit' });
  assert.equal(inserted, null);

  unavailable = true;
  assert.deepEqual(await reserveCoachUse(admin, 'test-user', analytics), { status: 'unavailable' });
  assert.equal(inserted, null);
});
