// What happens between "signed in" and "using Coach": where onboarding sends
// people, and how Coach greets them when they arrive.

export const TOUR_STORAGE_KEY = 'tw_feature_tour_v4.2';
export const CONTEXT_STORAGE_KEY = 'tw_context';
// sessionStorage flag set by login ('returning') and onboarding ('new'), read once by Coach.
export const ARRIVAL_STORAGE_KEY = 'tw_arrival';

export type StartIntent = 'screenshot' | 'paste';
export type Arrival = 'new' | 'returning';

export const ONBOARDING_CONTEXTS = [
  { value: 'crush', label: 'Crush', emoji: '💘', hint: "Someone you're into" },
  { value: 'new_match', label: 'New match', emoji: '✨', hint: 'First messages' },
  { value: 'friend', label: 'Friend', emoji: '🤝', hint: 'Keeping it easy' },
  { value: 'colleague', label: 'Work', emoji: '💼', hint: 'Clear and professional' },
  { value: 'family', label: 'Family', emoji: '👪', hint: 'Warm, no drama' },
  { value: 'ex', label: 'Ex', emoji: '💔', hint: "It's complicated" },
] as const;

export type OnboardingContext = (typeof ONBOARDING_CONTEXTS)[number]['value'];

export function isOnboardingContext(value: unknown): value is OnboardingContext {
  return ONBOARDING_CONTEXTS.some(option => option.value === value);
}

export function parseStartIntent(value: string | null | undefined): StartIntent | null {
  return value === 'screenshot' || value === 'paste' ? value : null;
}

export function parseArrival(value: string | null | undefined): Arrival | null {
  return value === 'new' || value === 'returning' ? value : null;
}

/**
 * Where to go once onboarding is saved. An invite to redeem or a reply the
 * person started before signing up always wins over the first-action choice.
 */
export function onboardingDestination(options: {
  pendingInviteCode?: unknown;
  hasPendingThread: boolean;
  start: StartIntent | null;
}): string {
  const code = typeof options.pendingInviteCode === 'string' ? options.pendingInviteCode.trim() : '';
  if (/^[a-z0-9_-]{1,64}$/i.test(code)) return `/invite/${code.toUpperCase()}`;
  if (options.hasPendingThread) return '/app?restore=1';
  return options.start ? `/app?start=${options.start}` : '/app';
}

export function firstNameOf(fullName: string | null | undefined): string | null {
  const first = fullName?.trim().split(/\s+/)[0];
  return first ? first.slice(0, 40) : null;
}

/** The one-time greeting Coach shows right after sign-in or onboarding. */
export function arrivalGreeting(options: {
  arrival: Arrival;
  fullName: string | null | undefined;
  isPro: boolean;
  remaining: number;
  limit: number;
}): { title: string; description: string } {
  const name = firstNameOf(options.fullName);
  const remaining = Math.max(0, Math.min(options.remaining, options.limit));
  const allowance = options.isPro
    ? 'Unlimited replies are on.'
    : remaining === 0
      ? `You've used your ${options.limit} free replies for now. They refill on a rolling 24 hours.`
      : `You have ${remaining} free ${remaining === 1 ? 'reply' : 'replies'} in your 24-hour window.`;

  if (options.arrival === 'new') {
    return {
      title: name ? `You're in, ${name}.` : "You're in.",
      description: `${allowance} Drop a screenshot or paste a message to start.`,
    };
  }
  return { title: name ? `Welcome back, ${name}.` : 'Welcome back.', description: allowance };
}
