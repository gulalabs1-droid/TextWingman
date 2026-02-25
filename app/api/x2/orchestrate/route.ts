// app/api/x2/orchestrate/route.ts
// "Text God" orchestrator — multi-agent pipeline with verification
export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getUserTier, ensureAdminAccess, hasPro } from "@/lib/entitlements";
import {
  analyzeStrategy,
  formatStrategyForDraft,
  SAFE_DEFAULT,
  type StrategyResult,
  type ThreadMetrics,
} from "@/lib/strategy";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ── Types ────────────────────────────────────────────────
type Goal = "set_date" | "tease" | "recover" | "support" | "de_escalate" | "general";

interface ContextExtraction {
  her_tone: string;
  topic: string;
  open_questions: string[];
  must_acknowledge: string[];
  goal_detected: string;
}

interface Candidate {
  text: string;
  style: string;
  word_count: number;
  scores: {
    neediness_risk: number;
    clarity: number;
    forward_motion: number;
    tone_match: number;
    one_breath: boolean;
  };
  notes: string;
}

interface CriticResult {
  candidates: Candidate[];
  winner_id: number;
  backup_id: number;
  winner_reason: string;
}

// ── Step 0: OpenAI Moderation ────────────────────────────
async function moderateInput(text: string): Promise<{
  flagged: boolean;
  categories: Record<string, boolean> | null;
}> {
  try {
    const res = await openai.moderations.create({ input: text });
    const result = res.results[0];
    return {
      flagged: result.flagged,
      categories: result.flagged ? (result.categories as unknown as Record<string, boolean>) : null,
    };
  } catch {
    return { flagged: false, categories: null };
  }
}

// ── Step 1: Context Extractor Agent ──────────────────────
async function extractContext(
  threadText: string,
  goal: Goal,
  relationshipContext: string
): Promise<ContextExtraction> {
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a conversation context extractor. Analyze the conversation thread and extract structured context.

Return ONLY valid JSON with these exact keys:
{
  "her_tone": "warm" | "neutral" | "cold" | "flirty" | "serious" | "stressed" | "playful" | "dry",
  "topic": "logistics" | "flirting" | "conflict" | "safety" | "smalltalk" | "catching_up" | "planning" | "emotional",
  "open_questions": ["list of unanswered questions from either side"],
  "must_acknowledge": ["things that CANNOT be ignored in the next reply — compliments, vulnerable moments, direct questions, plans proposed"],
  "goal_detected": "set_date" | "tease" | "recover" | "support" | "de_escalate" | "general"
}

Rules:
- her_tone = the OTHER person's tone in their last 2-3 messages
- open_questions = things asked but not yet answered
- must_acknowledge = if they said something vulnerable, asked a direct question, or proposed plans — you MUST address it
- goal_detected = what the user is probably trying to do based on the conversation flow (override with user's explicit goal if provided)`,
      },
      {
        role: "user",
        content: `THREAD:\n${threadText}\n\nUSER'S GOAL: ${goal}\nRELATIONSHIP: ${relationshipContext}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 400,
    response_format: { type: "json_object" },
  });

  try {
    return JSON.parse(res.choices[0].message.content || "{}");
  } catch {
    return {
      her_tone: "neutral",
      topic: "general" as any,
      open_questions: [],
      must_acknowledge: [],
      goal_detected: goal,
    };
  }
}

// ── Step 3: Copy Generator Agent (4-6 candidates) ───────
async function generateCandidates(
  threadText: string,
  context: ContextExtraction,
  strategy: StrategyResult,
  metrics: ThreadMetrics | undefined,
  goal: Goal,
  relationshipContext: string,
  chatHistory: { role: string; content: string }[]
): Promise<{ text: string; style: string }[]> {
  const strategyHint = formatStrategyForDraft(strategy, metrics);

  const historyBlock =
    chatHistory.length > 0
      ? `\nPREVIOUS COACHING CHAT (for continuity):\n${chatHistory
          .map((m) => `${m.role === "user" ? "User" : "Coach"}: ${m.content}`)
          .join("\n")}\n`
      : "";

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an elite texting copy generator. Generate exactly 6 reply candidates in different styles.

STYLES (generate one of each):
1. "hood_charisma" — smooth, confident, street-smart. Slang is fine. Swagger without trying too hard.
2. "clean_direct" — clear, confident, no games. Says what needs to be said. Gentleman energy.
3. "playful_tease" — lighthearted, flirty, fun. Teases without being mean. Creates tension.
4. "bold_closer" — moves things forward. Pushes for plans, escalates. Confident ask.
5. "warm_genuine" — honest, real, emotionally intelligent. Shows you care without being soft.
6. "chill_unbothered" — low effort on purpose. Cool, not chasing. Less is more.

RULES:
- Each reply ≤18 words. No emojis. Lowercase preferred.
- Sound like a REAL person, not a chatbot.
- Each reply MUST address what they actually said (reference their words/topic).
- Follow the STRATEGY constraints exactly.
- If must_acknowledge items exist, at least 4 of 6 candidates should address them.
- Match their energy level. If they're giving 3 words, don't give 15.

${strategyHint}

CONTEXT EXTRACTION:
- Her tone: ${context.her_tone}
- Topic: ${context.topic}
- Open questions: ${context.open_questions.join(", ") || "none"}
- Must acknowledge: ${context.must_acknowledge.join(", ") || "none"}
- Goal: ${goal}
- Relationship: ${relationshipContext}

Return ONLY valid JSON object with a "candidates" key:
{"candidates": [{"text": "...", "style": "hood_charisma"}, {"text": "...", "style": "clean_direct"}, {"text": "...", "style": "playful_tease"}, {"text": "...", "style": "bold_closer"}, {"text": "...", "style": "warm_genuine"}, {"text": "...", "style": "chill_unbothered"}]}`,
      },
      {
        role: "user",
        content: `${historyBlock}THREAD:\n${threadText}`,
      },
    ],
    temperature: 0.85,
    max_tokens: 1200,
    response_format: { type: "json_object" },
  });

  try {
    const raw = res.choices[0].message.content || "{}";
    const parsed = JSON.parse(raw);
    // Handle any key name: find the first array value in the object
    if (Array.isArray(parsed)) return parsed;
    const arrKey = Object.keys(parsed).find((k) => Array.isArray(parsed[k]));
    if (arrKey && parsed[arrKey].length > 0) return parsed[arrKey];
    console.error("generateCandidates: no array found in response:", raw.slice(0, 300));
    return [];
  } catch (e) {
    console.error("generateCandidates parse error:", e, res.choices[0].message.content?.slice(0, 300));
    return [];
  }
}

// ── Step 4: Critic / Scorer / Selector Agent ─────────────
async function criticAndSelect(
  candidates: { text: string; style: string }[],
  threadText: string,
  context: ContextExtraction,
  strategy: StrategyResult,
  goal: Goal
): Promise<CriticResult> {
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an elite texting critic. Score each candidate reply and pick the winner.

SCORING (0-100 for each):
- neediness_risk: 0 = zero neediness, 100 = extremely needy. LOWER IS BETTER.
- clarity: does the reply clearly communicate one idea? 100 = crystal clear.
- forward_motion: does it move the conversation forward or create a response opportunity? 100 = strong forward motion.
- tone_match: does it match the intended style AND the conversation vibe? 100 = perfect match.
- one_breath: can you read it in one breath? true/false.

SELECTION CRITERIA (ranked):
1. Low neediness_risk (< 20 ideal)
2. High clarity (> 80)
3. High forward_motion (> 70)
4. Addresses must_acknowledge items
5. Follows strategy constraints
6. Sounds like something a real confident person would actually text

FACT-RISK CHECK:
- If any candidate claims a specific fact (weather, schedules, legal info, scores), flag it.
- Hedge uncertain facts: "from what I saw...", "sounds like...", or ask to confirm.

CONTEXT:
- Her tone: ${context.her_tone}
- Must acknowledge: ${context.must_acknowledge.join(", ") || "none"}
- Strategy energy: ${strategy.move.energy}
- Strategy one-liner: "${strategy.move.one_liner}"
- Goal: ${goal}

Return ONLY valid JSON:
{
  "candidates": [
    {
      "text": "exact text from input",
      "style": "style name",
      "word_count": number,
      "scores": {
        "neediness_risk": 0-100,
        "clarity": 0-100,
        "forward_motion": 0-100,
        "tone_match": 0-100,
        "one_breath": true/false
      },
      "notes": "brief note on strengths/weaknesses"
    }
  ],
  "winner_id": 0,
  "backup_id": 1,
  "winner_reason": "why this one wins in 1-2 sentences"
}`,
      },
      {
        role: "user",
        content: `THREAD:\n${threadText}\n\nCANDIDATES:\n${JSON.stringify(candidates, null, 2)}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1500,
    response_format: { type: "json_object" },
  });

  try {
    const parsed = JSON.parse(res.choices[0].message.content || "{}");
    // Ensure candidates array exists — model might use a different key
    if (!parsed.candidates && !Array.isArray(parsed)) {
      const arrKey = Object.keys(parsed).find((k) => Array.isArray(parsed[k]));
      if (arrKey) parsed.candidates = parsed[arrKey];
    }
    return parsed;
  } catch (e) {
    console.error("criticAndSelect parse error:", e);
    return {
      candidates: candidates.map((c) => ({
        ...c,
        word_count: c.text.split(" ").length,
        scores: { neediness_risk: 50, clarity: 50, forward_motion: 50, tone_match: 50, one_breath: true },
        notes: "Scoring failed",
      })),
      winner_id: 0,
      backup_id: 1,
      winner_reason: "Default selection — scoring failed",
    };
  }
}

// ── Coaching wrapper (for non-thread messages) ───────────
async function coachResponse(
  userMessage: string,
  chatHistory: { role: string; content: string }[],
  goal: Goal,
  relationshipContext: string,
  threadText?: string
): Promise<{ reply: string; draft: any }> {
  const threadBlock = threadText
    ? `\nTHEIR CONVERSATION THREAD (from screenshot — this is the conversation the user is asking about):\n${threadText}\n\nYou MUST base all advice and replies on THIS conversation. The user's follow-up messages are about THIS thread.\n`
    : "";

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are the user's personal texting coach — a sharp, emotionally intelligent friend who reads situations fast and tells them exactly what to do.

PERSONALITY:
- Talk like a smart friend, not a therapist or a chatbot
- Direct, no sugarcoating, no fluff, no therapy-speak
- Warm but honest — protect them, don't validate bad moves
- Never preachy. Never say "I understand your feelings." Just tell them the move.
- Use casual language. Short sentences. High signal.
- NEVER give generic advice like "keep it engaging" — be SPECIFIC

RELATIONSHIP CONTEXT: ${relationshipContext || "crush/dating"}
GOAL: ${goal}
${threadBlock}
CRITICAL RULES FOR CONVERSATION TRACKING:
- This is a CONTINUOUS coaching session.
- If a conversation thread was provided above, ALL your advice and draft replies MUST be based on that specific conversation. Do NOT make up new scenarios.
- If the user types something like "hello" or "good and u" — that's a message they RECEIVED. Treat it as context, not a greeting to you.
- If the user says "ok say that" or "I'll use that one" — acknowledge it and ask what happened next.
- Track the evolving conversation: user shares what they received → you coach → user tells you what they sent → you coach the next move.

When you want to suggest reply options, put them at the END:
DRAFT: {"shorter": "...", "spicier": "...", "softer": "..."}

Keep responses punchy (2-5 sentences) unless they need more.`,
      },
      ...chatHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: userMessage },
    ],
    temperature: 0.75,
    max_tokens: 800,
  });

  const raw = res.choices[0].message.content || "";
  const draftMatch = raw.match(/DRAFT:\s*(\{[\s\S]*?\})\s*$/);
  let draft = null;
  let reply = raw;

  if (draftMatch) {
    try {
      draft = JSON.parse(draftMatch[1]);
      reply = raw.slice(0, draftMatch.index).trim();
    } catch {}
  }

  return { reply, draft };
}

// ── Main Handler ─────────────────────────────────────────
export async function POST(req: Request) {
  const startTime = Date.now();

  // Auth
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
    return NextResponse.json({ error: "X2 requires Pro access" }, { status: 403 });
  }

  const {
    threadText,
    userMessage,
    chatHistory = [],
    goal = "general" as Goal,
    relationshipContext = "crush",
    mode = "chat", // "chat" (coaching) or "orchestrate" (full pipeline on a thread)
  } = await req.json();

  if (!userMessage?.trim() && !threadText?.trim()) {
    return NextResponse.json({ error: "Message or thread required" }, { status: 400 });
  }

  const effectiveText = threadText?.trim() || userMessage?.trim() || "";

  // ── Step 0: Moderation ──────────────────────────────────
  const modResult = await moderateInput(effectiveText);
  if (modResult.flagged) {
    return NextResponse.json({
      reply: "I can't help with that kind of message. Let's keep it positive — what else you got?",
      flagged: true,
      moderation_categories: modResult.categories,
    });
  }

  // ── Determine mode ──────────────────────────────────────
  // If there's a conversation thread (multi-line You:/Them: format), run full pipeline
  // Otherwise, run coaching mode
  const hasThread =
    effectiveText.includes("You:") && effectiveText.includes("Them:");
  const shouldOrchestrate = mode === "orchestrate" || hasThread;

  if (!shouldOrchestrate) {
    // Coaching mode — pass threadText so follow-ups have screenshot context
    const { reply, draft } = await coachResponse(
      userMessage,
      chatHistory,
      goal,
      relationshipContext,
      threadText?.trim() || undefined
    );
    return NextResponse.json({
      mode: "coach",
      reply,
      draft,
      latencyMs: Date.now() - startTime,
    });
  }

  // ── Full Orchestration Pipeline ─────────────────────────
  try {
    // Steps 1+2: Context Extraction & Strategy Analysis (parallelized — they're independent)
    const parallelStart = Date.now();
    const [contextExtraction, strategyResult] = await Promise.all([
      extractContext(effectiveText, goal, relationshipContext),
      analyzeStrategy(effectiveText, relationshipContext),
    ]);
    const { strategy, metrics } = strategyResult;
    const strategyLatency = Date.now() - parallelStart;

    // Step 3: Generate 6 candidates (with retry)
    const genStart = Date.now();
    let rawCandidates = await generateCandidates(
      effectiveText,
      contextExtraction,
      strategy,
      metrics,
      goal,
      relationshipContext,
      chatHistory
    );

    // Retry once if empty
    if (!rawCandidates || rawCandidates.length === 0) {
      console.log("X2: First generation attempt returned empty, retrying...");
      rawCandidates = await generateCandidates(
        effectiveText,
        contextExtraction,
        strategy,
        metrics,
        goal,
        relationshipContext,
        chatHistory
      );
    }
    const generationLatency = Date.now() - genStart;

    // If still empty after retry, fall back to coach mode
    if (!rawCandidates || rawCandidates.length === 0) {
      console.error("X2: Generation failed after retry, falling back to coach mode");
      const { reply, draft } = await coachResponse(
        userMessage || `Analyze this conversation and suggest replies:\n${effectiveText}`,
        chatHistory,
        goal,
        relationshipContext,
        effectiveText
      );
      return NextResponse.json({
        mode: "coach",
        reply,
        draft,
        latencyMs: Date.now() - startTime,
        fallback: true,
      });
    }

    // Step 4: Critic scores and selects
    const criticStart = Date.now();
    const criticResult = await criticAndSelect(
      rawCandidates,
      effectiveText,
      contextExtraction,
      strategy,
      goal
    );
    const criticLatency = Date.now() - criticStart;

    const totalLatency = Date.now() - startTime;

    // Build response
    const payload = {
      mode: "orchestrate",
      // The winner and backup
      winner: criticResult.candidates?.[criticResult.winner_id] || null,
      backup: criticResult.candidates?.[criticResult.backup_id] || null,
      winner_reason: criticResult.winner_reason,
      // All candidates with scores
      candidates: criticResult.candidates,
      // Context and strategy for display
      context_extraction: contextExtraction,
      strategy: {
        momentum: strategy.momentum,
        balance: strategy.balance,
        energy_level: strategy.energy_level,
        sarcasm_detected: strategy.sarcasm_detected,
        is_kidding: strategy.is_kidding,
        risk_flags: strategy.risk_flags,
        move: strategy.move,
      },
      // Performance
      latency: {
        total: totalLatency,
        strategy: strategyLatency,
        generation: generationLatency,
        critic: criticLatency,
      },
    };

    // Log to x2_runs (async, don't block)
    const admin = getSupabaseAdmin();
    if (admin) {
      const avgScores = (criticResult.candidates || []).reduce(
        (acc, c) => {
          acc.neediness += c.scores?.neediness_risk || 0;
          acc.clarity += c.scores?.clarity || 0;
          acc.forward += c.scores?.forward_motion || 0;
          acc.tone += c.scores?.tone_match || 0;
          acc.count++;
          return acc;
        },
        { neediness: 0, clarity: 0, forward: 0, tone: 0, count: 0 }
      );
      const n = avgScores.count || 1;

      admin
        .from("x2_runs")
        .insert({
          user_id: user.id,
          goal,
          relationship_context: relationshipContext,
          thread_text: effectiveText.substring(0, 2000),
          moderation_flagged: false,
          moderation_categories: null,
          context_extraction: contextExtraction,
          strategy: payload.strategy,
          candidates: criticResult.candidates,
          winner_id: criticResult.winner_id,
          backup_id: criticResult.backup_id,
          winner_reason: criticResult.winner_reason,
          avg_neediness_risk: Math.round(avgScores.neediness / n),
          avg_clarity: Math.round(avgScores.clarity / n),
          avg_forward_motion: Math.round(avgScores.forward / n),
          avg_tone_match: Math.round(avgScores.tone / n),
          total_latency_ms: totalLatency,
          strategy_latency_ms: strategyLatency,
          generation_latency_ms: generationLatency,
          critic_latency_ms: criticLatency,
        })
        .then(({ error }) => {
          if (error) console.error("x2_runs log error:", error.message);
        });
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("X2 orchestrate error:", error);
    return NextResponse.json(
      { error: "Orchestration failed" },
      { status: 500 }
    );
  }
}
