import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isAllowedEventName, normalizeClientEventName } from '../lib/analytics-events';

test('browser events cannot impersonate server usage or paid outcomes', () => {
  for (const name of ['generate_reply', 'decode', 'generate_opener', 'generate_revive', 'strategy_chat', 'unknown_event']) {
    assert.equal(isAllowedEventName(name), false, name);
  }
  assert.equal(normalizeClientEventName('reply_generated'), 'reply_displayed');
  assert.equal(normalizeClientEventName('signup_complete'), 'signup_client_reported');
  assert.equal(normalizeClientEventName('checkout_completed'), 'checkout_returned');
});

test('current onboarding, social and reply-learning events stay available', () => {
  const events = [
    'landing_view', 'social_landing_view', 'composer_start', 'composer_submit',
    'onboarding_started', 'onboarding_completed', 'first_run_start', 'app_view',
    'auth_code_sent', 'auth_code_failed', 'signup_start', 'signup_complete',
    'reply_generated', 'reply_selected', 'reply_copied', 'reply_edited',
    'reply_sent_confirmed', 'reply_outcome_reported', 'style_signal_recorded',
    'checkout_started', 'checkout_viewed', 'checkout_completed', 'checkout_failed',
    'culture_example_loaded', 'culture_draft_ready', 'culture_link_clicked', 'court_vote_saved',
    'screenshot_upload_clicked', 'screenshot_upload_succeeded', 'screenshot_upload_failed',
    'share_card_view', 'share_card_cta_click', 'social_outbound_click',
  ];
  for (const name of events) assert.equal(isAllowedEventName(name), true, name);
});
