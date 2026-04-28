// lib/analytics.ts
// Thin wrapper around Vercel Analytics custom events with UTM/source capture.
// Safe to import in client components. No-op on server.

import { track as vercelTrack } from '@vercel/analytics';

type Props = Record<string, string | number | boolean | null | undefined>;

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'video_id',
  'src',
] as const;

const STORAGE_KEY = 'tw_attribution';

/** Capture attribution params from URL into localStorage (call once on app mount). */
export function captureAttribution(): Props {
  if (typeof window === 'undefined') return {};
  try {
    const url = new URL(window.location.href);
    const captured: Props = {};
    let changed = false;
    for (const k of UTM_KEYS) {
      const v = url.searchParams.get(k);
      if (v) {
        captured[k] = v;
        changed = true;
      }
    }
    const existing = readAttribution();
    if (changed) {
      const merged = { ...existing, ...captured, first_seen: existing.first_seen || new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
    return existing;
  } catch {
    return {};
  }
}

export function readAttribution(): Props {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Track a named event with attribution attached automatically. */
export function track(event: string, props: Props = {}) {
  try {
    const attribution = readAttribution();
    const payload: Props = { ...attribution, ...props };
    // Vercel Analytics requires flat string/number/boolean/null values
    const clean: Record<string, string | number | boolean | null> = {};
    for (const [k, v] of Object.entries(payload)) {
      if (v === undefined) continue;
      clean[k] = v as string | number | boolean | null;
    }
    vercelTrack(event, clean);
  } catch {
    // swallow — tracking must never break UX
  }
}
