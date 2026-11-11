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
