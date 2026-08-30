import { getRequestIdentity } from '@/lib/request-identity';

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'src',
  'via',
  'video_id',
] as const;

type Primitive = string | number | boolean | null;

type ClientAnalyticsInput = {
  visitorId?: unknown;
  sessionId?: unknown;
  page?: unknown;
  referrer?: unknown;
  attribution?: unknown;
  utm?: unknown;
};

export type RequestAnalytics = ReturnType<typeof buildRequestAnalytics>;

function safeString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function safeProps(value: unknown): Record<string, Primitive> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, Primitive> = {};
  for (const [key, valueForKey] of Object.entries(value as Record<string, unknown>).slice(0, 30)) {
    const safeKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 64);
    if (!safeKey) continue;
    if (typeof valueForKey === 'string') result[safeKey] = valueForKey.slice(0, 256);
    else if (typeof valueForKey === 'number' && Number.isFinite(valueForKey)) result[safeKey] = valueForKey;
    else if (typeof valueForKey === 'boolean' || valueForKey === null) result[safeKey] = valueForKey;
  }
  return result;
}

function safeUtm(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const clean = safeString((value as Record<string, unknown>)[key], 128);
    if (clean) result[key] = clean;
  }
  return result;
}

function readClientAnalytics(value: unknown): ClientAnalyticsInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as ClientAnalyticsInput;
}

/**
 * Build trusted request identity plus sanitized client attribution. Client IDs
 * are useful for measurement but never participate in authorization or limits.
 */
export function buildRequestAnalytics(request: Request, input: unknown, outcome: string, props: Record<string, Primitive> = {}) {
  const client = readClientAnalytics(input);
  const attribution = safeUtm(client.attribution ?? client.utm);
  const visitorId = safeString(client.visitorId, 128);
  const sessionId = safeString(client.sessionId, 128);
  // The body is user-controlled. Keep it out of the trusted fingerprint used
  // by rate limits; it is only a measurement key.
  const identity = getRequestIdentity(request);
  const measurementVisitorId = visitorId || identity.visitorId;

  return {
    identity,
    metadata: {
      outcome: outcome.slice(0, 64),
      page: safeString(client.page, 512) || '/app',
      referrer: safeString(client.referrer, 512),
      ...(measurementVisitorId ? { visitor_id: measurementVisitorId } : {}),
      ...(sessionId ? { session_id: sessionId } : {}),
      ...(Object.keys(attribution).length ? { utm: attribution } : {}),
      ...(attribution.video_id ? { video_id: attribution.video_id } : {}),
      props: safeProps({ ...props, ...(attribution.video_id ? { video_id: attribution.video_id } : {}) }),
    },
  };
}
