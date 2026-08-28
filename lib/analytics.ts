// Thin client wrapper around Vercel Analytics plus first-party funnel events.
// Tracking is deliberately fire-and-forget so it can never block the product.

import { track as vercelTrack } from '@vercel/analytics';
import { normalizeEventName, type Primitive } from '@/lib/analytics-events';

export type Props = Record<string, Primitive | undefined>;

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
const VISITOR_STORAGE_KEY = 'tw_visitor_id';
const SESSION_STORAGE_KEY = 'tw_session_id';
const VISITOR_COOKIE = 'tw_vid';

let memoryVisitorId: string | null = null;
let memorySessionId: string | null = null;

function makeId(prefix: string): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return `${prefix}_${crypto.randomUUID()}`;
    }
  } catch {
    // Fall through to a compatible ID for older browsers/private contexts.
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function setVisitorCookie(visitorId: string) {
  try {
    document.cookie = `${VISITOR_COOKIE}=${encodeURIComponent(visitorId)}; Max-Age=31536000; Path=/; SameSite=Lax`;
  } catch {
    // Cookies can be unavailable in some privacy modes; localStorage is still useful.
  }
}

export function getClientIdentity() {
  if (typeof window === 'undefined') return { visitorId: null, sessionId: null };

  if (!memoryVisitorId) {
    try {
      memoryVisitorId = localStorage.getItem(VISITOR_STORAGE_KEY) || makeId('v');
      localStorage.setItem(VISITOR_STORAGE_KEY, memoryVisitorId);
    } catch {
      memoryVisitorId = makeId('v');
    }
  }
  setVisitorCookie(memoryVisitorId);

  if (!memorySessionId) {
    try {
      memorySessionId = sessionStorage.getItem(SESSION_STORAGE_KEY) || makeId('s');
      sessionStorage.setItem(SESSION_STORAGE_KEY, memorySessionId);
    } catch {
      memorySessionId = makeId('s');
    }
  }

  return { visitorId: memoryVisitorId, sessionId: memorySessionId };
}

/** Capture attribution params from the current URL into localStorage. */
export function captureAttribution(): Props {
  if (typeof window === 'undefined') return {};
  try {
    const url = new URL(window.location.href);
    const captured: Props = {};
    let changed = false;
    for (const key of UTM_KEYS) {
      const value = url.searchParams.get(key);
      if (value) {
        captured[key] = value.slice(0, 128);
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

function cleanProps(payload: Props): Record<string, Primitive> {
  const clean: Record<string, Primitive> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    clean[key] = typeof value === 'string' ? value.slice(0, 256) : value;
  }
  return clean;
}

/** Persist a canonical event to the first-party analytics endpoint. */
export function persistAnalyticsEvent(event: string, props: Props = {}) {
  if (typeof window === 'undefined') return;
  try {
    const attribution = captureAttribution();
    const identity = getClientIdentity();
    const payload = cleanProps({ ...attribution, ...props });
    const body = JSON.stringify({
      event: normalizeEventName(event),
      originalEvent: event,
      page: window.location.pathname,
      referrer: document.referrer || null,
      screen: `${window.screen.width}x${window.screen.height}`,
      title: document.title || null,
      utm: Object.fromEntries(
        UTM_KEYS.filter((key) => typeof attribution[key] === 'string').map((key) => [key, attribution[key]]),
      ),
      props: payload,
      visitorId: identity.visitorId,
      sessionId: identity.sessionId,
    });

    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Tracking must never break UX.
  }
}

/** Track a named event in both Vercel Analytics and the first-party funnel. */
export function track(event: string, props: Props = {}) {
  const canonicalEvent = normalizeEventName(event);
  try {
    const attribution = readAttribution();
    const clean = cleanProps({ ...attribution, ...props });
    vercelTrack(canonicalEvent, clean);
  } catch {
    // Vercel tracking must never break UX or prevent first-party tracking.
  }
  persistAnalyticsEvent(canonicalEvent, props);
}
