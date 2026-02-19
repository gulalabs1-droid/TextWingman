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

  // Build the system prompt with full thread + strategy context baked in
  const strategyBlock = strategy
    ? `CURRENT STRATEGY ANALYSIS:
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
- Risk level: ${strategy.move.risk}`
    : "";

  const systemPrompt = `You are the user's sharp, direct texting coach — like a smart friend reading over their shoulder. You have full context of their conversation and the AI strategy analysis.

RELATIONSHIP CONTEXT: ${context || "crush/dating"}

THEIR CONVERSATION THREAD:
${threadContext || "No thread provided"}

${strategyBlock}

YOUR JOB:
- Answer their questions directly and honestly about what to do or say
- If they share new context (e.g. "it's actually her birthday today", "we were supposed to hang but she cancelled"), factor that in and update your advice
- If they ask "should I say X?" — give a clear yes/no + why, then suggest how to phrase it if yes
- If they want a draft, produce one. Keep it ≤18 words, no emojis, confident tone
- When you produce a draft reply they could send, wrap it in a JSON block at the END of your response like this:
  DRAFT: {"shorter": "...", "spicier": "...", "softer": "..."}
  Only include DRAFT if you're actually suggesting new reply options. Don't include it for pure coaching answers.
- Be a sharp friend: direct, no sugarcoating, no therapy speak, no "attachment styles"
- Under 3 sentences for coaching answers unless they need more context
- Never be preachy. Never say "I understand your feelings." Just tell them the move.`;

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
    model: "gpt-4o-mini",
    messages,
    temperature: 0.7,
    max_tokens: 400,
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
