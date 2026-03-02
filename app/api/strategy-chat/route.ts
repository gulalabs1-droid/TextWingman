// app/api/strategy-chat/route.ts
export const runtime = "nodejs";
export const maxDuration = 30;

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getUserTier, ensureAdminAccess, hasPro } from "@/lib/entitlements";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Option 2: Context Extraction Agent ──────────────────
interface ContextExtraction {
  her_tone: string;
  topic: string;
  open_questions: string[];
  must_acknowledge: string[];
}

async function extractContext(
  threadText: string,
  relationshipContext: string
): Promise<ContextExtraction | null> {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a conversation context extractor. Analyze the thread and return ONLY valid JSON:
{
  "her_tone": "warm" | "neutral" | "cold" | "flirty" | "serious" | "stressed" | "playful" | "dry",
  "topic": "logistics" | "flirting" | "conflict" | "safety" | "smalltalk" | "catching_up" | "planning" | "emotional",
  "open_questions": ["unanswered questions from either side"],
  "must_acknowledge": ["things that CANNOT be ignored — compliments, vulnerable moments, direct questions, plans proposed"]
}
Rules:
- her_tone = the OTHER person's tone in their last 2-3 messages
- open_questions = things asked but not yet answered
- must_acknowledge = if they said something vulnerable, asked a direct question, or proposed plans — MUST address it`,
        },
        {
          role: "user",
          content: `THREAD:\n${threadText}\nRELATIONSHIP: ${relationshipContext}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });
    return JSON.parse(res.choices[0].message.content || "null");
  } catch {
    return null;
  }
}

// ── Option 1: RuleAgent Verification ────────────────────
async function verifyDrafts(
  drafts: { shorter?: string; spicier?: string; softer?: string },
  strategyContext: string
): Promise<{ shorter?: string; spicier?: string; softer?: string }> {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a strict reply verifier. Check each draft against ALL rules. If a draft violates any rule, rewrite it minimally to pass while keeping the original tone and intent.

Hard Rules (fail if broken):
1. Word count ≤18 (count carefully)
2. No emojis (none at all)
3. No needy language ("please", "sorry", "i miss you", "why you not", "can you", "would you", "just checking", "hope you", "I was wondering")
4. No double questions (only one ? allowed per draft)
5. No dead-end phrases ("lol", "idk", "maybe", "we'll see", "same", "ok" alone) unless strategy says playful/sarcasm
6. Must invite continuation or hold frame
7. Must match strategy energy (pull_back = not eager, escalate = not withdrawn, keep_short = shorter should be 2-4 words)
8. Must sound like a real person, not a chatbot
9. If the other person shared something specific, at least one draft must reference it

Return ONLY valid JSON:
{"shorter": "verified or fixed text", "spicier": "verified or fixed text", "softer": "verified or fixed text"}

If a draft already passes all rules, return it unchanged.`,
        },
        {
          role: "user",
          content: `${strategyContext}\nDRAFTS: ${JSON.stringify(drafts)}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(res.choices[0].message.content || "{}");
    // Only use verified versions if they have content
    return {
      shorter: parsed.shorter || drafts.shorter,
      spicier: parsed.spicier || drafts.spicier,
      softer: parsed.softer || drafts.softer,
    };
  } catch {
    return drafts; // Fail open — return originals if verification crashes
  }
}

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
  const isPro = hasPro(entitlement.tier);

  const { threadContext, strategy, context, chatHistory, userMessage } = await req.json();

  if (!userMessage?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // ─── Context extraction (Option 2) — Pro only, runs in parallel when thread exists ───
  const hasThread = threadContext && threadContext.trim().length > 0;
  let contextData: ContextExtraction | null = null;
  const contextPromise = hasThread && isPro
    ? extractContext(threadContext, context || "crush")
    : Promise.resolve(null);

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

  // Await context extraction (started above, runs while we build the prompt)
  contextData = await contextPromise;

  const contextBlock = contextData
    ? `\nCONTEXT EXTRACTION (from dedicated analyzer):
- Their tone: ${contextData.her_tone}
- Topic: ${contextData.topic}
- Open questions: ${contextData.open_questions?.join(", ") || "none"}
- MUST ACKNOWLEDGE (do NOT ignore these): ${contextData.must_acknowledge?.join(", ") || "none"}\n`
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
${threadBlock}${strategyBlock}${contextBlock}
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

DRAFT QUALITY RULES (V2 — follow these EXACTLY for every draft):
- ZERO needy language: never "please", "sorry", "i miss you", "why you not", "can you", "would you", "just checking", "hope you", "I was wondering"
- No double questions — only one ? per draft max
- No dead-end phrases: "lol", "idk", "maybe", "we'll see", "same", "ok" alone are garbage — unless strategy says playful/sarcasm
- Every draft MUST invite continuation or hold frame — open a door or make a confident statement
- ENERGY MATCHING: match their effort. If their last message is 1-4 words and they didn't ask anything, keep it SHORT (2-5 words). If they shared something real, engage with it.
- Mirror their vibe: if they text in slang, reply in slang. Don't code-switch to formal.
- SHORT ≠ BORING: even 2-4 word replies need personality. "bet", "you earned it", "don't have too much fun" > "ok sounds good", "that's cool", "same"
- CONTENT ENGAGEMENT: when they share something specific, reference THAT thing. No generic responses. Show you were listening.
- SUBTEXT: read between the lines. Stretched words ("wateveerr", "suuure") = playful, not rejection. Dismissive after vulnerability = deflection. Reply to what they FEEL, not the literal words.
- If strategy says pull_back → drafts should NOT be eager. If escalate → don't be withdrawn. If keep_short → shorter draft should be 2-4 words MAX.

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
    max_tokens: 1000,
  });

  const raw = completion.choices[0].message.content || "";

  // Parse out optional DRAFT block
  const draftMatch = raw.match(/DRAFT:\s*(\{[\s\S]*?\})\s*$/);
  let draft: { shorter?: string; spicier?: string; softer?: string } | null = null;
  let coachReply = raw;
  let verified = false;

  if (draftMatch) {
    try {
      draft = JSON.parse(draftMatch[1]);
      coachReply = raw.slice(0, draftMatch.index).trim();

      // ── Option 1: RuleAgent verification on drafts ──
      if (isPro && draft && (draft.shorter || draft.spicier || draft.softer)) {
        const strategyCtx = strategy
          ? `STRATEGY: ${JSON.stringify({
              momentum: strategy.momentum,
              balance: strategy.balance,
              energy: strategy.move?.energy,
              sarcasm_detected: strategy.sarcasm_detected,
              is_kidding: strategy.is_kidding,
              constraints: strategy.move?.constraints,
            })}`
          : "STRATEGY: none provided";
        draft = await verifyDrafts(draft, strategyCtx);
        verified = true;
      }
    } catch {
      // ignore parse error, return full text
    }
  }

  return NextResponse.json({
    reply: coachReply,
    draft,
    verified,
    context_extraction: contextData,
  });
}
