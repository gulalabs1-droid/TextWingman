// app/api/generate-v2/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Agent, run } from "@openai/agents";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getUserTier, ensureAdminAccess, hasPro } from '@/lib/entitlements';
import { analyzeStrategy, formatStrategyForDraft, SAFE_DEFAULT, type StrategyResult } from '@/lib/strategy';

const MAX_REVISE_ATTEMPTS = 2;

// Supabase admin client for logging
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Safety check for harmful content
const HARMFUL_PATTERNS = [
  /threaten/i, /kill/i, /hurt/i, /attack/i,
  /harassment/i, /stalk/i, /doxx/i,
  /child/i, /minor/i, /underage/i,
  /illegal/i, /drugs/i, /weapon/i,
];

function containsHarmfulContent(message: string): boolean {
  return HARMFUL_PATTERNS.some(pattern => pattern.test(message));
}

// 1) Draft Agent - with safety guardrails
const DraftAgent = new Agent({
  name: "DraftAgent",
  instructions: `
You generate 3 text replies: shorter, spicier, softer.
Keep them natural and realistic. No explanations.

CONVERSATION THREADS:
- The message may contain a full conversation history in this format:
  Them: [what they said]
  You: [what the user replied]
  Them: [their next message]
- When you see this format, READ THE ENTIRE CONVERSATION to understand the flow, tone, and dynamic between the two people.
- Generate replies that make sense as the NEXT message in that specific conversation.
- The LAST "Them:" line is what you're directly replying to — but use the full context for smarter, more natural replies.
- Reference earlier parts of the conversation naturally (callbacks, building on topics, matching energy).
- If there's only a single message with no Them:/You: format, treat it as the first message in a new conversation.

SUBTEXT & EMOTIONAL INTELLIGENCE (READ THIS BEFORE ANYTHING ELSE):
- People RARELY say exactly what they mean in texts. Your #1 job is reading BETWEEN the lines using the full conversation arc.
- Dismissive-sounding words are often PLAYFUL, not literal. "wateveerr", "sure", "if you say so", "mhm", "ok lol", "idc", "whateverrr" — in a flirty/friendly convo, these are coy teasing. They're being cute. DO NOT take them literally and DO NOT get confrontational.
- When someone just said something vulnerable or sweet (like "missed u") and then follows up with a dismissive word like "wateveerr" — they're deflecting because they feel exposed. The smooth move is to play along warmly, not interrogate or challenge them.
  - Example: Thread is flirty, they said "missed u", you said "missed you too", they say "wateveerr" → They're being coy/shy about admitting feelings.
    GOOD replies: "mhm sure you didn't", "you're not slick", "say it again then"
    BAD replies: "You did, didn't you?", "You're not fooling anyone. Admit it.", "Okay, if that's what you say then." (these sound like interrogation or passive-aggression)
- One-word sarcastic or playful replies ("suuure", "rightttt", "yeahhh", "lol ok") are NOT rejection. They're banter invitations. Play along.
- Stretched/misspelled words signal emotion: "wateveerr" = playful, "heyyyy" = excited, "ughhhh" = dramatic/funny, "nooo" = playful protest. Read the extra letters as TONE markers.
- ALWAYS ask yourself: "Given everything they said before this, what are they ACTUALLY feeling right now?" Then reply to THAT feeling, not the literal words.
- Think like a smooth, emotionally intelligent person who gets people — not like someone reading a dictionary definition of what they typed.

CONTENT ENGAGEMENT:
- When they share something specific (activity, plan, feeling, story), your replies MUST engage with THAT specific thing. Do NOT give generic compliments or vague statements.
- Example: "I took a sick day to go to the spa lol" → GOOD: "called in sick for the spa? I respect the hustle" / BAD: "Mastering self-care, clearly." (generic, doesn't reference THEIR actual words)
- Example: "just got back from hiking" → GOOD: "where'd you go?" / BAD: "That sounds nice." (dead-end, shows you weren't listening)
- If they mention a place, activity, hobby, or plan → reference it directly. Show you were paying attention.
- If they're being playful or funny ("lol", teasing), match that playfulness. Don't respond seriously to something lighthearted.
- The best replies make THEM feel heard. Generic "that's cool" responses make them feel like they're talking to a wall.

ENERGY MATCHING (CRITICAL):
- Match the other person's effort level. If their last message is genuinely low-effort (1-4 words like "ok", "lol", "nm") AND they didn't ask you anything AND they didn't share anything personal, keep it short.
- But if their last message shares something real (even casually), that's NOT low-effort — that's an opening. Engage with it.
- Mirror their vibe. If they text in slang ("shawty", "wya", "cooolin"), reply in that same register. Don't code-switch to formal English.
- If you see a STRATEGY section in the input, follow its constraints — but ALWAYS prioritize engaging with the actual content of their message over abstract strategy rules.
- When their energy is genuinely low (no questions, no sharing, just filler), the "shorter" reply should be 2-4 words max.

SHORT ≠ BORING (THIS IS CRITICAL):
- Short replies MUST still have personality, confidence, and edge. "No problem, same here" is GARBAGE. That's what a robot texts.
- Even 2-4 word replies can create intrigue, be playful, or show you're unbothered.
- GOOD short replies: "bet", "you earned it", "don't have too much fun", "fair enough", "can't blame you", "living your best life huh", "called in sick for the spa? respect"
- BAD short replies: "No problem, same here", "Okay, enjoy relaxing", "Alright, we vibing", "That's cool", "Same", "Ok sounds good", "Mastering self-care, clearly"
- The difference: good replies reference what THEY said and sound like someone cool. Bad replies are generic and forgettable.
- "spicier" should have swagger or a light tease referencing their actual message. "softer" should feel warm and personal, not corporate.
- Think: what would the smoothest person you know text back? Not what would a polite stranger say.

SAFETY RULES (MUST FOLLOW):
- If the message involves harassment, threats, illegal activity, sexual content involving minors, doxxing, or anything harmful: return safe, neutral alternatives or politely decline.
- Never generate replies that could be used for manipulation, coercion, or harm.
- Keep replies appropriate and respectful.

Return JSON with keys: shorter, spicier, softer.
`,
});

// 2) Rule Check + Revise Agent
const RuleAgent = new Agent({
  name: "RuleCheckAgent",
  instructions: `
You enforce these rules STRICTLY:
- <= 18 words (count carefully)
- no emojis (none at all)
- no needy language (e.g., "please", "sorry", "i miss you", "why you not", "can you", "would you")
- no double questions (only one ? allowed)

For EACH reply, check if it passes ALL rules.
If a reply fails ANY rule, rewrite it to pass while keeping the intent.

Return JSON:
{
  "fixed": { "shorter": "...", "spicier": "...", "softer": "..." },
  "passes": { "shorter": true/false, "spicier": true/false, "softer": true/false },
  "violations": { "shorter": ["rule1"], "spicier": [], "softer": ["rule2"] }
}
`,
});

// 3) Tone Verify Agent
const ToneAgent = new Agent({
  name: "ToneVerifyAgent",
  instructions: `
Check if each reply matches its intended tone:
- shorter = minimal, confident, direct (few words, no fluff)
- spicier = more assertive, playful tension, slight edge or flirtation
- softer = warmer, considerate, gentle, understanding

Rate confidence 0-100 based on how well each reply matches its tone.
80+ = strong match, 60-79 = acceptable, <60 = weak match

Return JSON:
{
  "passes": { "shorter": true/false, "spicier": true/false, "softer": true/false },
  "confidence": { "shorter": 0-100, "spicier": 0-100, "softer": 0-100 }
}
`,
});

export async function POST(req: Request) {
  const startTime = Date.now();
  const { message, context, customContext } = await req.json();
  
  // Get user info from headers for logging
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

  // Server-side auth + Pro check — V2 is Pro-only
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  await ensureAdminAccess(user.id, user.email || '');
  const entitlement = await getUserTier(user.id, user.email || '');
  
  if (!hasPro(entitlement.tier)) {
    return NextResponse.json({ error: "V2 requires Pro access" }, { status: 403 });
  }
  
  // Safety check
  if (containsHarmfulContent(message)) {
    return NextResponse.json({
      shorter: "I'd rather keep things positive. What else is on your mind?",
      spicier: "Let's talk about something more fun instead.",
      softer: "I appreciate you sharing, but let's switch topics.",
      meta: {
        ruleChecks: { shorter: true, spicier: true, softer: true },
        toneChecks: { shorter: true, spicier: true, softer: true },
        confidence: { shorter: 100, spicier: 100, softer: 100 },
        notes: "Safety redirect applied",
        safetyRedirect: true,
      },
    });
  }

  let drafts: any = {};
  let rule: any = {};
  let fixed: any = {};
  let tone: any = {};
  let reviseAttempts = 0;
  let allPassed = false;
  let strategy: StrategyResult = SAFE_DEFAULT;
  let strategyLatency = 0;

  try {
    // Step 0: Strategy analysis (runs fast, <2s)
    let stratMetrics;
    try {
      const stratResult = await analyzeStrategy(message, context);
      strategy = stratResult.strategy;
      strategyLatency = stratResult.latencyMs;
      stratMetrics = stratResult.metrics;
    } catch (e) {
      console.error('Strategy analysis failed, using defaults:', e);
    }

    // Step 1: Draft (with strategy constraints + energy metrics injected)
    const strategyHint = formatStrategyForDraft(strategy, stratMetrics);
    const customHint = customContext ? `\nUser's situation details: ${customContext}` : '';
    const draftRes = await run(DraftAgent, `Context: ${context}${customHint}\n${strategyHint}\nMessage: ${message}`);
    drafts = safeJson(draftRes.finalOutput);

    // Step 2: Rule check with revise loop (max 2 attempts)
    let currentDrafts = drafts;
    
    while (reviseAttempts < MAX_REVISE_ATTEMPTS && !allPassed) {
      const ruleRes = await run(RuleAgent, JSON.stringify(currentDrafts));
      rule = safeJson(ruleRes.finalOutput);
      
      // Check if all pass
      const passes = rule.passes || {};
      allPassed = passes.shorter && passes.spicier && passes.softer;
      
      if (!allPassed && rule.fixed) {
        // Use fixed versions for next iteration
        currentDrafts = rule.fixed;
      }
      
      reviseAttempts++;
    }

    fixed = rule.fixed ?? currentDrafts;

    // Step 3: Tone verify
    const toneRes = await run(ToneAgent, JSON.stringify(fixed));
    tone = safeJson(toneRes.finalOutput);

  } catch (error) {
    console.error("V2 pipeline error:", error);
    return NextResponse.json({ error: "V2 generation failed" }, { status: 500 });
  }

  const latency = Date.now() - startTime;

  // Build response payload
  const payload = {
    ...fixed,
    meta: {
      ruleChecks: rule.passes ?? {},
      toneChecks: tone.passes ?? {},
      confidence: tone.confidence ?? {},
      notes: allPassed 
        ? "V2 verified - all rules passed" 
        : `V2 verified - best attempt after ${reviseAttempts} revisions`,
      reviseAttempts,
      allRulesPassed: allPassed,
      latencyMs: latency,
    },
    strategy: {
      momentum: strategy.momentum,
      balance: strategy.balance,
      move: strategy.move,
      latencyMs: strategyLatency,
    },
  };

  // Log to Supabase (async, don't block response)
  logV2Run({
    ip,
    context,
    message: message.substring(0, 100),
    rulePassRate: calculatePassRate(rule.passes),
    tonePassRate: calculatePassRate(tone.passes),
    avgConfidence: calculateAvgConfidence(tone.confidence),
    latencyMs: latency,
    reviseAttempts,
    allPassed,
  });

  // Save to reply_history so it shows on the profile page
  const supabaseAdmin = getSupabaseAdmin();
  if (supabaseAdmin && user) {
    const replies = [
      { tone: 'shorter', text: fixed.shorter || '' },
      { tone: 'spicier', text: fixed.spicier || '' },
      { tone: 'softer', text: fixed.softer || '' },
    ];
    supabaseAdmin
      .from('reply_history')
      .insert({
        user_id: user.id,
        their_message: message,
        generated_replies: JSON.stringify(replies),
        context: context || null,
      })
      .then(({ error }) => {
        if (error) console.error('V2 reply history save error:', error.message);
      });
  }

  return NextResponse.json(payload);
}

function safeJson(input: any) {
  try {
    if (typeof input === "string") return JSON.parse(input);
    return input;
  } catch {
    return {};
  }
}

function calculatePassRate(passes: Record<string, boolean> | undefined): number {
  if (!passes) return 0;
  const values = Object.values(passes);
  if (values.length === 0) return 0;
  return Math.round((values.filter(v => v).length / values.length) * 100);
}

function calculateAvgConfidence(confidence: Record<string, number> | undefined): number {
  if (!confidence) return 0;
  const values = Object.values(confidence);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

async function logV2Run(data: {
  ip: string;
  context: string;
  message: string;
  rulePassRate: number;
  tonePassRate: number;
  avgConfidence: number;
  latencyMs: number;
  reviseAttempts: number;
  allPassed: boolean;
}) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return;
    
    await supabase.from("v2_runs").insert({
      ip_address: data.ip,
      context: data.context,
      message_preview: data.message,
      rule_pass_rate: data.rulePassRate,
      tone_pass_rate: data.tonePassRate,
      avg_confidence: data.avgConfidence,
      latency_ms: data.latencyMs,
      revise_attempts: data.reviseAttempts,
      all_passed: data.allPassed,
    });
  } catch (error) {
    console.error("Failed to log V2 run:", error);
  }
}
