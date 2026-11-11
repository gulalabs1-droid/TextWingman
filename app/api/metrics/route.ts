import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getClientIp } from '@/lib/request-identity';
import { FREE_REPLY_LIMIT, remainingFreeUses, replyUsageCutoff } from '@/lib/usage-limits';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Return zero metrics if Supabase is not configured
    if (!supabase) {
      return NextResponse.json({
        today: { count: 0, limit: FREE_REPLY_LIMIT, remaining: FREE_REPLY_LIMIT },
        allTime: { count: 0 },
      });
    }

    // Get IP for basic user identification (in production, use proper auth)
    const ip = getClientIp(request);
    
    const cutoffTime = replyUsageCutoff();
    
    // Get today's usage count
    const { data: todayLogs, error: todayError } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('ip_address', ip)
      .eq('action', 'generate_reply')
      .gte('created_at', cutoffTime);

    if (todayError) {
      throw todayError;
    }

    // Get all-time usage count
    const { data: allLogs, error: allError } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('ip_address', ip);

    if (allError) {
      throw allError;
    }

    return NextResponse.json({
      today: {
        count: todayLogs?.length || 0,
        limit: FREE_REPLY_LIMIT,
        remaining: remainingFreeUses(todayLogs?.length || 0),
      },
      allTime: {
        count: allLogs?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
