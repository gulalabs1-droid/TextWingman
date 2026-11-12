import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextRequest } from 'next/server';
import { GET as getExample } from '../app/api/court/example/route';
import { AFTER_DARK_DILEMMAS, COURT_CASES, CULTURE_LAUNCH, DONT_SEND_ENTRIES, publishedAfterDark, publishedCourtCases, publishedDontSend } from '../lib/culture-content';
import { mergeAttribution } from '../lib/analytics';
import { buildRequestAnalytics } from '../lib/analytics-server';

const launch = Date.parse(CULTURE_LAUNCH);
const week = 7 * 24 * 60 * 60 * 1000;

test('the complete culture pack releases at the planned weekly cadence', () => {
  assert.equal(COURT_CASES.length, 30);
  assert.equal(DONT_SEND_ENTRIES.length, 15);
  assert.equal(AFTER_DARK_DILEMMAS.length, 10);
  assert.equal(new Set(COURT_CASES.map(item => item.id)).size, 30);
  assert.deepEqual([launch, launch + week, launch + 20 * week].map(publishedCourtCases).map(items => items.length), [10, 13, 30]);
  assert.deepEqual([launch, launch + week, launch + 20 * week].map(publishedDontSend).map(items => items.length), [5, 7, 15]);
  assert.deepEqual([launch, launch + week, launch + 20 * week].map(publishedAfterDark).map(items => items.length), [1, 2, 10]);
});

test('prefill supplies only published fictional cases, without placing their text in the link', async () => {
  const valid = await getExample(new NextRequest('https://textwingman.app/api/court/example?case=case-01'));
  assert.deepEqual(await valid.json(), { message: 'hey', context: 'crush' });
  const missing = await getExample(new NextRequest('https://textwingman.app/api/court/example?case=case-99'));
  assert.equal(missing.status, 404);
});

test('culture attribution does not overwrite an existing acquisition source', () => {
  const result = mergeAttribution({ utm_source: 'youtube', utm_content: 'video-1' }, { culture_origin: 'court_case-01' });
  assert.equal(result.utm_source, 'youtube');
  assert.equal(result.utm_content, 'video-1');
  assert.equal(result.culture_origin, 'court_case-01');
  const request = new Request('https://textwingman.app/api/generate');
  const analytics = buildRequestAnalytics(request, { attribution: result }, 'pending');
  assert.equal(analytics.metadata.utm?.utm_source, 'youtube');
  assert.equal(analytics.metadata.utm?.culture_origin, 'court_case-01');
});
