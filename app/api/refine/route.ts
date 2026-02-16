import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/entitlements';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TONE_GUIDANCE: Record<string, string> = {
  shorter: 'Brief, confident, minimal words. Cool and unbothered.',
  spicier: 'Playful, flirty, slight edge or swagger. Confident tension.',
  softer: 'Warm, genuine, thoughtful. Makes them feel good.',
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { original, edited, tone, context } = await request.json();

    if (!edited || typeof edited !== 'string') {
      return NextResponse.json({ error: 'Edited text is required' }, { status: 400 });
    }

    const toneHint = TONE_GUIDANCE[tone] || TONE_GUIDANCE.shorter;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a text message polish assistant. The user had an AI-generated reply and edited it to add their own ideas. Your job is to take their edited version and polish it so it sounds smooth, natural, and confident — like someone cool actually texting.

RULES:
- Keep it UNDER 18 words. If their edit is too long, trim cleverly without losing their intent.
- NO emojis.
- Keep the user's added ideas/content — they specifically wanted those included.
- Match the target tone: ${toneHint}
- Sound like a real text message, not a formal sentence.
- Use lowercase casual style if the original was casual.
- Don't add filler words. Every word should earn its spot.
- If they added something like wanting to get food or make plans, weave it in naturally — don't just tack it on.
${context ? `- Relationship context: ${context}` : ''}

Return ONLY the polished text. No quotes, no explanation, no JSON — just the final message.`,
        },
        {
          role: 'user',
          content: `Original AI reply: "${original || ''}"\nUser's edited version: "${edited}"\n\nPolish the user's edit to sound smooth while keeping their additions. Keep the ${tone || 'shorter'} tone.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const refined = completion.choices[0]?.message?.content?.trim();
    if (!refined) {
      return NextResponse.json({ error: 'Failed to refine' }, { status: 500 });
    }

    return NextResponse.json({ refined });
  } catch (error) {
    console.error('Refine error:', error);
    return NextResponse.json({ error: 'Failed to refine reply' }, { status: 500 });
  }
}
