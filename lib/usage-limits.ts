// One free use covers a reply generation or a coach message; a generation can return multiple options.
export const FREE_REPLY_LIMIT = 3;
export const REPLY_USAGE_WINDOW_HOURS = 24;

export function replyUsageCutoff(now = Date.now()): string {
  return new Date(now - REPLY_USAGE_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
}

export function remainingFreeUses(used: number): number {
  return Math.max(0, FREE_REPLY_LIMIT - used);
}

export function freeLimitReached(used: number): boolean {
  return used >= FREE_REPLY_LIMIT;
}

/** When the oldest use in the window expires, which frees up the next use. */
export function nextFreeUseAt(oldestUseIso: string | null | undefined, now = Date.now()): string | null {
  if (!oldestUseIso) return null;
  const oldest = Date.parse(oldestUseIso);
  if (!Number.isFinite(oldest)) return null;
  const freesAt = oldest + REPLY_USAGE_WINDOW_HOURS * 60 * 60 * 1000;
  return freesAt > now ? new Date(freesAt).toISOString() : null;
}

/** "3h 12m", "45m" or "under a minute" until the given time. */
export function formatTimeUntil(iso: string | null | undefined, now = Date.now()): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso) - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const minutes = Math.ceil(ms / 60_000);
  if (minutes <= 1) return 'under a minute';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h${rest ? ` ${rest}m` : ''}` : `${rest}m`;
}
