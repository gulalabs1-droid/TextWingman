import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TONE_MAP: Record<string, string> = {
  flirty: 'Playful, teasing, confident tension. Slight innuendo or charm without being cringe. Like someone who knows they\'re attractive.',
  chill: 'Relaxed, unbothered, low-effort cool. Short words, no try-hard energy. Like you have better things to do but chose to reply.',
  bold: 'Direct, assertive, no beating around the bush. Confident and commanding. Says what they mean without hesitation.',
  witty: 'Clever, quick, sharp humor. Wordplay or unexpected angles. Makes them laugh and think at the same time.',
  warm: 'Genuine, caring, emotionally present. Makes the other person feel seen and valued without being needy.',
  pro: 'Professional, polished, appropriate. Clear and respectful. Good for work texts or when you need to be taken seriously.',
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { draft, tone, context, customContext } = await request.json();

    if (!draft || typeof draft !== 'string' || !draft.trim()) {
      return NextResponse.json({ error: 'Draft message is required' }, { status: 400 });
    }

    if (!tone || !TONE_MAP[tone]) {
      return NextResponse.json({ error: 'Invalid tone' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a tone translator for text messages. The user wrote their own message and wants it rewritten in a specific energy/tone while keeping their intent and content intact.

TARGET TONE: ${TONE_MAP[tone]}

RULES:
- Keep the core meaning and intent of their message.
- Rewrite it to match the target tone perfectly.
- Keep it under 25 words. Shorter is better.
- NO emojis.
- Sound like a real text message, not a formal sentence.
- Use lowercase casual style unless the tone is "pro".
- Don't add information they didn't include.
- Don't lose specific details (names, plans, times) from their original.
${context ? `- Relationship context: ${context}` : ''}
${customContext ? `- Situation: ${customContext}` : ''}

Return ONLY the rewritten message. No quotes, no explanation.`,
        },
        {
          role: 'user',
          content: `Rewrite this in a ${tone} tone:\n"${draft.trim()}"`,
        },
      ],
      temperature: 0.8,
      max_tokens: 80,
    });

    const translated = completion.choices[0]?.message?.content?.trim();
    if (!translated) {
      return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }

    return NextResponse.json({ translated, tone });
  } catch (error) {
    console.error('Translate tone error:', error);
    return NextResponse.json({ error: 'Failed to translate tone' }, { status: 500 });
  }
}
