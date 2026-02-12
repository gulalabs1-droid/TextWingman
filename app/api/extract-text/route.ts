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
          content: `You are a text extraction assistant for a messaging reply app. The user will upload a screenshot of a text/DM conversation.

Your job:
1. Identify the LAST MESSAGE that was RECEIVED (not sent by the user).
   - In iMessage: received messages are typically gray/on the left side.
   - In WhatsApp: received messages are on the left.
   - In Instagram DMs: received messages are on the left.
   - In other apps: received messages are typically on the left or in a different color than sent messages.
2. Extract ONLY the text of that last received message.
3. If you can see multiple received messages, extract only the most recent one.
4. If the image is not a conversation screenshot, say so.

Return ONLY a JSON object:
{
  "extracted_text": "the last received message text here",
  "confidence": "high" | "medium" | "low",
  "platform": "imessage" | "whatsapp" | "instagram" | "tinder" | "snapchat" | "twitter" | "other" | "unknown",
  "error": null
}

If you cannot extract a message:
{
  "extracted_text": null,
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
              text: 'Extract the last received message from this conversation screenshot.',
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
      max_tokens: 500,
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

    if (parsed.error || !parsed.extracted_text) {
      return NextResponse.json(
        { 
          error: parsed.error || 'Could not find a message in this image',
          extracted_text: null,
          confidence: 'none',
          platform: parsed.platform || 'unknown',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      extracted_text: parsed.extracted_text,
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
