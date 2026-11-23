import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SEO_GUIDES, getGuideBySlug } from '../lib/seo-guides';
import { isAllowedEventName } from '../lib/analytics-events';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('each published guide remains discoverable with complete article content', () => {
  assert.deepEqual(SEO_GUIDES.map(guide => guide.slug).sort(), [
    'ask-someone-out-over-text', 'cancelled-plans-last-minute',
    'double-texting', 'dry-texter', 'ex-texted-back', 'first-message-dating-app',
    'goodnight-text', 'he-hasnt-texted-back', 'how-to-flirt-over-text', 'left-on-read',
    'lol-response', 'maybe-text', 'one-word-replies', 'respond-to-hey', 'revive-dead-conversation',
    'sent-too-long-a-text', 'she-said-shes-busy', 'we-need-to-talk-text', 'what-to-say-after-first-date', 'wyd-text',
  ]);
  assert.equal(new Set(SEO_GUIDES.map(guide => guide.slug)).size, SEO_GUIDES.length);
  for (const guide of SEO_GUIDES) {
    assert.equal(getGuideBySlug(guide.slug), guide);
    assert.ok(guide.title && guide.metaTitle && guide.metaDescription && guide.theirMessage);
    assert.equal(guide.goodReplies.length, 3);
    assert.ok(guide.tips.length > 0);
  }
  assert.equal(getGuideBySlug('not-a-guide'), undefined);
});

test('the sitemap lists the guides index and every published guide', async () => {
  const { default: sitemap } = await import('../app/sitemap');
  const urls = sitemap().map(entry => entry.url);
  assert.ok(urls.some(url => url.endsWith('/guides')));
  for (const guide of SEO_GUIDES) assert.ok(urls.some(url => url.endsWith(`/guides/${guide.slug}`)), guide.slug);
});

test('guide links do not overwrite the visitor source and record the guide click', () => {
  const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
  for (const path of ['app/guides/page.tsx', 'app/guides/[slug]/page.tsx', 'components/GuideCta.tsx']) {
    assert.doesNotMatch(source(path), /utm_source=seo/, path);
  }
  assert.match(source('components/GuideCta.tsx'), /href="\/tiktok"/);
  assert.match(source('components/GuideCta.tsx'), /track\('guide_cta_click', \{ guide_slug: guide \}\)/);
  assert.equal(isAllowedEventName('guide_cta_click'), true);
});
