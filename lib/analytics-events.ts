export type Primitive = string | number | boolean | null;

const CLIENT_EVENT_ALIASES: Record<string, string> = {
  landing_view: 'landing_view',
  social_landing_view: 'landing_view',
  hero_demo_started: 'composer_start',
  app_prefill_loaded: 'composer_start',
  text_pasted: 'composer_start',
  example_clicked: 'example_click',
  screenshot_upload_started: 'screenshot_start',
  screenshot_upload_clicked: 'screenshot_start',
  screenshot_upload_succeeded: 'screenshot_success',
  screenshot_upload_failed: 'screenshot_error',
  decode_clicked: 'composer_submit',
  prefill_autorun_started: 'composer_submit',
  reply_requested: 'reply_request',
  reply_generated: 'reply_success',
  reply_succeeded: 'reply_success',
  reply_generation_failed: 'reply_error',
  reply_failed: 'reply_error',
  reply_selected: 'reply_selected',
  reply_copied: 'reply_copy',
  copy_clicked: 'reply_copy',
  reply_marked_sent: 'reply_sent',
  reply_sent_confirmed: 'reply_sent',
  reply_edited: 'reply_edited',
  reply_outcome_recorded: 'reply_outcome_recorded',
  reply_outcome_reported: 'reply_outcome_recorded',
  style_signal_recorded: 'style_signal_recorded',
  signup_started: 'signup_start',
  signup_completed: 'signup_complete',
  signup_cta_clicked: 'signup_cta_click',
  pricing_viewed: 'pricing_view',
  checkout_viewed: 'checkout_view',
  checkout_started: 'checkout_start',
  upgrade_clicked: 'checkout_start',
  checkout_completed: 'checkout_complete',
  checkout_failed: 'checkout_error',
};

const PRODUCT_REQUEST_ACTIONS = new Set(['generate_reply', 'reply_request']);
const PRODUCT_SUCCESS_ACTIONS = new Set([
  'reply_success',
  'decode',
  'generate_opener',
  'generate_revive',
  'strategy_chat',
]);

const CLIENT_EVENTS = new Set([
  ...Object.keys(CLIENT_EVENT_ALIASES),
  ...Object.values(CLIENT_EVENT_ALIASES),
  'page_view', 'app_view', 'reply_displayed', 'reply_error', 'example_reply_copied',
  'culture_example_loaded', 'culture_draft_ready', 'culture_link_clicked',
  'court_vote_saved', 'context_selected', 'social_outbound_click',
  'saved_thread_restored', 'thread_continued', 'deep_upsell_shown',
  'deep_upsell_dismissed', 'deep_upsell_click', 'share_card_view',
  'share_card_cta_click', 'sign_in_started', 'sign_in_completed',
  'auth_code_sent', 'auth_code_failed', 'onboarding_started',
  'onboarding_completed', 'first_run_start',
]);

const CLIENT_ONLY_OUTCOMES: Record<string, string> = {
  reply_success: 'reply_displayed',
  signup_complete: 'signup_client_reported',
  checkout_complete: 'checkout_returned',
};

export function normalizeEventName(value: unknown): string {
  if (typeof value !== 'string') return 'custom_event';
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_').slice(0, 64);
  if (!normalized) return 'custom_event';
  return CLIENT_EVENT_ALIASES[normalized] || normalized;
}

export function isAllowedEventName(value: unknown): boolean {
  return typeof value === 'string' && CLIENT_EVENTS.has(value.trim().toLowerCase());
}

export function normalizeClientEventName(value: string): string {
  const normalized = normalizeEventName(value);
  return CLIENT_ONLY_OUTCOMES[normalized] || normalized;
}

export function isProductRequestAction(action: unknown): boolean {
  return PRODUCT_REQUEST_ACTIONS.has(normalizeEventName(action));
}

export function isProductSuccessAction(action: unknown): boolean {
  return PRODUCT_SUCCESS_ACTIONS.has(normalizeEventName(action));
}

export function isProductAction(action: unknown): boolean {
  return isProductRequestAction(action) || isProductSuccessAction(action);
}

export function isComposerAction(action: unknown): boolean {
  return new Set([
    'composer_start',
    'text_pasted',
    'example_click',
    'screenshot_start',
    'screenshot_success',
    'composer_submit',
  ]).has(
    normalizeEventName(action),
  );
}

export function isLandingAction(action: unknown): boolean {
  return normalizeEventName(action) === 'landing_view';
}

export function isPageViewAction(action: unknown): boolean {
  return normalizeEventName(action) === 'page_view';
}
