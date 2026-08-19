import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Keeps the Supabase project from auto-pausing.
// Free-tier Supabase projects pause after 7 consecutive days with no database
// activity, which takes the whole app down (auth + admin pages hang, then 504).
// Vercel Cron hits this once a day so the project always looks active.
export async function GET(request: NextRequest) {
  // Vercel automatically sends `Authorization: Bearer $CRON_SECRET` when the
  // CRON_SECRET env var is set. Reject anything else so this can't be abused.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: 'supabase env missing' }, { status: 503 });
  }

  try {
    const db = createClient(url, key);
    // Cheapest possible real query: a single indexed row, no payload.
    const { error } = await db.from('profiles').select('id').limit(1);
    if (error) {
      console.error('keepalive query failed:', error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, pinged_at: new Date().toISOString() });
  } catch (e) {
    console.error('keepalive error:', e);
    return NextResponse.json({ ok: false, error: 'ping failed' }, { status: 500 });
  }
}
