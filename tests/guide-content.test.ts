import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SEO_GUIDES, getGuideBySlug } from '../lib/seo-guides';

test('each published guide remains discoverable with complete article content', () => {
  assert.deepEqual(SEO_GUIDES.map(guide => guide.slug).sort(), [
    'double-texting', 'dry-texter', 'ex-texted-back', 'first-message-dating-app',
    'goodnight-text', 'he-hasnt-texted-back', 'how-to-flirt-over-text', 'left-on-read',
    'lol-response', 'one-word-replies', 'respond-to-hey', 'revive-dead-conversation',
    'she-said-shes-busy', 'what-to-say-after-first-date', 'wyd-text',
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
