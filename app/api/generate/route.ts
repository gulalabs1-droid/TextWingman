import { NextRequest, NextResponse } from 'next/server';
import { generateReplies, generateRepliesWithAgent } from '@/lib/openai';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const FREE_USAGE_LIMIT = 3; // Matches homepage pricing: 3 free replies per day

// Use service role key to bypass RLS for usage tracking
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get IP for anonymous users
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'anonymous';
    
    // Check if user is logged in
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    const userId = user?.id || null;
    
    // Check if user has active subscription (skip limits for Pro users)
    if (userId) {
      const supabaseAdmin = getSupabaseAdmin();
      if (supabaseAdmin) {
        const { data: subscription } = await supabaseAdmin
          .from('subscriptions')
          .select('status')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();
        
        if (subscription) {
          // Pro user - generate without limits
          const replies = process.env.TEXT_WINGMAN_AGENT_ID
            ? await generateRepliesWithAgent(message)
            : await generateReplies(message);
          return NextResponse.json({ replies });
        }
      }
    }
    
    const supabase = getSupabaseAdmin();
    
    // Server-side usage check - always enforce limits
    if (supabase) {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // Build query - check by user_id if logged in, otherwise by IP
      let query = supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', cutoffTime);
      
      if (userId) {
        // Logged-in user: check by user_id (persists across browsers)
        query = query.eq('user_id', userId);
      } else {
        // Anonymous user: check by IP
        query = query.eq('ip_address', ip);
      }
      
      const { count, error: fetchError } = await query;

      if (fetchError) {
        console.error('Supabase usage check error:', fetchError);
      }

      // Check if free tier limit reached
      if (count !== null && count >= FREE_USAGE_LIMIT) {
        return NextResponse.json(
          { 
            error: 'Usage limit reached',
            message: `You've reached your daily limit of ${FREE_USAGE_LIMIT} free replies. Upgrade to Pro for unlimited!`,
          },
          { status: 429 }
        );
      }

      // Log usage BEFORE generating (prevents bypass)
      const { error: insertError } = await supabase
        .from('usage_logs')
        .insert({
          ip_address: ip,
          user_id: userId,
          user_agent: request.headers.get('user-agent') || 'unknown',
          action: 'generate_reply',
        });

      if (insertError) {
        console.error('Failed to log usage:', insertError);
      }
    } else {
      console.warn('No Supabase admin client - usage not tracked');
    }

    // Generate replies using OpenAI
    const replies = process.env.TEXT_WINGMAN_AGENT_ID
      ? await generateRepliesWithAgent(message)
      : await generateReplies(message);

    return NextResponse.json({ replies });
  } catch (error) {
    console.error('Error in generate API:', error);
    return NextResponse.json(
      { error: 'Failed to generate replies' },
      { status: 500 }
    );
  }
}
