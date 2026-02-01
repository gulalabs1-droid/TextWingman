import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const cutoffTime = new Date(Date.now() - RESET_HOURS * 60 * 60 * 1000).toISOString();

    const { count, error } = await getSupabase()
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', cutoffTime);

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
    const cutoffTime = new Date(Date.now() - RESET_HOURS * 60 * 60 * 1000).toISOString();

    const { count, error: countError } = await getSupabase()
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', cutoffTime);

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
        user_agent: userAgent,
        action: 'generate_reply',
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
