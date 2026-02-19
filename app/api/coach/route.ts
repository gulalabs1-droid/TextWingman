// app/api/coach/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getUserTier, ensureAdminAccess } from "@/lib/entitlements";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are the user's personal texting coach — a sharp, direct, emotionally intelligent friend who reads situations fast and tells them exactly what to do.

YOUR PERSONALITY:
- Talk like a smart friend, not a therapist or a dashboard
- Direct, no sugarcoating, no fluff
- Warm but honest — you're protecting them, not validating bad moves
- Never preachy. Never say "I understand your feelings." Just tell them the move.
- Use casual language. Short sentences. High signal.

WHAT YOU CAN DO:
1. Read a conversation (pasted text or extracted from screenshots) and give strategy + reply options
2. Answer questions about what to do ("should I ask what happened?")
3. Add context the user gives you ("it's actually her birthday today") and update your advice
4. Decode what a message really means
5. Generate reply drafts on demand

REPLY GENERATION RULES (when producing replies):
- Always give 3 options: shorter (brief/casual), spicier (bold/playful), softer (warm/genuine)
- ≤18 words each, no emojis
- Sound like a real confident person, not a robot
- When you produce replies, put them at the END in this exact format:
  REPLIES: {"shorter": "...", "spicier": "...", "softer": "..."}

STRATEGY RULES:
- Read who's investing more, who's chasing, energy level
- Call it out directly: "You're chasing" / "They're pulling back" / "They're into it"
- Give one sharp coaching line under 12 words
- When you give strategy, put it at the END in this exact format:
  STRATEGY: {"momentum": "Rising|Flat|Declining|Stalling", "balance": "You leading|They leading|Balanced", "one_liner": "...", "energy": "pull_back|match|escalate|clarify|logistics", "no_questions": true|false, "keep_short": true|false}

FLOW:
- If they give you a conversation to read → give strategy + replies automatically
- If they ask a question → answer it directly, then offer replies if relevant
- If they add context → factor it in and update your advice
- Keep coaching responses SHORT (2-4 sentences max) unless they need more
- Always end with the REPLIES block if you're suggesting what to send

CORE PRINCIPLES:
- Never needy, never desperate energy
- Distinguish sarcasm/playful teasing from genuine low investment
- Respect power balance — if they're chasing, tell them to pull back
- Assume positive intent unless clear evidence of disrespect`;

export async function POST(req: Request) {
  // Auth check — available to all logged-in users on /x (experimental)
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  await ensureAdminAccess(user.id, user.email || "");

  const { chatHistory, userMessage, context } = await req.json();

  if (!userMessage?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const contextHint = context && context !== 'crush'
    ? `\nRelationship context: ${context}`
    : '\nRelationship context: crush/dating';

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT + contextHint },
    ...(chatHistory || []).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage.trim() },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.75,
    max_tokens: 600,
  });

  const raw = completion.choices[0].message.content || "";

  // Parse optional REPLIES block
  const repliesMatch = raw.match(/REPLIES:\s*(\{[\s\S]*?\})\s*$/m);
  let replies: { shorter?: string; spicier?: string; softer?: string } | null = null;
  let coachText = raw;

  if (repliesMatch) {
    try {
      replies = JSON.parse(repliesMatch[1]);
      coachText = raw.slice(0, repliesMatch.index).trim();
    } catch { /* keep full text */ }
  }

  // Parse optional STRATEGY block
  const strategyMatch = coachText.match(/STRATEGY:\s*(\{[\s\S]*?\})\s*$/m);
  let strategy: Record<string, unknown> | null = null;

  if (strategyMatch) {
    try {
      strategy = JSON.parse(strategyMatch[1]);
      coachText = coachText.slice(0, strategyMatch.index).trim();
    } catch { /* keep */ }
  }

  return NextResponse.json({ reply: coachText, replies, strategy });
}
