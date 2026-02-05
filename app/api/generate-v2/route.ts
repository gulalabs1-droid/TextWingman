// app/api/generate-v2/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Agent, run } from "@openai/agents";
import { z } from "zod";

const OutputSchema = z.object({
  shorter: z.string(),
  spicier: z.string(),
  softer: z.string(),
  meta: z.object({
    ruleChecks: z.record(z.string(), z.boolean()),
    toneChecks: z.record(z.string(), z.boolean()),
    confidence: z.record(z.string(), z.number()),
    notes: z.string().optional(),
  }),
});

// 1) Draft Agent
const DraftAgent = new Agent({
  name: "DraftAgent",
  instructions: `
You generate 3 text replies: shorter, spicier, softer.
Keep them natural and realistic. No explanations.
Return JSON with keys: shorter, spicier, softer.
`,
});

// 2) Rule Check + Revise Agent
const RuleAgent = new Agent({
  name: "RuleCheckAgent",
  instructions: `
You enforce these rules:
- <= 18 words
- no emojis
- no needy language (e.g., "please", "sorry", "i miss you", "why you not")
- no double questions
If a reply fails, rewrite it to pass while keeping the intent.
Return JSON:
{
  "fixed": { "shorter": "...", "spicier": "...", "softer": "..." },
  "passes": { "shorter": true/false, "spicier": true/false, "softer": true/false }
}
`,
});

// 3) Tone Verify Agent
const ToneAgent = new Agent({
  name: "ToneVerifyAgent",
  instructions: `
Check if each reply matches its tone:
- shorter = minimal, confident
- spicier = more assertive / flirty tension
- softer = warmer / considerate
Return JSON:
{
  "passes": { "shorter": true/false, "spicier": true/false, "softer": true/false },
  "confidence": { "shorter": 0-100, "spicier": 0-100, "softer": 0-100 }
}
`,
});

export async function POST(req: Request) {
  const { message, context } = await req.json();

  // Draft
  const draftRes = await run(DraftAgent, `Context: ${context}\nMessage: ${message}`);
  let drafts = safeJson(draftRes.finalOutput);

  // Rule check (1 pass; add loop later)
  const ruleRes = await run(RuleAgent, JSON.stringify(drafts));
  const rule = safeJson(ruleRes.finalOutput);

  const fixed = rule.fixed ?? drafts;

  // Tone verify
  const toneRes = await run(ToneAgent, JSON.stringify(fixed));
  const tone = safeJson(toneRes.finalOutput);

  const payload = {
    ...fixed,
    meta: {
      ruleChecks: rule.passes ?? {},
      toneChecks: tone.passes ?? {},
      confidence: tone.confidence ?? {},
      notes: "V2 verified pipeline",
    },
  };

  // Optional: validate
  // OutputSchema.parse(payload);

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
