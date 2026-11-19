import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/request-identity';

/** Distributed, atomic limit. The database migration must be applied first. */
export async function enforceSecurityRateLimit(request: Request, scope: string, limit: number, windowSeconds: number) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });

  const bucket = createHash('sha256').update(`${scope}:${getClientIp(request)}`).digest('hex');
  try {
    const admin = createClient(url, key);
    const { data, error } = await admin.rpc('take_security_rate_limit', {
      p_bucket: bucket,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    const result = Array.isArray(data) ? data[0] : null;
    if (error || !result || typeof result.allowed !== 'boolean') {
      console.error('Security rate limit unavailable:', error?.message || 'invalid response');
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }
    if (!result.allowed) {
      return NextResponse.json(
        { code: 'RATE_LIMITED', error: 'Too many requests. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(result.retry_after_seconds || windowSeconds) } },
      );
    }
    return null;
  } catch (error) {
    console.error('Security rate limit failed:', error);
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }
}
