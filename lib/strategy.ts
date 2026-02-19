import OpenAI from 'openai';
import { z } from 'zod';

// ── Schema ───────────────────────────────────────────────
export const StrategySchema = z.object({
  momentum: z.enum(['Rising', 'Flat', 'Declining', 'Stalling', 'Unknown']),
  balance: z.enum(['You leading', 'They leading', 'Balanced', 'User chasing', 'Unknown']),
  energy_level: z.enum(['High flirt', 'Playful', 'Warm', 'Polite', 'Dry', 'Cold']).optional(),
  sarcasm_detected: z.boolean().optional(),
  is_kidding: z.boolean().optional(),
  risk_flags: z.array(z.string()).optional(),
  move: z.object({
    energy: z.enum(['pull_back', 'match', 'escalate', 'clarify', 'logistics']),
    one_liner: z.string().max(100),
    constraints: z.object({
      no_questions: z.boolean(),
      keep_short: z.boolean(),
      add_tease: z.boolean(),
      push_meetup: z.boolean(),
    }),
    risk: z.enum(['low', 'medium', 'high']),
  }),
});

export type StrategyResult = z.infer<typeof StrategySchema>;

// ── Safe default for short/invalid threads ───────────────
export const SAFE_DEFAULT: StrategyResult = {
  momentum: 'Unknown',
  balance: 'Unknown',
  move: {
    energy: 'match',
    one_liner: 'Too early to read. Play it cool.',
    constraints: {
      no_questions: false,
      keep_short: true,
      add_tease: false,
      push_meetup: false,
    },
    risk: 'low',
  },
};

// ── Metrics computation from thread text ─────────────────
export interface ThreadMetrics {
  youCount: number;
  themCount: number;
  totalMessages: number;
  investmentRatio: number; // >1 = you investing more
  recentEnergy: 'low' | 'medium' | 'high';
  lastSpeaker: 'you' | 'them' | 'unknown';
  theirAvgLength: number;
  yourAvgLength: number;
  lastReceivedLength: number;
  lastMessageSubstantive: boolean; // 8+ words in their last message
  recentTheirAvgLength: number; // avg of their last 2 messages (more representative)
  theirRecentQuestions: number; // how many of their last 3 messages contain '?'
  theyReinitiated: boolean; // they messaged after you had the last word
}

export function computeMetrics(threadText: string): ThreadMetrics {
  const lines = threadText.split('\n').filter(l => l.trim());
  const youLines = lines.filter(l => l.startsWith('You:'));
  const themLines = lines.filter(l => l.startsWith('Them:'));

  const youCount = youLines.length;
  const themCount = themLines.length;
  const totalMessages = youCount + themCount;

  // Investment ratio: compare total character length
  const youChars = youLines.reduce((sum, l) => sum + l.replace('You: ', '').length, 0);
  const themChars = themLines.reduce((sum, l) => sum + l.replace('Them: ', '').length, 0);
  const investmentRatio = themChars > 0 ? youChars / themChars : 1;

  // Recent energy: look at last 3 messages for questions/length
  const last3 = lines.slice(-3);
  const questionCount = last3.filter(l => l.includes('?')).length;
  const avgLen = last3.reduce((s, l) => s + l.length, 0) / Math.max(last3.length, 1);
  const recentEnergy: 'low' | 'medium' | 'high' =
    questionCount >= 2 || avgLen > 80 ? 'high' : avgLen > 30 ? 'medium' : 'low';

  const lastLine = lines[lines.length - 1] || '';
  const lastSpeaker: 'you' | 'them' | 'unknown' =
    lastLine.startsWith('You:') ? 'you' : lastLine.startsWith('Them:') ? 'them' : 'unknown';

  // Average message lengths for energy-matching
  const yourAvgLength = youCount > 0 ? Math.round(youChars / youCount) : 0;
  const theirAvgLength = themCount > 0 ? Math.round(themChars / themCount) : 0;

  // Length of the last received message (what we're replying to)
  const lastThemLine = [...themLines].pop() || '';
  const lastThemText = lastThemLine.replace(/^Them:\s*/, '').replace(/\s*\(.*\)\s*$/, '');
  const lastReceivedLength = lastThemText.length;

  // Last message substantive: 8+ words = real content, not filler
  const lastMessageWords = lastThemText.split(/\s+/).filter(w => w.length > 0).length;
  const lastMessageSubstantive = lastMessageWords >= 8;

  // Recent their avg length (last 2 messages — more representative than all-time)
  const recentThemLines = themLines.slice(-2);
  const recentThemChars = recentThemLines.reduce((sum, l) => sum + l.replace(/^Them:\s*/, '').replace(/\s*\(.*\)\s*$/, '').length, 0);
  const recentTheirAvgLength = recentThemLines.length > 0 ? Math.round(recentThemChars / recentThemLines.length) : 0;

  // How many of their last 3 messages contain questions (engagement signal)
  const recentThemForQ = themLines.slice(-3);
  const theirRecentQuestions = recentThemForQ.filter(l => l.includes('?')).length;

  // They re-initiated: they sent a message after you had the last word
  // Walk backwards to find the latest You→Them transition
  const theyReinitiated = (() => {
    for (let i = lines.length - 1; i >= 1; i--) {
      if (lines[i].startsWith('Them:') && lines[i - 1].startsWith('You:')) {
        // They messaged after us — if they asked a question or it's mid-convo, it's re-initiation
        return i >= 2;
      }
    }
    return false;
  })();

  return { youCount, themCount, totalMessages, investmentRatio, recentEnergy, lastSpeaker, theirAvgLength, yourAvgLength, lastReceivedLength, lastMessageSubstantive, recentTheirAvgLength, theirRecentQuestions, theyReinitiated };
}

// ── Strategy prompt ──────────────────────────────────────
const STRATEGY_PROMPT = `You are Text Wingman's elite StrategyAgent. Analyze the full conversation thread and output deep strategic insights.

Core Principles (never violate):
- Always assume positive intent unless clear evidence of disrespect.
- Distinguish sarcasm/playful teasing from low-investment dryness.
- Never suggest needy, over-eager, or double-text energy.
- Respect power balance: if user is investing more, recommend pull-back.
- Keep all advice confident, concise, non-judgmental, and actionable.

OUTPUT: Strict JSON only. No extra text, no markdown, no explanation.

YOUR VOICE:
- Talk like a sharp friend, not a dashboard. Say "You're chasing" not "You're investing more." Say "They're testing you" not "Mixed signals detected."
- The one_liner should make them feel "Oh... I was about to mess this up." Not "Interesting insight."
- Be blunt but not cruel. You're protecting them, not roasting them.
- No therapy speak. No "attachment styles." No "I feel" language. No emojis.
- Under 12 words for one_liner. Every word earns its spot.

EXAMPLES OF GOOD one_liners:
- "You're chasing. Let them come to you."
- "Don't ask that. You'll kill the tension."
- "They're testing your frame. Hold it."
- "You're ahead. Don't overplay it."
- "Momentum is fragile. One wrong text kills it."
- "They left the door open. Walk through it."
- "Stop explaining yourself. Just be fun."
- "They're warming up. Don't rush it."
- "You're one question away from looking needy."
- "This is your window. Make a move."

EXAMPLES OF BAD one_liners (never write these):
- "Conversation momentum is declining." (dashboard, not a friend)
- "Consider pulling back slightly." (too polite, no urgency)
- "Match their energy level." (generic, forgettable)
- "The investment ratio is unbalanced." (robotic)

KEY DETECTION SKILLS:

1. SARCASM vs LOW INVESTMENT:
   - Playful sarcasm has: emojis, questions back, callbacks, exaggeration + "lol"/"haha", context mismatch (saying something negative in a clearly positive convo). Set sarcasm_detected=true.
   - Low investment is: short, delayed, one-word, no questions, no personal sharing, flat tone.
   - "wateveerr" in a flirty convo = sarcasm (playful). "whatever" after being ignored = low investment.

2. KIDDING vs SERIOUS:
   - Kidding has: exaggeration, "lol", "jk", follow-up softening, stretched words. Set is_kidding=true.
   - Serious has: flat tone, repetition, no softening, direct + short.
   - "i hate you lol" = kidding. "i hate this" = serious.

3. POWER DYNAMICS:
   - Who initiates more? Who uses longer messages? Who asks more questions?
   - If user sends 2x more chars than them = "User chasing"
   - If they're matching effort = "Balanced"
   - If they're writing novels while user is chill = "They leading"

4. ENERGY TRAJECTORY:
   - Rising = faster replies, more emojis/questions, longer messages, callbacks to earlier topics
   - Stable = consistent effort both sides
   - Declining = delays + shorter replies + fewer questions
   - Stalling = convo is dying, just filler

5. EMOTIONAL SIGNALS (detect these):
   - Testing frame: they say something provocative to see how you react
   - Pulling away: shorter replies, longer gaps, avoiding plans
   - High interest: questions, re-initiation, personal sharing, flirty teasing
   - Comfortable flirting: playful banter, teasing, callbacks, stretched words
   - Polite disengagement: polite but closed responses, no hooks for continuation
   - Note these in risk_flags array.

JSON SCHEMA:
{
  "momentum": "Rising" | "Flat" | "Declining" | "Stalling" | "Unknown",
  "balance": "You leading" | "They leading" | "Balanced" | "User chasing" | "Unknown",
  "energy_level": "High flirt" | "Playful" | "Warm" | "Polite" | "Dry" | "Cold",
  "sarcasm_detected": true | false,
  "is_kidding": true | false,
  "risk_flags": ["Sarcasm likely playful", "Testing frame", "User over-investing"],
  "move": {
    "energy": "pull_back" | "match" | "escalate" | "clarify" | "logistics",
    "one_liner": string,
    "constraints": {
      "no_questions": boolean,
      "keep_short": boolean,
      "add_tease": boolean,
      "push_meetup": boolean
    },
    "risk": "low" | "medium" | "high"
  }
}

READING THE THREAD:
- momentum: Rising = they're leaning in, getting warmer. Flat = autopilot. Declining = pulling away, shorter replies. Stalling = this is dying.
- balance: Who's trying harder? Who's carrying the convo? "You leading" = you're doing too much. "User chasing" = they're clearly not matching your effort.
- energy_level: Read the OVERALL vibe. High flirt = sexual tension. Playful = fun banter. Warm = genuine connection. Polite = surface level. Dry = barely engaging. Cold = hostile or checked out.
- energy: pull_back = you're overexposed, create space. match = vibe is right, stay in pocket. escalate = they're into it, turn up the heat. clarify = something's off, address it. logistics = it's time to make plans.
- risk: low = safe play. medium = bold but justified. high = could blow up in their face.
- risk_flags: 1-3 short strings noting what you detected (sarcasm, frame testing, over-investing, etc.)
- constraints: set these based on what would PROTECT the user. no_questions=true if asking will look needy. keep_short=true if they're writing novels. add_tease=true if the convo needs spark. push_meetup=true if it's time to get off the phone.

CONSERVATIVE RULE: If <3 total messages, set momentum and balance to "Unknown" and give safe defaults.

ENGAGEMENT SIGNALS (CHECK THESE FIRST — they override low-effort assumptions):
- RE-INITIATION: If they messaged AFTER you had the last word (especially after a time gap), that's a strong interest signal. They came back to YOU. This is NOT "giving nothing" — it's pursuit.
- QUESTIONS: If they asked you a question ("Are you off today?", "wyd", "hbu"), they're actively engaging. Asking = interest.
- PERSONAL SHARING: If they share what they're doing, feeling, or planning ("took a sick day to go to the spa", "just got back from the gym", "my mom is driving me crazy"), they're opening up. Engage with the CONTENT.
- GROWING ENERGY: If their recent messages are getting LONGER than their earlier messages, momentum is Rising even if early messages were short filler.
- When engagement signals are present: momentum is Rising or at least Flat, energy should be "match" or "escalate", and you CAN suggest teasing, questions, or plans.

LOW-EFFORT DETECTION (only when engagement signals above are ABSENT):
- If their last message is very short (1-4 words like "ok", "The same", "lol", "nm u") AND they didn't ask any questions recently AND they didn't re-initiate, momentum is Declining or Stalling.
- Do NOT suggest asking questions or pushing for plans when they're giving minimal effort — it looks desperate.
- For true low-effort: energy should be "match" or "pull_back", keep_short=true, no_questions=true.
- The one_liner should call it out honestly ONLY if they're genuinely disengaged.

CRITICAL: Do NOT confuse casual texting style with low effort. Short earlier messages like "Alrightyyy" or "Me too lol" are normal conversational fillers — what matters most is their LAST message and whether THEY initiated.`;

// ── Main analysis function ───────────────────────────────
export async function analyzeStrategy(
  threadText: string,
  context?: string,
): Promise<{ strategy: StrategyResult; metrics: ThreadMetrics; latencyMs: number }> {
  const startTime = Date.now();
  const metrics = computeMetrics(threadText);

  // Very short thread → safe default (3+ messages = enough to analyze)
  if (metrics.totalMessages < 3) {
    return { strategy: SAFE_DEFAULT, metrics, latencyMs: Date.now() - startTime };
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: STRATEGY_PROMPT },
        {
          role: 'user',
          content: `THREAD:\n${threadText}\n\nCONTEXT: ${context || 'unknown'}\nMETRICS: ${JSON.stringify(metrics)}\nTHEIR LAST MESSAGE LENGTH: ${metrics.lastReceivedLength} chars (${metrics.lastMessageSubstantive ? 'SUBSTANTIVE — real content' : 'short'})\nTHEIR RECENT AVG LENGTH: ${metrics.recentTheirAvgLength} chars (last 2 msgs)\nTHEIR ALL-TIME AVG LENGTH: ${metrics.theirAvgLength} chars\nYOUR AVG LENGTH: ${metrics.yourAvgLength} chars\nTHEY RE-INITIATED: ${metrics.theyReinitiated ? 'YES — they came back after you had the last word' : 'no'}\nTHEIR RECENT QUESTIONS: ${metrics.theirRecentQuestions} of last 3 messages`,
        },
      ],
      temperature: 0.3,
      max_tokens: 450,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message.content;
    if (!raw) throw new Error('Empty response');

    const parsed = JSON.parse(raw);
    const validated = StrategySchema.parse(parsed);

    return { strategy: validated, metrics, latencyMs: Date.now() - startTime };
  } catch (error) {
    console.error('Strategy analysis error:', error);
    return { strategy: SAFE_DEFAULT, metrics, latencyMs: Date.now() - startTime };
  }
}

// ── Format constraints for DraftAgent injection ──────────
export function formatStrategyForDraft(strategy: StrategyResult, metrics?: ThreadMetrics): string {
  const c = strategy.move.constraints;
  const rules: string[] = [];
  if (c.keep_short) rules.push('Keep it SHORT. No essays.');
  if (c.no_questions) rules.push('Do NOT ask any questions. Statements only.');
  if (c.add_tease) rules.push('Add a playful tease or callback.');
  if (c.push_meetup) rules.push('Steer toward making plans to meet.');

  // Sarcasm/kidding hints from strategy
  const detectionHints: string[] = [];
  if (strategy.sarcasm_detected) detectionHints.push('SARCASM DETECTED: Their message is playful sarcasm, not serious. Mirror it lightly — play along, don\'t take it literally.');
  if (strategy.is_kidding) detectionHints.push('KIDDING DETECTED: They\'re joking/exaggerating. Match the playful energy, don\'t respond seriously.');
  if (strategy.energy_level) detectionHints.push(`VIBE: ${strategy.energy_level}`);
  if (strategy.risk_flags && strategy.risk_flags.length > 0) detectionHints.push(`WATCH FOR: ${strategy.risk_flags.join(', ')}`);

  // Energy-matching hint based on their message lengths
  let energyHint = '';
  if (metrics) {
    if (metrics.lastReceivedLength <= 15 && !metrics.lastMessageSubstantive && !metrics.theyReinitiated && metrics.theirRecentQuestions === 0) {
      energyHint = `\nENERGY LEVEL: Their last message was only ${metrics.lastReceivedLength} chars and no engagement signals. Match that energy — keep replies very short (2-5 words). Do NOT ask questions or push for plans.`;
    } else if (metrics.lastMessageSubstantive || metrics.theyReinitiated || metrics.theirRecentQuestions > 0) {
      energyHint = `\nENERGY LEVEL: They're engaged — ${metrics.theyReinitiated ? 'they re-initiated, ' : ''}${metrics.lastMessageSubstantive ? 'last message is substantive, ' : ''}${metrics.theirRecentQuestions > 0 ? 'they asked questions. ' : ''}Engage with the CONTENT of their message. Reference specifics from what they said.`;
    } else if (metrics.theirAvgLength < 20) {
      energyHint = `\nENERGY LEVEL: They average ${metrics.theirAvgLength} chars per message. Keep replies brief and casual.`;
    }
  }

  return [
    `STRATEGY (your sharp friend says):`,
    `"${strategy.move.one_liner}"`,
    `Momentum: ${strategy.momentum} | Balance: ${strategy.balance} | Energy: ${strategy.move.energy} | Risk: ${strategy.move.risk}`,
    detectionHints.length > 0 ? detectionHints.join('\n') : '',
    rules.length > 0 ? `RULES:\n${rules.map(r => `- ${r}`).join('\n')}` : '',
    energyHint,
  ].filter(Boolean).join('\n');
}
