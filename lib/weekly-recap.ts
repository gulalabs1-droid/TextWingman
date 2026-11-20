// "Your week": how many replies someone used in the last 7 days, how many got
// answered, and which style is landing. Built from reply_outcomes, which holds
// behavioral events only, never message text.

import { toneName } from '@/lib/coach-profile';

export const RECAP_DAYS = 7;

type Row = { event_type: string; tone: string | null; outcome: string | null; created_at: string };

export type WeeklyRecap = {
  /** Replies they copied or marked as sent. */
  used: number;
  /** Outcomes they reported back. */
  answered: number;
  reported: number;
  /** The style with the most answers this week, when there is one. */
  bestStyle: string | null;
};

export function recapSince(now = Date.now()): string {
  return new Date(now - RECAP_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function summarizeWeek(rows: Row[], now = Date.now()): WeeklyRecap | null {
  const since = Date.parse(recapSince(now));
  const recent = rows.filter(row => Date.parse(row.created_at) >= since);
  // Copying is how a reply gets used; "sent" confirmations count only when nothing was copied,
  // so one reply isn't counted twice.
  const copies = recent.filter(row => row.event_type === 'copied').length;
  const sends = recent.filter(row => row.event_type === 'sent_confirmed').length;
  const used = copies || sends;
  const outcomes = recent.filter(row => row.event_type === 'outcome_reported' && (row.outcome === 'got_reply' || row.outcome === 'no_reply'));
  const answered = outcomes.filter(row => row.outcome === 'got_reply').length;
  if (!used && !outcomes.length) return null;

  const wins = new Map<string, number>();
  for (const row of outcomes) if (row.outcome === 'got_reply' && row.tone) wins.set(row.tone, (wins.get(row.tone) || 0) + 1);
  const best = [...wins.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    used,
    answered,
    reported: outcomes.length,
    bestStyle: best && best[1] >= 2 ? toneName(best[0]) : null,
  };
}
