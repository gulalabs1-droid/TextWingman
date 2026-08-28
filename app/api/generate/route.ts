import { NextRequest, NextResponse } from 'next/server';
import { generateReplies, generateRepliesWithAgent } from '@/lib/openai';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getUserTier, ensureAdminAccess, hasPro } from '@/lib/entitlements';
import { getRequestIdentity } from '@/lib/request-identity';

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
    const { message, context, customContext, userIntent } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const requestIdentity = getRequestIdentity(request);
    const { ip, userAgent, fingerprint } = requestIdentity;
    
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
          : await generateReplies(message, context, customContext, userIntent);
        
        // Save to reply history + log usage for analytics
        const supabaseAdmin = getSupabaseAdmin();
        if (supabaseAdmin) {
          try {
            await Promise.all([
              supabaseAdmin.from('reply_history').insert({
                user_id: userId,
                their_message: message,
                generated_replies: JSON.stringify(replies),
                context: context || null,
              }),
              supabaseAdmin.from('usage_logs').insert({
                ip_address: ip,
                user_id: userId,
                user_agent: userAgent,
                action: 'generate_reply',
                fingerprint,
                metadata: requestIdentity.visitorId ? { visitor_id: requestIdentity.visitorId, outcome: 'success' } : { outcome: 'success' },
              }),
            ]);
          } catch (insertErr) {
            console.error('Reply history/usage insert exception:', insertErr);
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
    // Build count query
    let query = supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'generate_reply')
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
    const pendingMetadata = requestIdentity.visitorId
      ? { visitor_id: requestIdentity.visitorId, outcome: 'pending' }
      : { outcome: 'pending' };
    const { data: usageLog, error: insertError } = await supabase
      .from('usage_logs')
      .insert({
        ip_address: ip,
        user_id: userId,
        user_agent: userAgent,
        action: 'generate_reply',
        fingerprint: fingerprint,
        metadata: pendingMetadata,
      })
      .select('id')
      .single();
    
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
      : await generateReplies(message, context, customContext, userIntent);

    // Mark the pre-authorized usage row complete only after a real result exists.
    if (usageLog?.id) {
      const { error: outcomeError } = await supabase
        .from('usage_logs')
        .update({ metadata: { ...pendingMetadata, outcome: 'success' } })
        .eq('id', usageLog.id);
      if (outcomeError) console.error('Failed to mark reply usage successful:', outcomeError.message);
    }

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
