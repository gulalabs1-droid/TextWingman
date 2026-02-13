import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getUserTier, ensureAdminAccess, hasPro } from '@/lib/entitlements';
import crypto from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FREE_OPENER_LIMIT = 1;
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

type OpenerContext = 'dating-app' | 'instagram-dm' | 'cold-text' | 'reconnect' | 'networking';

const CONTEXT_PROMPTS: Record<OpenerContext, string> = {
  'dating-app': 'This is for a dating app match (Tinder, Hinge, Bumble). The opener should be playful, show genuine curiosity, and stand out from generic "hey" messages. Reference their bio/photos if a description is provided.',
  'instagram-dm': 'This is an Instagram DM to someone they find attractive or interesting. Should feel natural and not creepy — reference a story, post, or something specific.',
  'cold-text': 'This is a first text to someone whose number they just got (from a bar, event, mutual friend). Should remind them who you are and create an easy opening.',
  'reconnect': 'This is a text to someone they haven\'t talked to in a while. Should feel casual and not desperate — create a natural reason to reconnect.',
  'networking': 'This is a professional/networking message. Should be concise, respectful of their time, and have a clear ask or value proposition.',
};

export async function POST(request: NextRequest) {
  try {
    const { context, description, vibe } = await request.json();

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
        .eq('action', 'generate_opener')
        .gte('created_at', cutoffTime);

      if (userId) {
        countQuery = countQuery.eq('user_id', userId);
      } else {
        countQuery = countQuery.or(`ip_address.eq.${ip},fingerprint.eq.${fingerprint}`);
      }

      const { count } = await countQuery;
      if ((count || 0) >= FREE_OPENER_LIMIT) {
        return NextResponse.json(
          { error: 'opener_limit_reached', message: 'Free opener limit reached. Upgrade to Pro for unlimited openers.' },
          { status: 429 }
        );
      }
    }

    const openerContext = (context as OpenerContext) || 'dating-app';
    const contextPrompt = CONTEXT_PROMPTS[openerContext] || CONTEXT_PROMPTS['dating-app'];
    const vibeNote = vibe ? `\nDesired vibe: ${vibe}` : '';
    const descNote = description ? `\nAbout the person: ${description}` : '';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a texting expert that generates opening messages. You help people start conversations with confidence.

${contextPrompt}${descNote}${vibeNote}

Rules:
- Generate exactly 3 opening messages with different energies
- Keep each opener under 20 words
- No emojis unless the vibe specifically calls for it
- No generic greetings like "hey" or "what's up" alone
- Each opener should have a different approach: one direct/bold, one witty/playful, one warm/genuine
- Sound like a real person, not an AI
- Never be creepy, needy, or try-hard

Return a JSON object:
{
  "openers": [
    { "tone": "bold", "text": "the direct opener", "why": "1-sentence explanation of why this works" },
    { "tone": "witty", "text": "the playful opener", "why": "1-sentence explanation of why this works" },
    { "tone": "warm", "text": "the genuine opener", "why": "1-sentence explanation of why this works" }
  ]
}`
        },
        {
          role: 'user',
          content: `Generate 3 opening messages for a ${openerContext} conversation.${descNote}${vibeNote}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json(
        { error: 'Failed to generate openers' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(responseText);

    if (!parsed.openers || !Array.isArray(parsed.openers) || parsed.openers.length === 0) {
      return NextResponse.json(
        { error: 'No openers generated' },
        { status: 500 }
      );
    }

    // Log usage after successful opener generation
    if (admin) {
      await admin.from('usage_logs').insert({
        ip_address: ip,
        user_id: userId,
        user_agent: request.headers.get('user-agent') || 'unknown',
        action: 'generate_opener',
        fingerprint,
      });
    }

    return NextResponse.json({
      openers: parsed.openers,
      error: null,
    });

  } catch (error) {
    console.error('Generate opener error:', error);
    return NextResponse.json(
      { error: 'Failed to generate openers. Please try again.' },
      { status: 500 }
    );
  }
}
