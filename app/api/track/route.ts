import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page, referrer, screen, utm, title } = body as {
      page?: string;
      referrer?: string;
      screen?: string;
      utm?: Record<string, string>;
      title?: string;
    };

    if (!page) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    if (!db) {
      return NextResponse.json({ ok: false }, { status: 503 });
    }

    // Get user if logged in
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    const userId = user?.id || null;

    // IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIP || '127.0.0.1');

    // Geo from Vercel headers
    const country = request.headers.get('x-vercel-ip-country') || null;
    const city = request.headers.get('x-vercel-ip-city') || null;
    const region = request.headers.get('x-vercel-ip-region') || null;
    const latitude = request.headers.get('x-vercel-ip-latitude') || null;
    const longitude = request.headers.get('x-vercel-ip-longitude') || null;

    // User agent + fingerprint
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const lang = request.headers.get('accept-language') || '';
    const fingerprint = crypto.createHash('sha256').update(`${userAgent}-${lang}`).digest('hex').substring(0, 32);

    // Parse device info from user-agent
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|Opera Mini|IEMobile/i.test(userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
    const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

    // Browser detection
    let browser = 'other';
    if (/Chrome\//.test(userAgent) && !/Edg\//.test(userAgent)) browser = 'chrome';
    else if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) browser = 'safari';
    else if (/Firefox\//.test(userAgent)) browser = 'firefox';
    else if (/Edg\//.test(userAgent)) browser = 'edge';

    // OS detection
    let os = 'other';
    if (/iPhone|iPad|iPod/.test(userAgent)) os = 'ios';
    else if (/Mac OS/.test(userAgent)) os = 'macos';
    else if (/Android/.test(userAgent)) os = 'android';
    else if (/Windows/.test(userAgent)) os = 'windows';
    else if (/Linux/.test(userAgent)) os = 'linux';

    const metadata = {
      page,
      title: title || null,
      referrer: referrer || null,
      screen: screen || null,
      device,
      browser,
      os,
      country,
      city,
      region,
      latitude,
      longitude,
      lang: lang.split(',')[0] || null,
      ...(utm && Object.keys(utm).length > 0 ? { utm } : {}),
    };

    await db.from('usage_logs').insert({
      ip_address: ip,
      user_id: userId,
      user_agent: userAgent,
      action: 'page_view',
      fingerprint,
      metadata,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Track error:', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
