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
1. Extract the FULL conversation visible in the screenshot — every message you can read, in order from oldest (top) to newest (bottom).
2. Identify which messages were SENT by the user and which were RECEIVED from the other person.
   - In iMessage: sent messages are blue/green bubbles on the right, received are gray on the left.
   - In WhatsApp: sent messages are green/right, received are white/left.
   - In Instagram DMs: sent messages are blue/right, received are gray/left.
   - In Tinder/Bumble/Hinge: sent messages are typically on the right, received on the left.
   - In other apps: sent messages are typically on the right, received on the left or a different color.
3. Identify the LAST message that was RECEIVED (the one the user needs to reply to).
4. If the image is not a conversation screenshot, say so.

Format the full conversation as a readable thread using "Them:" and "You:" prefixes, one message per line. Keep the exact wording from the screenshot.

Return ONLY a JSON object:
{
  "full_conversation": "Them: first message\\nYou: your reply\\nThem: their next message\\nYou: your reply\\nThem: latest message they need to reply to",
  "last_received": "the last received message text only",
  "message_count": 5,
  "confidence": "high" | "medium" | "low",
  "platform": "imessage" | "whatsapp" | "instagram" | "tinder" | "snapchat" | "twitter" | "other" | "unknown",
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
