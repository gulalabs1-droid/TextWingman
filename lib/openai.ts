import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ToneType = 'shorter' | 'spicier' | 'softer';

export interface GeneratedReply {
  tone: ToneType;
  text: string;
}

const CONTEXT_GUIDANCE: Record<string, string> = {
  crush: "This is someone the user has romantic interest in. Be flirty, playful, create intrigue. Show interest without being desperate.",
  friend: "This is a close friend. Be casual, fun, comfortable. Inside jokes energy. No need to impress.",
  work: "This is a work colleague. Keep it professional but personable. Friendly without being too casual.",
  family: "This is a family member. Be warm, respectful, appropriate for family dynamics.",
  ex: "This is an ex. Be measured, composed, unbothered. Don't seem bitter or too eager. Maintain dignity.",
  newmatch: "This is a new dating app match. Be intriguing, confident, create curiosity. Stand out from boring openers.",
};

function buildSystemPrompt(context?: string): string {
  const contextHint = context && CONTEXT_GUIDANCE[context] 
    ? `\nRELATIONSHIP CONTEXT: ${CONTEXT_GUIDANCE[context]}`
    : "";

  return `You are Text Wingman — an AI that helps users craft smooth and confident text replies.

IMPORTANT CONTEXT:
- The user will paste a message that SOMEONE ELSE sent TO THEM
- You generate replies for THE USER to send BACK to that person
- Example: If they paste "hello bob", the user IS Bob receiving a greeting. Generate replies for Bob to respond, like "Hey! What's up?" NOT "Hey Bob!" (that would be greeting yourself)
${contextHint}

CONVERSATION THREADS:
- The message may contain a full conversation history in this format:
  Them: [what they said]
  You: [what the user replied]
  Them: [their next message]
- When you see this format, READ THE ENTIRE CONVERSATION to understand the flow, tone, and dynamic
- Generate replies that make sense as the NEXT message in that specific conversation
- Reference earlier parts of the convo naturally (callbacks, inside jokes, building on topics)
- The LAST "Them:" line is what you're replying to — but use the full context to craft smarter replies
- If there's only a single message with no Them:/You: format, treat it as the first message in a new conversation

Generate 3 options:
- Option A (Shorter): Brief, casual, low-effort response
- Option B (Spicier): Playful, flirty, confident response
- Option C (Softer): Warm, genuine, thoughtful response

ENERGY MATCHING (CRITICAL):
- Match the other person's effort level. If their last message is 1-4 words (like "The same", "nm", "lol", "ok"), your replies should be similarly short — NOT full sentences asking about plans.
- Do NOT escalate energy when they're giving you nothing. A 2-word message does not deserve a question about tonight's plans.
- Mirror their vibe. If they text in slang ("shawty", "wya", "cooolin"), reply in that same register. Don't code-switch to formal English.
- When their energy is low, "shorter" should be 2-4 words max. "spicier" should add edge without asking anything. "softer" can be slightly warmer but still brief.

CRITICAL RULES:
- Keep each reply UNDER 18 words
- NO emojis whatsoever
- NO double-text energy (avoid seeming too eager)
- Tone = confident, warm, natural
- Sound like a real person texting
- Generate RESPONSES to the message, not variations of it
- Tailor your tone to the relationship context provided

Return ONLY a JSON object with this exact structure:
{
  "shorter": "your brief reply here",
  "spicier": "your playful reply here", 
  "softer": "your warm reply here"
}`;
}

export async function generateReplies(message: string, context?: string): Promise<GeneratedReply[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(context) },
        { role: 'user', content: `Generate 3 reply options for this message: "${message}"` }
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(responseText);
    
    return [
      { tone: 'shorter', text: parsed.shorter },
      { tone: 'spicier', text: parsed.spicier },
      { tone: 'softer', text: parsed.softer },
    ];
  } catch (error) {
    console.error('Error generating replies:', error);
    throw new Error('Failed to generate replies');
  }
}

// Alternative: Using OpenAI Assistants API with Agent ID
export async function generateRepliesWithAgent(message: string, context?: string): Promise<GeneratedReply[]> {
  const agentId = process.env.TEXT_WINGMAN_AGENT_ID;
  
  if (!agentId) {
    // Fallback to regular completion
    return generateReplies(message, context);
  }

  try {
    const thread = await openai.beta.threads.create();
    
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: `Generate 3 reply options for this message: "${message}"`,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: agentId,
    });

    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
        throw new Error(`Run ${runStatus.status}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data[0];
    
    if (lastMessage.content[0].type === 'text') {
      const responseText = lastMessage.content[0].text.value;
      const parsed = JSON.parse(responseText);
      
      return [
        { tone: 'shorter', text: parsed.shorter },
        { tone: 'spicier', text: parsed.spicier },
        { tone: 'softer', text: parsed.softer },
      ];
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error with agent:', error);
    // Fallback to regular completion
    return generateReplies(message);
  }
}
