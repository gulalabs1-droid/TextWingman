import { NextRequest, NextResponse } from 'next/server';
import { generateReplies, generateRepliesWithAgent } from '@/lib/openai';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getUserTier, ensureAdminAccess, hasPro } from '@/lib/entitlements';
import crypto from 'crypto';

const FREE_USAGE_LIMIT = 5; // 5 free replies per day

// Use service role key to bypass RLS for usage tracking
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const { message, context, customContext } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get IP for anonymous users (must match usage route logic)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIP || '127.0.0.1');
    
    // Check if user is logged in
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    const userId = user?.id || null;
    
    // Check Pro access via entitlements (covers admin, beta, and Stripe users)
    if (userId && user?.email) {
      await ensureAdminAccess(userId, user.email);
      const entitlement = await getUserTier(userId, user.email);
      
      if (hasPro(entitlement.tier)) {
        // Pro/Elite user - generate without limits
        const replies = process.env.TEXT_WINGMAN_AGENT_ID
          ? await generateRepliesWithAgent(message, context)
          : await generateReplies(message, context, customContext);
        
        // Save to reply history
        const supabaseAdmin = getSupabaseAdmin();
        if (supabaseAdmin) {
          try {
            const { error: historyError } = await supabaseAdmin
              .from('reply_history')
              .insert({
                user_id: userId,
                their_message: message,
                generated_replies: JSON.stringify(replies),
                context: context || null,
              });
            
            if (historyError) {
              console.error('Failed to save reply history:', historyError.message, historyError.details);
            }
          } catch (insertErr) {
            console.error('Reply history insert exception:', insertErr);
          }
        }
        
        return NextResponse.json({ replies });
      }
    }
    
    // FAIL-CLOSED: If we can't verify usage, deny the request
    const supabase = getSupabaseAdmin();
    
    if (!supabase) {
      console.error('CRITICAL: No Supabase admin client — blocking free-tier generate');
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const lang = request.headers.get('accept-language') || '';
    const fingerprint = crypto.createHash('sha256').update(`${userAgent}-${lang}`).digest('hex').substring(0, 32);
    
    // Build count query
    let query = supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', cutoffTime);
    
    if (userId) {
      // Logged-in user: count only their own usage (not shared IP)
      query = query.eq('user_id', userId);
    } else {
      // Anonymous: check by IP OR fingerprint (catches incognito/VPN)
      query = query.or(`ip_address.eq.${ip},fingerprint.eq.${fingerprint}`);
    }
    
    const { count, error: fetchError } = await query;

    // FAIL-CLOSED: If count query fails, deny
    if (fetchError) {
      console.error('Usage check query failed — blocking request:', fetchError);
      return NextResponse.json(
        { error: 'Unable to verify usage. Please try again.' },
        { status: 503 }
      );
    }

    const usageCount = count ?? 0;

    if (usageCount >= FREE_USAGE_LIMIT) {
      return NextResponse.json(
        { 
          error: 'Usage limit reached',
          message: `You've reached your daily limit of ${FREE_USAGE_LIMIT} free replies. Upgrade to Pro for unlimited!`,
        },
        { status: 429 }
      );
    }

    // Log usage BEFORE generating (so we never generate without logging)
    const { error: insertError } = await supabase
      .from('usage_logs')
      .insert({
        ip_address: ip,
        user_id: userId,
        user_agent: userAgent,
        action: 'generate_reply',
        fingerprint: fingerprint,
      });
    
    // FAIL-CLOSED: If we can't log usage, deny
    if (insertError) {
      console.error('Usage log insert failed — blocking request:', insertError);
      return NextResponse.json(
        { error: 'Unable to track usage. Please try again.' },
        { status: 503 }
      );
    }

    // Generate replies using OpenAI
    const replies = process.env.TEXT_WINGMAN_AGENT_ID
      ? await generateRepliesWithAgent(message, context)
      : await generateReplies(message, context, customContext);

    // Save to reply history for logged-in users
    if (userId && supabase) {
      try {
        const { error: historyError } = await supabase
          .from('reply_history')
          .insert({
            user_id: userId,
            their_message: message,
            generated_replies: JSON.stringify(replies),
            context: context || null,
          });
        
        if (historyError) {
          console.error('Failed to save reply history for free user:', historyError.message);
        }
      } catch (insertErr) {
        console.error('Reply history insert exception (free):', insertErr);
      }
    }

    return NextResponse.json({ replies });
  } catch (error) {
    console.error('Error in generate API:', error);
    return NextResponse.json(
      { error: 'Failed to generate replies' },
      { status: 500 }
    );
  }
}
