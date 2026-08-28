import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { isAllowedEventName, normalizeEventName } from '@/lib/analytics-events';
import { getRequestIdentity } from '@/lib/request-identity';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
const clamp = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

function safeProps(value: unknown): Record<string, string | number | boolean | null> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>).slice(0, 50)) {
    const safeKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 64);
    if (!safeKey) continue;
    if (typeof raw === 'string') result[safeKey] = raw.slice(0, 256);
    else if (typeof raw === 'number' && Number.isFinite(raw)) result[safeKey] = raw;
    else if (typeof raw === 'boolean' || raw === null) result[safeKey] = raw;
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const rawEvent = clamp(input.event, 64);
    if (rawEvent && !isAllowedEventName(rawEvent)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const event = rawEvent ? normalizeEventName(rawEvent) : 'page_view';
    const safePage = clamp(input.page, 512) || '/';
    const safeReferrer = clamp(input.referrer, 512);
    const safeScreen = clamp(input.screen, 32);
    const safeTitle = clamp(input.title, 256);
    const visitorId = clamp(input.visitorId, 128);
    const sessionId = clamp(input.sessionId, 128);
    const creativeId = clamp(input.creativeId, 128);

    const allowedUtm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'via', 'video_id'];
    let safeUtm: Record<string, string> | undefined;
    if (input.utm && typeof input.utm === 'object' && !Array.isArray(input.utm)) {
      const entries: [string, string][] = [];
      for (const key of allowedUtm) {
        const value = clamp((input.utm as Record<string, unknown>)[key], 128);
        if (value) entries.push([key, value]);
      }
      if (entries.length) safeUtm = Object.fromEntries(entries);
    }

    const db = getSupabaseAdmin();
    if (!db) return NextResponse.json({ ok: false }, { status: 503 });

    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    const identity = getRequestIdentity(request, visitorId);

    const country = request.headers.get('x-vercel-ip-country') || null;
    const city = request.headers.get('x-vercel-ip-city') || null;
    const region = request.headers.get('x-vercel-ip-region') || null;
    const latitude = request.headers.get('x-vercel-ip-latitude') || null;
    const longitude = request.headers.get('x-vercel-ip-longitude') || null;
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|Opera Mini|IEMobile/i.test(identity.userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(identity.userAgent);
    const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

    let browser = 'other';
    if (/Chrome\//.test(identity.userAgent) && !/Edg\//.test(identity.userAgent)) browser = 'chrome';
    else if (/Safari\//.test(identity.userAgent) && !/Chrome\//.test(identity.userAgent)) browser = 'safari';
    else if (/Firefox\//.test(identity.userAgent)) browser = 'firefox';
    else if (/Edg\//.test(identity.userAgent)) browser = 'edge';

    let os = 'other';
    if (/iPhone|iPad|iPod/.test(identity.userAgent)) os = 'ios';
    else if (/Mac OS/.test(identity.userAgent)) os = 'macos';
    else if (/Android/.test(identity.userAgent)) os = 'android';
    else if (/Windows/.test(identity.userAgent)) os = 'windows';
    else if (/Linux/.test(identity.userAgent)) os = 'linux';

    const metadata = {
      page: safePage,
      title: safeTitle,
      referrer: safeReferrer,
      screen: safeScreen,
      device,
      browser,
      os,
      country,
      city,
      region,
      latitude,
      longitude,
      lang: identity.language.split(',')[0] || null,
      event,
      ...(rawEvent && rawEvent !== event ? { original_event: rawEvent } : {}),
      ...(visitorId || identity.visitorId ? { visitor_id: visitorId || identity.visitorId } : {}),
      ...(sessionId ? { session_id: sessionId } : {}),
      ...(creativeId ? { creative_id: creativeId } : {}),
      ...(safeUtm ? { utm: safeUtm } : {}),
      props: safeProps(input.props),
    };

    const { error: insertError } = await db.from('usage_logs').insert({
      ip_address: identity.ip,
      user_id: user?.id || null,
      user_agent: identity.userAgent,
      action: event,
      fingerprint: identity.fingerprint,
      metadata,
    });

    if (insertError) {
      console.error('Track insert error:', insertError.message);
      return NextResponse.json({ ok: false }, { status: 503 });
    }

    return NextResponse.json({ ok: true, event });
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
