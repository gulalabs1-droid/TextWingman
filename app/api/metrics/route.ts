import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Return zero metrics if Supabase is not configured
    if (!supabase) {
      return NextResponse.json({
        today: { count: 0, limit: 3, remaining: 3 },
        allTime: { count: 0 },
      });
    }

    // Get IP for basic user identification (in production, use proper auth)
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's usage count
    const { data: todayLogs, error: todayError } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('ip_address', ip)
      .gte('created_at', today);

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

    const freeLimit = 3; // Matches homepage pricing: 3 free replies per day

    return NextResponse.json({
      today: {
        count: todayLogs?.length || 0,
        limit: freeLimit,
        remaining: Math.max(0, freeLimit - (todayLogs?.length || 0)),
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
