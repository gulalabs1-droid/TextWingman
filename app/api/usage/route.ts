import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

let supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

const FREE_LIMIT = 3; // Matches homepage pricing: 3 free replies per day
const RESET_HOURS = 24;

// VPN/Abuse Detection - Moderate tolerance
const VPN_ABUSE_THRESHOLD = 5; // Max different IPs per fingerprint in 1 hour
const VPN_CHECK_WINDOW_HOURS = 1;

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return '127.0.0.1';
}

// Get browser fingerprint from headers (lightweight)
function getFingerprint(request: NextRequest): string {
  const ua = request.headers.get('user-agent') || '';
  const lang = request.headers.get('accept-language') || '';
  // Create a simple fingerprint from stable headers
  return Buffer.from(`${ua}-${lang}`).toString('base64').substring(0, 32);
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const cutoffTime = new Date(Date.now() - RESET_HOURS * 60 * 60 * 1000).toISOString();

    // Check if user is logged in
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    const userId = user?.id || null;

    // Build query - check by user_id if logged in, otherwise by IP
    let query = getSupabase()
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', cutoffTime);
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('ip_address', ip);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Usage check error:', error);
      return NextResponse.json({ error: 'Failed to check usage' }, { status: 500 });
    }

    const usageCount = count || 0;
    const remaining = Math.max(0, FREE_LIMIT - usageCount);
    const canGenerate = usageCount < FREE_LIMIT;

    return NextResponse.json({
      usageCount,
      remaining,
      limit: FREE_LIMIT,
      canGenerate,
      resetHours: RESET_HOURS,
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const fingerprint = getFingerprint(request);
    const cutoffTime = new Date(Date.now() - RESET_HOURS * 60 * 60 * 1000).toISOString();
    const vpnCheckTime = new Date(Date.now() - VPN_CHECK_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

    // Check if user is logged in
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    const userId = user?.id || null;

    // VPN/Abuse check: Count unique IPs for this fingerprint in last hour (skip for logged-in users)
    if (!userId) {
      const { data: recentLogs } = await getSupabase()
        .from('usage_logs')
        .select('ip_address')
        .eq('fingerprint', fingerprint)
        .gte('created_at', vpnCheckTime);

      if (recentLogs) {
        const uniqueIPs = new Set(recentLogs.map(log => log.ip_address));
        uniqueIPs.add(ip); // Include current IP
        
        if (uniqueIPs.size >= VPN_ABUSE_THRESHOLD) {
          return NextResponse.json({
            error: 'vpn_abuse_detected',
            message: 'Unusual activity detected. Upgrade to Pro for unlimited access.',
            upgradeUrl: '/#pricing',
            usageCount: FREE_LIMIT,
            remaining: 0,
            canGenerate: false,
          }, { status: 429 });
        }
      }
    }

    // Build query - check by user_id if logged in, otherwise by IP
    let countQuery = getSupabase()
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', cutoffTime);
    
    if (userId) {
      countQuery = countQuery.eq('user_id', userId);
    } else {
      countQuery = countQuery.eq('ip_address', ip);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Usage count error:', countError);
      return NextResponse.json({ error: 'Failed to check usage' }, { status: 500 });
    }

    const usageCount = count || 0;

    if (usageCount >= FREE_LIMIT) {
      return NextResponse.json({
        error: 'Free limit reached',
        usageCount,
        remaining: 0,
        limit: FREE_LIMIT,
        canGenerate: false,
      }, { status: 429 });
    }

    const { error: insertError } = await getSupabase()
      .from('usage_logs')
      .insert({
        ip_address: ip,
        user_id: userId,
        user_agent: userAgent,
        action: 'generate_reply',
        fingerprint: fingerprint,
      });

    if (insertError) {
      console.error('Usage log insert error:', insertError);
      return NextResponse.json({ error: 'Failed to log usage' }, { status: 500 });
    }

    const newCount = usageCount + 1;
    const remaining = Math.max(0, FREE_LIMIT - newCount);

    return NextResponse.json({
      usageCount: newCount,
      remaining,
      limit: FREE_LIMIT,
      canGenerate: newCount < FREE_LIMIT,
    });
  } catch (error) {
    console.error('Usage POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
