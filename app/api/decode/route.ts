import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getUserTier, ensureAdminAccess, hasPro } from '@/lib/entitlements';
import crypto from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FREE_DECODE_LIMIT = 1;
const RESET_HOURS = 24;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

function getFingerprint(request: NextRequest): string {
  const ua = request.headers.get('user-agent') || '';
  const lang = request.headers.get('accept-language') || '';
  return crypto.createHash('sha256').update(`${ua}-${lang}`).digest('hex').substring(0, 32);
}

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message || typeof message !== 'string' || message.trim().length < 2) {
      return NextResponse.json(
        { error: 'A message is required' },
        { status: 400 }
      );
    }

    // --- Usage gating ---
    const ip = getClientIP(request);
    const fingerprint = getFingerprint(request);
    const cutoffTime = new Date(Date.now() - RESET_HOURS * 60 * 60 * 1000).toISOString();
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    const userId = user?.id || null;
    let isPro = false;

    if (userId && user?.email) {
      await ensureAdminAccess(userId, user.email);
      const entitlement = await getUserTier(userId, user.email);
      isPro = hasPro(entitlement.tier);
    }

    const admin = getSupabaseAdmin();
    if (!isPro && admin) {
      let countQuery = admin
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'decode')
        .gte('created_at', cutoffTime);

      if (userId) {
        countQuery = countQuery.eq('user_id', userId);
      } else {
        countQuery = countQuery.or(`ip_address.eq.${ip},fingerprint.eq.${fingerprint}`);
      }

      const { count } = await countQuery;
      if ((count || 0) >= FREE_DECODE_LIMIT) {
        return NextResponse.json(
          { error: 'decode_limit_reached', message: 'Free decode limit reached. Upgrade to Pro for unlimited decodes.' },
          { status: 429 }
        );
      }
    }

    const contextLabel = context || 'general';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a texting behavior analyst for a reply-generation app. The user will paste a message (or full conversation thread) they RECEIVED from someone.

Context: This is a ${contextLabel} conversation.

Your job: Analyze the subtext, intent, and emotional dynamics behind the message(s).

Return a JSON object:
{
  "intent": "1-sentence summary of what the sender actually means/wants",
  "subtext": "2-3 sentences explaining the hidden meaning, tone, and what they're really saying between the lines",
  "energy": "interested" | "testing" | "neutral" | "pulling-away" | "flirty" | "confrontational" | "anxious" | "playful" | "cold" | "warm",
  "flags": [
    { "type": "green" | "red" | "yellow", "text": "short flag description" }
  ],
  "coach_tip": "1-2 sentence tactical advice on how to respond to this message"
}

Rules:
- Be direct and real. Don't sugarcoat.
- flags array: 1-4 flags max. green = positive signal, red = warning sign, yellow = worth noting.
- coach_tip should be actionable texting advice, not generic.
- If the input is a full conversation thread (with "Them:" and "You:" prefixes), analyze the overall dynamic and focus on the latest message from "Them:".
- Keep it concise. No fluff.`
        },
        {
          role: 'user',
          content: message.trim(),
        },
      ],
      temperature: 0.3,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json(
        { error: 'Failed to analyze message' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(responseText);

    // Log usage after successful decode
    if (admin) {
      await admin.from('usage_logs').insert({
        ip_address: ip,
        user_id: userId,
        user_agent: request.headers.get('user-agent') || 'unknown',
        action: 'decode',
        fingerprint,
      });
    }

    return NextResponse.json({
      intent: parsed.intent || 'Could not determine intent',
      subtext: parsed.subtext || '',
      energy: parsed.energy || 'neutral',
      flags: parsed.flags || [],
      coach_tip: parsed.coach_tip || '',
      error: null,
    });

  } catch (error) {
    console.error('Decode error:', error);
    return NextResponse.json(
      { error: 'Failed to decode the message. Please try again.' },
      { status: 500 }
    );
  }
}
