// app/api/strategy-chat/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getUserTier, ensureAdminAccess, hasPro } from "@/lib/entitlements";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  await ensureAdminAccess(user.id, user.email || "");
  const entitlement = await getUserTier(user.id, user.email || "");
  if (!hasPro(entitlement.tier)) {
    return NextResponse.json({ error: "Strategy Chat requires Pro" }, { status: 403 });
  }

  const { threadContext, strategy, context, chatHistory, userMessage } = await req.json();

  if (!userMessage?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // ─── Build an adaptive system prompt ───
  const hasThread = threadContext && threadContext.trim().length > 0;

  const strategyBlock = strategy
    ? `\nCURRENT STRATEGY ANALYSIS:
- Momentum: ${strategy.momentum}
- Balance: ${strategy.balance}
- Recommended move: ${strategy.move.energy.replace("_", " ")}
- Coach says: "${strategy.move.one_liner}"
- Constraints: ${[
        strategy.move.constraints.no_questions ? "no questions" : null,
        strategy.move.constraints.keep_short ? "keep short" : null,
        strategy.move.constraints.add_tease ? "add tease" : null,
        strategy.move.constraints.push_meetup ? "push meetup" : null,
      ]
        .filter(Boolean)
        .join(", ") || "none"}
- Risk level: ${strategy.move.risk}\n`
    : "";

  const threadBlock = hasThread
    ? `\nTHEIR CONVERSATION THREAD (messages they're asking about):\n${threadContext}\n`
    : "";

  const systemPrompt = `You are the user's personal texting coach — a sharp, emotionally intelligent friend who reads situations fast and tells them exactly what to do.

PERSONALITY:
- Talk like a smart friend, not a therapist or a chatbot
- Direct, no sugarcoating, no fluff, no therapy-speak
- Warm but honest — protect them, don't validate bad moves
- Never preachy. Never say "I understand your feelings." Just tell them the move.
- Use casual language. Short sentences. High signal.
- NEVER give generic advice like "keep it engaging" or "ask a follow-up question" — be SPECIFIC

RELATIONSHIP CONTEXT: ${context || "crush/dating"}
${threadBlock}${strategyBlock}
WHAT YOU CAN DO:
1. Read a conversation (pasted text or extracted from screenshots) and give sharp strategy + reply options
2. Answer questions about what to say or do — with SPECIFIC words, not vague tips
3. Factor in new context the user adds and update your advice
4. Decode what a message really means
5. Generate reply drafts on demand
6. Coach them through multi-message conversations — remember EVERYTHING said so far in this chat

CRITICAL RULES FOR CONVERSATION TRACKING:
- This is a CONTINUOUS coaching session. The user may share messages they received, tell you what they said, ask follow-ups, add context, or change direction.
- ALWAYS pay close attention to the chat history. If the user said "she texted me 'hey'" three messages ago and now asks "what should I say?", you KNOW what message they're replying to.
- If the user types something like "hello" or "good and u" — that is likely a message they RECEIVED from the other person. Treat it as context about their conversation, not a greeting to you.
- If the user says "ok say that" or "I'll use that one" after you suggest replies — acknowledge it and ask what happened next or offer the next move.
- Track the evolving conversation: user shares what they received → you coach → user tells you what they sent → you coach the next move.

REPLY GENERATION RULES:
- 3 options: shorter (brief/casual), spicier (bold/playful), softer (warm/genuine)
- ≤18 words each, no emojis, lowercase, sound like a real person
- When you produce replies, put them at the END in this exact format:
  DRAFT: {"shorter": "...", "spicier": "...", "softer": "..."}
- Only include DRAFT when you're suggesting reply options they could send. Don't include it for pure coaching.
- If the user shares a message and it clearly needs a reply, ALWAYS include a DRAFT.

STRATEGY RULES (when you have enough context):
- Read who's investing more, who's chasing, energy level
- Call it out directly: "You're chasing" / "They're pulling back" / "They're into it"
- Give one sharp coaching line

FLOW:
- If they give you a conversation/message → give your read + DRAFT automatically
- If they ask a question → answer SPECIFICALLY, offer DRAFT if relevant
- If they add context → factor it in, update advice
- If they say "ok say that" / "I sent that" → acknowledge, ask what happened next
- Keep responses punchy (2-5 sentences) unless they need a deeper breakdown`;

  // Build messages array from chat history
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...(chatHistory || []).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage.trim() },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.75,
    max_tokens: 800,
  });

  const raw = completion.choices[0].message.content || "";

  // Parse out optional DRAFT block
  const draftMatch = raw.match(/DRAFT:\s*(\{[\s\S]*?\})\s*$/);
  let draft: { shorter?: string; spicier?: string; softer?: string } | null = null;
  let coachReply = raw;

  if (draftMatch) {
    try {
      draft = JSON.parse(draftMatch[1]);
      coachReply = raw.slice(0, draftMatch.index).trim();
    } catch {
      // ignore parse error, return full text
    }
  }

  return NextResponse.json({ reply: coachReply, draft });
}
