import { getAnalyticsContext, track, type Props } from '@/lib/analytics';

export type ReplyLearningEvent =
  | 'generated'
  | 'selected'
  | 'copied'
  | 'edited'
  | 'sent_confirmed'
  | 'outcome_reported'
  | 'style_signal_recorded';

export type StyleSignals = {
  word_count: number;
  question_count: number;
  exclamation_count: number;
  emoji_count: number;
  lowercase_ratio: number;
  has_apostrophe: boolean;
  line_count: number;
};

export type LocalStyleDNA = {
  sample_count: number;
  edited_count: number;
  average_word_count: number;
  question_rate: number;
  exclamation_rate: number;
  emoji_rate: number;
  lowercase_rate: number;
  favorite_tone: string | null;
  confidence: number;
  updated_at: string;
};

export type ReplyOutcome = 'got_reply' | 'no_reply' | 'not_reported';

export type PendingOutcome = {
  generationId: string;
  replyId: string;
  tone: string;
  context: string;
  // Kept on this device only so the person can recognize the conversation; never sent to the server.
  theirMessagePreview: string;
  copiedAt: number;
};

const STYLE_DNA_STORAGE_KEY = 'tw_style_dna_v1';
const PENDING_OUTCOME_STORAGE_KEY = 'tw_pending_outcome_v1';
export const OUTCOME_ASK_AFTER_MS = 10 * 60 * 1000;
export const OUTCOME_EXPIRES_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export function isOutcomeDue(pending: PendingOutcome | null, now: number): boolean {
  if (!pending || !Number.isFinite(pending.copiedAt)) return false;
  const age = now - pending.copiedAt;
  return age >= OUTCOME_ASK_AFTER_MS && age <= OUTCOME_EXPIRES_AFTER_MS;
}

export function readPendingOutcome(): PendingOutcome | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PENDING_OUTCOME_STORAGE_KEY);
    if (!raw) return null;
    const pending = JSON.parse(raw) as PendingOutcome;
    if (!pending.generationId || !pending.replyId || Date.now() - pending.copiedAt > OUTCOME_EXPIRES_AFTER_MS) {
      window.localStorage.removeItem(PENDING_OUTCOME_STORAGE_KEY);
      return null;
    }
    return pending;
  } catch {
    return null;
  }
}

export function savePendingOutcome(pending: Omit<PendingOutcome, 'copiedAt'>) {
  try {
    window.localStorage.setItem(PENDING_OUTCOME_STORAGE_KEY, JSON.stringify({
      ...pending,
      theirMessagePreview: pending.theirMessagePreview.trim().slice(0, 60),
      copiedAt: Date.now(),
    }));
  } catch {
    // Outcome reporting is optional; storage can be unavailable in private browsing.
  }
}

export function clearPendingOutcome() {
  try {
    window.localStorage.removeItem(PENDING_OUTCOME_STORAGE_KEY);
  } catch {}
}

const EVENT_TO_TRACK_NAME: Record<ReplyLearningEvent, string> = {
  generated: 'reply_generated',
  selected: 'reply_selected',
  copied: 'reply_copied',
  edited: 'reply_edited',
  sent_confirmed: 'reply_sent_confirmed',
  outcome_reported: 'reply_outcome_reported',
  style_signal_recorded: 'style_signal_recorded',
};

function makeId(prefix: string): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return `${prefix}_${crypto.randomUUID()}`;
    }
  } catch {
    // Fall through for private browsing contexts without randomUUID.
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createReplyGenerationId(): string {
  return makeId('gen');
}

export function replyIdFor(generationId: string, tone: string): string {
  const safeTone = tone.toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 32) || 'reply';
  return `${generationId}:${safeTone}`.slice(0, 128);
}

function countEmoji(text: string): number {
  return Array.from(text).filter(character => {
    const codePoint = character.codePointAt(0) || 0;
    return (
      (codePoint >= 0x1f300 && codePoint <= 0x1faff) ||
      (codePoint >= 0x2600 && codePoint <= 0x27bf)
    );
  }).length;
}

export function deriveStyleSignals(text: string): StyleSignals {
  const value = text.trim();
  const words = value ? value.split(/\s+/).filter(Boolean) : [];
  const letters = value.match(/[a-z]/gi) || [];
  const lowercaseLetters = value.match(/[a-z]/g) || [];

  return {
    word_count: Math.min(words.length, 128),
    question_count: Math.min((value.match(/\?/g) || []).length, 8),
    exclamation_count: Math.min((value.match(/!/g) || []).length, 8),
    emoji_count: Math.min(countEmoji(value), 8),
    lowercase_ratio: letters.length ? Math.round((lowercaseLetters.length / letters.length) * 100) / 100 : 1,
    has_apostrophe: /['’]/.test(value),
    line_count: Math.min(value.split(/\r?\n/).length, 8),
  };
}

function emptyDNA(): LocalStyleDNA {
  return {
    sample_count: 0,
    edited_count: 0,
    average_word_count: 0,
    question_rate: 0,
    exclamation_rate: 0,
    emoji_rate: 0,
    lowercase_rate: 0,
    favorite_tone: null,
    confidence: 0,
    updated_at: new Date().toISOString(),
  };
}

export function readLocalStyleDNA(): LocalStyleDNA {
  if (typeof window === 'undefined') return emptyDNA();
  try {
    const raw = window.localStorage.getItem(STYLE_DNA_STORAGE_KEY);
    if (!raw) return emptyDNA();
    return { ...emptyDNA(), ...JSON.parse(raw) } as LocalStyleDNA;
  } catch {
    return emptyDNA();
  }
}

export function recordLocalStyleSignal(
  signals: StyleSignals,
  tone: string,
  event: Extract<ReplyLearningEvent, 'copied' | 'edited' | 'sent_confirmed'>,
): LocalStyleDNA {
  const previous = readLocalStyleDNA();
  const sampleCount = previous.sample_count + 1;
  const weight = previous.sample_count;
  const next: LocalStyleDNA = {
    sample_count: sampleCount,
    edited_count: previous.edited_count + (event === 'edited' ? 1 : 0),
    average_word_count: Math.round(((previous.average_word_count * weight + signals.word_count) / sampleCount) * 10) / 10,
    question_rate: Math.round(((previous.question_rate * weight + (signals.question_count > 0 ? 1 : 0)) / sampleCount) * 100) / 100,
    exclamation_rate: Math.round(((previous.exclamation_rate * weight + (signals.exclamation_count > 0 ? 1 : 0)) / sampleCount) * 100) / 100,
    emoji_rate: Math.round(((previous.emoji_rate * weight + (signals.emoji_count > 0 ? 1 : 0)) / sampleCount) * 100) / 100,
    lowercase_rate: Math.round(((previous.lowercase_rate * weight + signals.lowercase_ratio) / sampleCount) * 100) / 100,
    favorite_tone: tone || previous.favorite_tone,
    confidence: Math.min(100, sampleCount * 20),
    updated_at: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(STYLE_DNA_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // The server-side event remains the durable source of truth.
  }
  return next;
}

export function sendReplyLearningEvent(input: {
  event: ReplyLearningEvent;
  generationId: string;
  replyId?: string;
  tone?: string;
  context?: string | null;
  outcome?: ReplyOutcome;
  styleSignals?: StyleSignals;
  props?: Props;
}) {
  if (typeof window === 'undefined') return;

  const eventName = EVENT_TO_TRACK_NAME[input.event];
  const props: Props = {
    ...input.props,
    generation_id: input.generationId,
    reply_id: input.replyId,
    tone: input.tone,
    context: input.context || undefined,
    outcome: input.outcome,
  };
  track(eventName, props);

  const payload = JSON.stringify({
    event: input.event,
    generationId: input.generationId,
    replyId: input.replyId,
    tone: input.tone,
    context: input.context || undefined,
    outcome: input.outcome,
    styleSignals: input.styleSignals,
    props: input.props,
    analytics: getAnalyticsContext(),
  });

  void fetch('/api/reply-learning', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}
