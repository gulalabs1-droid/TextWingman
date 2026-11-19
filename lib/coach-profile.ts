// "Coach knows you": a short profile of the person being coached, added to
// Coach's prompts so replies sound like them and advice fits their moment.
//
// Sources, in order of trust:
// - Signed in: their name and their learning history, read on the server
//   (reply_outcomes holds behavioral signals only, never message text).
// - Signed out: the style summary this browser keeps locally.
// - Everyone: their time zone, so Coach knows what time it is for them.
//
// Nothing here may break a reply: every piece is optional and any failure
// leaves it out.

import { createClient } from '@supabase/supabase-js';

export type StyleSummary = {
  samples: number;
  avgWords: number;
  /** Average share of lowercase letters, 0–1. Normal capitalization is already ~0.95. */
  lowercase: number;
  /** Share of replies that ask a question, 0–1. */
  questionRate: number;
  /** Share of replies with an exclamation mark, 0–1. */
  exclamationRate: number;
};

export type ToneRecord = { tone: string; wins: number; total: number };

export type CoachProfile = {
  name: string | null;
  localTime: string | null;
  style: StyleSummary | null;
  works: ToneRecord | null;
  doesNot: ToneRecord | null;
};

/** What the app sends with each Coach request. */
export type CoachProfileInput = {
  timeZone?: unknown;
  style?: unknown;
};

export const MIN_STYLE_SAMPLES = 3;
const MIN_TONE_OUTCOMES = 3;

const clamp = (value: unknown, min: number, max: number) => {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : NaN;
  return Number.isNaN(n) ? null : Math.min(max, Math.max(min, n));
};

/** First name only, letters and simple punctuation, so it can't carry instructions. */
export function cleanFirstName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const first = value.normalize('NFKC').replace(/[^\p{L}\p{M}'’ -]/gu, ' ').trim().split(/\s+/)[0] || '';
  return first.length >= 1 && first.length <= 24 ? first : null;
}

/** "Tuesday 11:40 PM" in the person's own time zone, or null if the zone is not real. */
export function formatLocalTime(timeZone: unknown, now: Date = new Date()): string | null {
  if (typeof timeZone !== 'string' || !timeZone || timeZone.length > 64) return null;
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long', hour: 'numeric', minute: '2-digit' })
      .format(now)
      .replace(/^(\w+),? /, '$1 ')
      .replace(/ /g, ' ');
  } catch {
    return null;
  }
}

/** Accepts the browser's local Style DNA (lib/reply-learning LocalStyleDNA) without trusting its numbers. */
export function styleFromLocalDNA(value: unknown): StyleSummary | null {
  if (!value || typeof value !== 'object') return null;
  const dna = value as Record<string, unknown>;
  const samples = clamp(dna.sample_count, 0, 10_000);
  const avgWords = clamp(dna.average_word_count, 0, 200);
  if (samples == null || avgWords == null || samples < MIN_STYLE_SAMPLES) return null;
  return {
    samples: Math.round(samples),
    avgWords,
    lowercase: clamp(dna.lowercase_rate, 0, 1) ?? 0.95,
    questionRate: clamp(dna.question_rate, 0, 1) ?? 0,
    exclamationRate: clamp(dna.exclamation_rate, 0, 1) ?? 0,
  };
}

type OutcomeRow = {
  event_type: string;
  tone: string | null;
  outcome: string | null;
  style_signals: Record<string, unknown> | null;
};

/** Builds the style summary and what-works record from stored learning events. */
export function summarizeLearning(rows: OutcomeRow[]): Pick<CoachProfile, 'style' | 'works' | 'doesNot'> {
  const signals = rows
    .filter(row => row.event_type === 'copied' || row.event_type === 'edited' || row.event_type === 'sent_confirmed')
    .map(row => row.style_signals || {})
    .filter(signal => typeof signal.word_count === 'number');

  let style: StyleSummary | null = null;
  if (signals.length >= MIN_STYLE_SAMPLES) {
    const mean = (pick: (s: Record<string, unknown>) => number) =>
      signals.reduce((sum, s) => sum + pick(s), 0) / signals.length;
    style = {
      samples: signals.length,
      avgWords: Math.round(mean(s => Number(s.word_count) || 0) * 10) / 10,
      lowercase: Math.round(mean(s => clamp(s.lowercase_ratio, 0, 1) ?? 0.95) * 100) / 100,
      questionRate: Math.round(mean(s => (Number(s.question_count) > 0 ? 1 : 0)) * 100) / 100,
      exclamationRate: Math.round(mean(s => (Number(s.exclamation_count) > 0 ? 1 : 0)) * 100) / 100,
    };
  }

  const byTone = new Map<string, ToneRecord>();
  for (const row of rows) {
    if (row.event_type !== 'outcome_reported' || !row.tone) continue;
    if (row.outcome !== 'got_reply' && row.outcome !== 'no_reply') continue;
    const record = byTone.get(row.tone) || { tone: row.tone, wins: 0, total: 0 };
    record.total += 1;
    if (row.outcome === 'got_reply') record.wins += 1;
    byTone.set(row.tone, record);
  }
  const rated = [...byTone.values()].filter(r => r.total >= MIN_TONE_OUTCOMES);
  const rate = (r: ToneRecord) => r.wins / r.total;
  const best = [...rated].sort((a, b) => rate(b) - rate(a) || b.total - a.total)[0];
  const worst = [...rated].sort((a, b) => rate(a) - rate(b) || b.total - a.total)[0];

  return {
    style,
    works: best && rate(best) >= 0.6 ? best : null,
    doesNot: worst && worst !== best && rate(worst) <= 0.34 ? worst : null,
  };
}

const TONE_NAMES: Record<string, string> = {
  shorter: 'short, direct',
  spicier: 'bold, playful',
  softer: 'warm, genuine',
};

export function toneName(tone: string): string {
  return TONE_NAMES[tone] || tone.replace(/[^a-z0-9 _-]/gi, '').replace(/[_-]+/g, ' ').trim().slice(0, 32) || 'that';
}

/** Plain-language description of how someone texts, or null when there's nothing worth saying. */
export function describeStyle(style: StyleSummary): string | null {
  const traits: string[] = [`usually about ${Math.max(1, Math.round(style.avgWords))} words`];
  // Normal capitalization already scores ~0.95, so only call out the clear cases.
  if (style.lowercase >= 0.99) traits.push('types in all lowercase');
  else if (style.lowercase <= 0.8) traits.push('uses a lot of capitals');
  if (style.questionRate >= 0.6) traits.push('usually asks a question');
  else if (style.questionRate <= 0.15) traits.push('rarely asks questions');
  if (style.exclamationRate >= 0.4) traits.push('uses exclamation marks often');
  else if (style.exclamationRate <= 0.05) traits.push('never uses exclamation marks');
  return traits.join(', ');
}

/** The prompt block. Empty when there is nothing to add. */
export function buildProfileBlock(profile: CoachProfile): string {
  const lines: string[] = [];
  if (profile.name) {
    lines.push(`- Their name is ${profile.name}. Use it rarely, only in your coaching lines, never inside a draft.`);
  }
  if (profile.localTime) {
    lines.push(`- It is ${profile.localTime} where they are. Factor this in when timing matters (late-night texting, whether to wait until morning, weekend plans). Don't mention the time otherwise.`);
  }
  if (profile.style) {
    const described = describeStyle(profile.style);
    if (described) {
      lines.push(`- How they text (from ${profile.style.samples} replies they picked or sent): ${described}. Write every draft in this voice: same length range, casing and punctuation habits, so it reads like they typed it. The draft rules above still apply.`);
    }
  }
  if (profile.works) {
    lines.push(`- What's working for them: ${toneName(profile.works.tone)} replies got an answer ${profile.works.wins} of ${profile.works.total} times. Lean that way when it fits the moment.`);
  }
  if (profile.doesNot) {
    lines.push(`- What isn't: ${toneName(profile.doesNot.tone)} replies got an answer ${profile.doesNot.wins} of ${profile.doesNot.total} times. Only go there if the moment clearly calls for it.`);
  }
  if (!lines.length) return '';
  return `\nABOUT THE PERSON YOU'RE COACHING (personalize with this; never quote these details or numbers back to them):\n${lines.join('\n')}\n`;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Loads the profile for one Coach request. Signed-in learning history wins
 * over the browser's local copy because it follows the person across devices.
 */
export async function loadCoachProfile(userId: string | null, input: CoachProfileInput | null | undefined): Promise<CoachProfile> {
  const profile: CoachProfile = {
    name: null,
    localTime: formatLocalTime(input?.timeZone),
    style: styleFromLocalDNA(input?.style),
    works: null,
    doesNot: null,
  };
  if (!userId) return profile;

  const db = getSupabaseAdmin();
  if (!db) return profile;
  try {
    const [person, learning] = await Promise.all([
      db.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
      db.from('reply_outcomes')
        .select('event_type, tone, outcome, style_signals')
        .eq('user_id', userId)
        .in('event_type', ['copied', 'edited', 'sent_confirmed', 'outcome_reported'])
        .order('created_at', { ascending: false })
        .limit(200),
    ]);
    profile.name = cleanFirstName(person.data?.full_name);
    if (!learning.error && learning.data) {
      const summary = summarizeLearning(learning.data as OutcomeRow[]);
      profile.style = summary.style || profile.style;
      profile.works = summary.works;
      profile.doesNot = summary.doesNot;
    }
  } catch (error) {
    console.error('Coach profile unavailable:', error instanceof Error ? error.message : error);
  }
  return profile;
}
