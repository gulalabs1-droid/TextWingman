import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message || typeof message !== 'string' || message.trim().length < 2) {
      return NextResponse.json(
        { error: 'A message is required' },
        { status: 400 }
      );
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
