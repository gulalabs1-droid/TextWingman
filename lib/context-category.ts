// lib/context-category.ts
// Maps the 6 relationship context values to 3 behavioral categories that drive AI prompt branching.

export type ContextCategory = 'romantic' | 'platonic' | 'professional';

const CATEGORY_MAP: Record<string, ContextCategory> = {
  crush: 'romantic',
  ex: 'romantic',
  new_match: 'romantic',
  friend: 'platonic',
  family: 'platonic',
  colleague: 'professional',
  work: 'professional',
  coworker: 'professional',
  boss: 'professional',
};

export function getContextCategory(context: string | null | undefined): ContextCategory {
  if (!context) return 'romantic';
  return CATEGORY_MAP[context.toLowerCase()] ?? 'romantic';
}

// ── Per-category candidate styles for the orchestration pipeline ──
export const CANDIDATE_STYLES: Record<ContextCategory, { name: string; description: string }[]> = {
  romantic: [
    { name: 'hood_charisma',    description: 'smooth, confident, street-smart. Slang is fine. Swagger without trying too hard.' },
    { name: 'clean_direct',     description: 'clear, confident, no games. Says what needs to be said. Gentleman energy.' },
    { name: 'playful_tease',    description: 'lighthearted, flirty, fun. Teases without being mean. Creates tension.' },
    { name: 'bold_closer',      description: 'moves things forward. Pushes for plans, escalates. Confident ask.' },
    { name: 'warm_genuine',     description: 'honest, real, emotionally intelligent. Shows you care without being soft.' },
    { name: 'chill_unbothered', description: 'low effort on purpose. Cool, not chasing. Less is more.' },
  ],
  platonic: [
    { name: 'warm_genuine',   description: 'genuine, caring. Meets them where they are.' },
    { name: 'honest_direct',  description: 'clear and real. Says exactly what they mean. No fluff.' },
    { name: 'playful_casual', description: 'light and fun, like you\'re just hanging. Banter energy.' },
    { name: 'check_in',       description: 'shows you noticed and care. Invites them to open up without pressure.' },
    { name: 'low_key',        description: 'relaxed, no pressure. Keeps the door open without being intense.' },
    { name: 'lighthearted',   description: 'easy, breezy, keeps things positive. Good for defusing awkwardness.' },
  ],
  professional: [
    { name: 'clear_ask',           description: 'gets to the point immediately. States the need or question directly.' },
    { name: 'diplomatic',          description: 'professional, considerate of their position, avoids conflict.' },
    { name: 'direct_professional', description: 'confident and clear with no hedging. Peer-to-peer energy.' },
    { name: 'warm_collegial',      description: 'friendly and human without overstepping. Builds rapport.' },
    { name: 'concise',             description: 'shortest possible version that still makes sense. Respects their time.' },
    { name: 'assertive',           description: 'holds its ground politely. No apology, no over-explanation.' },
  ],
};

// ── Per-category draft label variants (Shorter / Spicier / Softer in romantic) ──
export const DRAFT_LABELS: Record<ContextCategory, { a: string; b: string; c: string }> = {
  romantic:     { a: 'Shorter', b: 'Spicier',   c: 'Softer'    },
  platonic:     { a: 'Shorter', b: 'Warmer',     c: 'More direct' },
  professional: { a: 'Shorter', b: 'More formal', c: 'Softer'   },
};

// ── Per-category coaching philosophy block injected into system prompts ──
export const COACHING_PHILOSOPHY: Record<ContextCategory, string> = {
  romantic: `COACHING PHILOSOPHY (romantic/dating):
- Read who's investing more, who's chasing, energy level
- Call it out directly: "You're chasing" / "They're pulling back" / "They're into it"
- ZERO needy language. Never double text energy. Never beg. Never over-explain.
- Goal: maintain attraction, forward momentum, confidence frame
- Draft quality: lowercase, no emojis, ≤18 words, sound like a real text`,

  platonic: `COACHING PHILOSOPHY (friend/family):
- Read the emotional temperature: are they distant, stressed, drifting, or just busy?
- Call it out: "They're going through something" / "This friendship needs some water" / "Give them space, they'll come back"
- Goal: maintain genuine connection without pressure or over-neediness
- Don't manufacture drama — sometimes "hey, been a minute" is the right move
- Draft quality: casual, warm, human — ≤20 words, can use light punctuation`,

  professional: `COACHING PHILOSOPHY (professional/work):
- Stakes are real — a bad work message can cost relationships, reputation, or job
- NEVER suggest anything that could be misread as unprofessional, passive-aggressive, or needy
- Read the power dynamic: equal peer, superior, or subordinate — calibrate accordingly
- Goal: clarity of ask, professionalism of tone, zero ambiguity
- "Chasing" metrics don't apply here — focus on clarity and whether the message achieves its objective
- Draft quality: proper capitalization is fine, ≤25 words, no slang, no emojis`,
};

// ── Per-category context extraction tone options ──
export const TONE_OPTIONS: Record<ContextCategory, string> = {
  romantic:     '"warm" | "neutral" | "cold" | "flirty" | "serious" | "stressed" | "playful" | "dry"',
  platonic:     '"warm" | "distant" | "stressed" | "happy" | "playful" | "cold" | "neutral" | "emotional"',
  professional: '"professional" | "curt" | "friendly" | "passive_aggressive" | "urgent" | "neutral" | "stressed" | "warm"',
};
