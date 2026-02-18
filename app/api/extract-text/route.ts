import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Max image size: 4MB (base64 encoded)
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Validate base64 image format
    const base64Match = image.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,/);
    if (!base64Match) {
      return NextResponse.json(
        { error: 'Invalid image format. Please upload a PNG, JPEG, or WebP image.' },
        { status: 400 }
      );
    }

    // Check size (rough estimate from base64 length)
    const base64Data = image.split(',')[1];
    if (base64Data && base64Data.length > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'Image is too large. Please upload an image under 4MB.' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a conversation extraction assistant for a messaging reply app. The user will upload a screenshot of a text/DM conversation.

Your job:
1. Extract the FULL conversation visible in the screenshot — EVERY SINGLE MESSAGE you can read, from the very top to the very bottom. Do NOT skip any messages. Even if a message at the top is partially cut off, include what you can read with "[partial]" at the start.
2. Identify which messages were SENT by the user and which were RECEIVED from the other person.

PLATFORM-SPECIFIC SENDER IDENTIFICATION:
   - In iMessage: SENT = blue or green bubbles aligned to the RIGHT side. RECEIVED = gray bubbles aligned to the LEFT side.
   - In WhatsApp: SENT = green/right. RECEIVED = white/left.
   - In Instagram DMs: SENT = blue/purple/right. RECEIVED = gray/left.
   - In Tinder/Bumble/Hinge: SENT = right side. RECEIVED = left side.
   - In Facebook Dating: SENT = blue/purple RIGHT side. RECEIVED = gray LEFT side. Ignore photos, match guide prompts, safety tips, date headers.
   - In Facebook Messenger: SENT = blue/purple right. RECEIVED = gray left.
   - In Snapchat: SENT = right (blue/red). RECEIVED = left (gray).
   - In other apps: SENT = right side. RECEIVED = left side or different color.

3. Identify the LAST message that was RECEIVED (the one the user needs to reply to).
4. If the image is not a conversation screenshot, say so.

CRITICAL — SENDER ACCURACY:
- Look at the HORIZONTAL POSITION and COLOR of each bubble individually.
- RIGHT-aligned or colored (blue/green/purple) = "You:" (user SENT this)
- LEFT-aligned or gray = "Them:" (user RECEIVED this)
- Do NOT assume alternating speakers. Two consecutive messages can be from the same person.
- DOUBLE-CHECK every single message's alignment before assigning You: or Them:.

CRITICAL — COMPLETENESS:
- Extract EVERY message visible in the screenshot, starting from the very top.
- If a message is partially cut off at the top of the screen, include what you can read: "[partial] ...visible text here"
- Count your messages. If the conversation looks long, make sure you have them ALL.
- Do NOT summarize or skip "less important" messages. Every message matters.

OTHER RULES:
- ONLY extract actual chat messages. Skip date/time headers, system messages, prompts, safety warnings, UI elements, and notification badges.
- Keep the EXACT wording from the screenshot. Do not paraphrase or clean up slang/abbreviations.
- If you see timestamps between messages (e.g., "Dec 8 at 11:00 AM"), include them as a note in parentheses after the message like: "You: cooolin and u (Dec 8)"

Format the full conversation as a readable thread using "Them:" and "You:" prefixes, one message per line.

Return ONLY a JSON object:
{
  "full_conversation": "You: first message\\nThem: their reply\\nYou: your next message\\nThem: latest message you need to reply to",
  "last_received": "the last received message text only",
  "message_count": 5,
  "confidence": "high" | "medium" | "low",
  "platform": "imessage" | "whatsapp" | "instagram" | "tinder" | "snapchat" | "twitter" | "facebook-dating" | "messenger" | "other" | "unknown",
  "error": null
}

If you cannot extract messages:
{
  "full_conversation": null,
  "last_received": null,
  "message_count": 0,
  "confidence": "none",
  "platform": "unknown",
  "error": "Brief explanation of why extraction failed"
}`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract the full conversation from this screenshot.',
            },
            {
              type: 'image_url',
              image_url: {
                url: image,
                detail: 'high',
              },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json(
        { error: 'Failed to process image' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(responseText);

    if (parsed.error || (!parsed.full_conversation && !parsed.last_received)) {
      return NextResponse.json(
        { 
          error: parsed.error || 'Could not find messages in this image',
          full_conversation: null,
          last_received: null,
          extracted_text: null,
          message_count: 0,
          confidence: 'none',
          platform: parsed.platform || 'unknown',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      full_conversation: parsed.full_conversation || null,
      last_received: parsed.last_received || null,
      extracted_text: parsed.full_conversation || parsed.last_received || null,
      message_count: parsed.message_count || 1,
      confidence: parsed.confidence || 'medium',
      platform: parsed.platform || 'unknown',
      error: null,
    });

  } catch (error) {
    console.error('Extract text error:', error);
    return NextResponse.json(
      { error: 'Failed to process the screenshot. Please try again.' },
      { status: 500 }
    );
  }
}
