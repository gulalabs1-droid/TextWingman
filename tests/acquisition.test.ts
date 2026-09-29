import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCanonicalFunnel, isInternalTraffic, sourceOf, type FunnelUsageRow } from '../lib/admin-funnel';
import { mergeAttribution } from '../lib/analytics';

const now = Date.now();
const at = (minutes: number) => new Date(now - minutes * 60_000).toISOString();
const row = (id: string, action: string, source: string, minutes: number): FunnelUsageRow => ({
  id,
  action,
  created_at: at(minutes),
  metadata: { page: '/tiktok', visitor_id: 'visitor-1', session_id: 'session-1', utm: { utm_source: source } },
});

function fakeDb(logs: FunnelUsageRow[]) {
  return {
    from(table: string) {
      let data: unknown[] = table === 'usage_logs' ? [...logs] : [];
      const query = {
        select() { return query; },
        gte(key: string, value: string) {
          data = data.filter(item => (item as Record<string, string>)[key] >= value);
          return query;
        },
        in(key: string, values: string[]) {
          data = data.filter(item => values.includes((item as Record<string, string>)[key]));
          return query;
        },
        order() { return query; },
        limit() { return query; },
        then(resolve: (result: { data: unknown[]; error: null }) => unknown) {
          return Promise.resolve(resolve({ data, error: null }));
        },
      };
      return query;
    },
  };
}

test('a new source does not inherit a previous creative or campaign', () => {
  assert.deepEqual(mergeAttribution(
    { utm_source: 'youtube', utm_campaign: 'old', video_id: 'tw-old', utm_content: 'old', first_seen: 'first' },
    { utm_source: 'instagram', utm_campaign: 'new' },
  ), { utm_source: 'instagram', utm_campaign: 'new', first_seen: 'first' });
});

test('internal navigation without a new source retains campaign context', () => {
  const original = { utm_source: 'youtube', video_id: 'tw-123', first_seen: 'first' };
  assert.deepEqual(mergeAttribution(original, {}), original);
});

test('the social landing path alone is not evidence of TikTok acquisition', () => {
  assert.equal(sourceOf({ id: 'direct', action: 'page_view', created_at: at(1), metadata: { page: '/tiktok' } }), 'direct');
  assert.equal(sourceOf({ id: 'own', action: 'page_view', created_at: at(1), metadata: { referrer: 'https://gula-agents2.vercel.app/app' } }), 'direct');
  assert.equal(sourceOf(row('ig', 'page_view', 'ig', 1)), 'instagram');
});

test('QA attribution is excluded without excluding genuine Reddit tests', () => {
  assert.equal(isInternalTraffic(row('qa', 'page_view', 'Manual Audit', 1), new Set()), true);
  assert.equal(isInternalTraffic(row('real', 'page_view', 'reddit', 1), new Set()), false);
});

test('source totals reconcile when a visitor changes campaigns and duplicate success events exist', async () => {
  const success = row('server', 'generate_reply', 'instagram', 3);
  success.metadata = { ...success.metadata, outcome: 'success' };
  const client = { ...row('client', 'reply_success', 'instagram', 3), created_at: new Date(new Date(success.created_at).getTime() + 1000).toISOString() };
  const logs = [
    row('first', 'page_view', 'youtube', 10),
    row('second', 'page_view', 'instagram', 5),
    row('start', 'composer_submit', 'instagram', 4),
    success,
    client,
    { ...row('qa', 'page_view', 'codex_qa', 2), metadata: { visitor_id: 'qa', utm: { utm_source: 'codex_qa' } } },
  ];
  const funnel = await getCanonicalFunnel(fakeDb(logs), { rangeDays: 7, verifiedPaidIds: new Set() });
  assert.equal(funnel.period.visitors, 1);
  assert.equal(funnel.period.uniqueReplyPeople, 1);
  assert.equal(funnel.period.replySuccesses, 1);
  assert.equal(funnel.bySource.reduce((total, item) => total + item.visitors, 0), funnel.period.visitors);
  assert.equal(funnel.bySource.reduce((total, item) => total + item.replySuccesses, 0), funnel.period.uniqueReplyPeople);
  assert.deepEqual(funnel.bySource.map(item => item.source), ['youtube']);
  assert.equal(funnel.dataQuality.internalExcluded, 1);
});
