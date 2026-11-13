import { NextResponse } from 'next/server';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

/**
 * Fixed-window rate limiter held in process memory.
 *
 * On serverless this is per-instance and best-effort: it stops bursts and
 * scripted loops against a warm instance, which is where OpenAI cost abuse
 * comes from. Hard quotas (free-tier usage) stay in the database.
 */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): { ok: boolean; retryAfter: number } {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
      if (buckets.size >= MAX_BUCKETS) buckets.delete(buckets.keys().next().value as string);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}

export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { error: 'Too many requests. Please wait a moment and try again.' },
    { status: 429, headers: { 'Retry-After': String(Math.max(1, retryAfter)) } },
  );
}

export function resetRateLimits() {
  buckets.clear();
}

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

/**
 * Client-supplied chat history must never carry `system` turns (prompt
 * injection) or unbounded text (token cost). Keep only the most recent
 * user/assistant turns with string content, each clipped.
 */
export function sanitizeChatHistory(value: unknown, maxTurns = 20, maxChars = 4000): ChatTurn[] {
  if (!Array.isArray(value)) return [];
  const turns: ChatTurn[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const { role, content } = item as { role?: unknown; content?: unknown };
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim()) continue;
    turns.push({ role, content: content.slice(0, maxChars) });
  }
  return turns.slice(-maxTurns);
}

/** Returns the trimmed string clipped to `max`, or null when not a non-empty string. */
export function clipText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}
