import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { draft, context, customContext, lastReceived } = await request.json();

    if (!draft || typeof draft !== 'string' || draft.trim().length < 8) {
      return NextResponse.json({ error: 'Message too short to analyze' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Text Wingman's Vibe Check coach. You analyze text messages BEFORE they're sent to give the sender feedback on how it reads. You're like a sharp friend reading over their shoulder.

Core Principles:
- Always assume positive intent but be brutally honest about how the message reads.
- Protect the user from looking needy, desperate, or try-hard.
- Reward confidence, brevity, and personality.

Analyze the draft message and return a JSON object with:
- "energy": one of "too_eager", "eager", "perfect", "chill", "too_cold"
- "vibe": a 2-4 word label like "confident & playful", "trying too hard", "perfectly unbothered", "a bit needy", "ice cold"
- "confidence_level": "high" | "medium" | "low" — how confident does the sender sound?
- "neediness_risk": "none" | "slight" | "moderate" | "high" — any signs of seeking validation, over-explaining, double questions, apologetic tone?
- "sarcasm_risk": "none" | "might_misread" | "clear_sarcasm" — if the user is trying to be funny/sarcastic, could it be misread as serious or mean?
- "frame_strength": "strong" | "neutral" | "weak" — is the sender holding their frame (confident, unbothered) or giving it away (over-investing, seeking approval)?
- "tip": one short sentence of advice (max 12 words). Be direct and useful. Examples: "Drop the question mark, make it a statement." or "Perfect energy, send it." or "Too many words — cut it in half." or "This screams needy. Rewrite as a statement."
- "score": 1-10 where 1 is cringe/desperate and 10 is perfectly calibrated

${context ? `Relationship context: ${context}` : ''}
${customContext ? `Situation: ${customContext}` : ''}
${lastReceived ? `They last said: "${lastReceived}"` : ''}

Be honest and direct. Don't sugarcoat. If the message is good, say so. If it's cringe, call it out. Talk like a sharp friend, not a therapist.

Return ONLY valid JSON. No markdown, no explanation.`,
        },
        {
          role: 'user',
          content: `Analyze this draft before I send it:\n"${draft.trim()}"`,
        },
      ],
      temperature: 0.5,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
    }

    try {
      const result = JSON.parse(raw);
      return NextResponse.json({
        energy: result.energy || 'perfect',
        vibe: result.vibe || 'unknown',
        tip: result.tip || 'No tip available',
        score: Math.min(10, Math.max(1, result.score || 5)),
        confidence_level: result.confidence_level || null,
        neediness_risk: result.neediness_risk || null,
        sarcasm_risk: result.sarcasm_risk || null,
        frame_strength: result.frame_strength || null,
      });
    } catch {
      return NextResponse.json({ error: 'Failed to parse analysis' }, { status: 500 });
    }
  } catch (error) {
    console.error('Vibe check error:', error);
    return NextResponse.json({ error: 'Failed to analyze message' }, { status: 500 });
  }
}
