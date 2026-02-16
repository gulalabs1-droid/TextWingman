import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getUserTier, ensureAdminAccess, hasPro } from '@/lib/entitlements';
import crypto from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FREE_REVIVE_LIMIT = 1;
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
        { error: 'A conversation is required' },
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
        .eq('action', 'generate_revive')
        .gte('created_at', cutoffTime);

      if (userId) {
        countQuery = countQuery.eq('user_id', userId);
      } else {
        countQuery = countQuery.or(`ip_address.eq.${ip},fingerprint.eq.${fingerprint}`);
      }

      const { count } = await countQuery;
      if ((count || 0) >= FREE_REVIVE_LIMIT) {
        return NextResponse.json(
          { error: 'revive_limit_reached', message: 'Free revive limit reached. Upgrade to Pro for unlimited revives.' },
          { status: 429 }
        );
      }
    }

    const contextLabel = context || 'crush';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a texting expert specializing in REVIVING dead or stale conversations. The user will paste a conversation (or screenshot-extracted thread) where the other person has gone cold, low-effort, or the convo died out.

CONTEXT: This is a ${contextLabel} conversation.

YOUR MISSION: Generate 3 "revive" messages that re-engage the other person naturally. These are NOT replies to a specific message — they're conversation restarters sent after days/weeks of silence or after the convo fizzled.

YOUR PHILOSOPHY:
- Never be thirsty, desperate, or needy. No "hey stranger" or "I miss talking to you."
- Be a gentleman but not a pushover. Confident, not chasing.
- Low-hanging fruit approach: make it EASY for them to respond. Low pressure, high curiosity.
- Reference something from the convo history if available (callback humor, shared topic).
- Create a reason to text that doesn't scream "I've been thinking about you for 3 weeks."
- Match their energy level — if they were casual/slang before, keep that register.
- These should feel like the person just happened to think of something, not like they're strategically re-engaging (even though they are).

GOOD REVIVE APPROACHES:
- Callback to something they mentioned ("did you ever end up trying that place")
- Shared reference or inside joke from the convo
- Low-stakes opinion question ("settle a debate for me real quick")
- Something you "saw that reminded you of them" (without saying that cheesy phrase)
- Playful accusation ("you fell off the earth huh")
- Casual life update that invites response

BAD REVIVE APPROACHES (never do these):
- "Hey" / "Hey stranger" / "Long time no talk"
- "I miss you" / "Thinking about you"
- Anything that acknowledges the silence in a needy way
- Double-texting energy (don't reference that they didn't reply)
- Asking them out immediately (too much pressure)
- Generic questions with no hook ("what's up" / "how are you")

RULES:
- 3 messages with different approaches: "smooth" (effortless callback), "bold" (playful + direct), "warm" (genuine + low-key)
- Under 18 words each
- No emojis
- Sound like a real person, not an AI
- If you have conversation history, USE IT for callbacks. If not, go with universal approaches.

Return a JSON object:
{
  "analysis": "1-2 sentences about the conversation dynamic and why it died",
  "revives": [
    { "tone": "smooth", "text": "the revive message", "why": "1-sentence explanation of why this works" },
    { "tone": "bold", "text": "the revive message", "why": "1-sentence explanation of why this works" },
    { "tone": "warm", "text": "the revive message", "why": "1-sentence explanation of why this works" }
  ]
}`
        },
        {
          role: 'user',
          content: message.trim(),
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json(
        { error: 'Failed to generate revive messages' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(responseText);

    if (!parsed.revives || !Array.isArray(parsed.revives) || parsed.revives.length === 0) {
      return NextResponse.json(
        { error: 'No revive messages generated' },
        { status: 500 }
      );
    }

    // Log usage after successful revive generation
    if (admin) {
      await admin.from('usage_logs').insert({
        ip_address: ip,
        user_id: userId,
        user_agent: request.headers.get('user-agent') || 'unknown',
        action: 'generate_revive',
        fingerprint,
      });
    }

    return NextResponse.json({
      analysis: parsed.analysis || '',
      revives: parsed.revives,
      error: null,
    });

  } catch (error) {
    console.error('Generate revive error:', error);
    return NextResponse.json(
      { error: 'Failed to generate revive messages. Please try again.' },
      { status: 500 }
    );
  }
}
