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
  reply_copied: 'reply_copy',
  copy_clicked: 'reply_copy',
  reply_marked_sent: 'reply_sent',
  signup_started: 'signup_start',
  signup_completed: 'signup_complete',
  checkout_started: 'checkout_start',
  upgrade_clicked: 'checkout_start',
};

const PRODUCT_REQUEST_ACTIONS = new Set(['generate_reply', 'reply_request']);
const PRODUCT_SUCCESS_ACTIONS = new Set([
  'reply_success',
  'decode',
  'generate_opener',
  'generate_revive',
  'strategy_chat',
]);

export function normalizeEventName(value: unknown): string {
  if (typeof value !== 'string') return 'custom_event';
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_').slice(0, 64);
  if (!normalized) return 'custom_event';
  return CLIENT_EVENT_ALIASES[normalized] || normalized;
}

export function isAllowedEventName(value: unknown): boolean {
  return typeof value === 'string' && /^[a-z0-9_]{1,64}$/.test(value.trim().toLowerCase());
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
