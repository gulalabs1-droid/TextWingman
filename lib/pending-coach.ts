// Keeps a signed-out person's Coach chat across sign-up, so choosing a plan
// from the upgrade sheet brings them back to the same conversation (and the
// same plan) instead of an empty pricing page.

import type { SavedSessionMessage } from '@/lib/coach-session';

export const PENDING_COACH_KEY = 'tw_pending_coach';
export const PENDING_COACH_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type UpgradePlanChoice = 'annual' | 'monthly';

export type PendingCoach = {
  savedAt: number;
  messages: SavedSessionMessage[];
  threadText: string;
  context: string | null;
  input: string;
  plan: UpgradePlanChoice;
};

/** Where sign-up should send them afterwards. */
export function resumePath(plan: UpgradePlanChoice): string {
  return `/app?resume=1&plan=${plan}`;
}

export function parsePendingCoach(raw: string | null, now = Date.now()): PendingCoach | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<PendingCoach>;
    if (typeof data.savedAt !== 'number' || now - data.savedAt > PENDING_COACH_MAX_AGE_MS || now < data.savedAt - 60_000) return null;
    if (!Array.isArray(data.messages)) return null;
    return {
      savedAt: data.savedAt,
      messages: data.messages.slice(-60),
      threadText: typeof data.threadText === 'string' ? data.threadText.slice(0, 12_000) : '',
      context: typeof data.context === 'string' ? data.context : null,
      input: typeof data.input === 'string' ? data.input.slice(0, 6_000) : '',
      plan: data.plan === 'monthly' ? 'monthly' : 'annual',
    };
  } catch {
    return null;
  }
}

export function savePendingCoach(pending: Omit<PendingCoach, 'savedAt'>) {
  try {
    localStorage.setItem(PENDING_COACH_KEY, JSON.stringify({ ...pending, savedAt: Date.now() }));
  } catch {
    // Storage can be full or blocked; sign-up still works, the chat just isn't carried over.
  }
}

/** Reads and removes the saved chat, so it is restored once. */
export function takePendingCoach(): PendingCoach | null {
  try {
    const pending = parsePendingCoach(localStorage.getItem(PENDING_COACH_KEY));
    localStorage.removeItem(PENDING_COACH_KEY);
    return pending;
  } catch {
    return null;
  }
}
