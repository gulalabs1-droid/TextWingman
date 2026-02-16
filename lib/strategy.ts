import OpenAI from 'openai';
import { z } from 'zod';

// ── Schema ───────────────────────────────────────────────
export const StrategySchema = z.object({
  momentum: z.enum(['Rising', 'Flat', 'Declining', 'Stalling', 'Unknown']),
  balance: z.enum(['You leading', 'They leading', 'Balanced', 'Unknown']),
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
  const lastReceivedLength = lastThemLine.replace(/^Them:\s*/, '').replace(/\s*\(.*\)\s*$/, '').length;

  return { youCount, themCount, totalMessages, investmentRatio, recentEnergy, lastSpeaker, theirAvgLength, yourAvgLength, lastReceivedLength };
}

// ── Strategy prompt ──────────────────────────────────────
const STRATEGY_PROMPT = `You are the user's sharp friend reading over their shoulder during a text conversation. You see what's really happening and you tell them the move — direct, visceral, no sugarcoating.

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

JSON SCHEMA:
{
  "momentum": "Rising" | "Flat" | "Declining" | "Stalling" | "Unknown",
  "balance": "You leading" | "They leading" | "Balanced" | "Unknown",
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
- balance: Who's trying harder? Who's carrying the convo? "You leading" = you're doing too much.
- energy: pull_back = you're overexposed, create space. match = vibe is right, stay in pocket. escalate = they're into it, turn up the heat. clarify = something's off, address it. logistics = it's time to make plans.
- risk: low = safe play. medium = bold but justified. high = could blow up in their face.
- constraints: set these based on what would PROTECT the user. no_questions=true if asking will look needy. keep_short=true if they're writing novels. add_tease=true if the convo needs spark. push_meetup=true if it's time to get off the phone.

CONSERVATIVE RULE: If <3 total messages, set momentum and balance to "Unknown" and give safe defaults.

LOW-EFFORT DETECTION:
- If their last message is very short (1-4 words like "ok", "The same", "lol", "nm u"), momentum is Declining or Stalling.
- Do NOT suggest asking questions or pushing for plans when they're giving minimal effort — it looks desperate.
- For low-effort replies: energy should be "match" or "pull_back", keep_short=true, no_questions=true.
- The one_liner should call out the dynamic honestly, e.g. "They're giving you nothing. Don't reward it." or "Match their energy. Two words back."`;

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
          content: `THREAD:\n${threadText}\n\nCONTEXT: ${context || 'unknown'}\nMETRICS: ${JSON.stringify(metrics)}\nTHEIR LAST MESSAGE LENGTH: ${metrics.lastReceivedLength} chars\nTHEIR AVG LENGTH: ${metrics.theirAvgLength} chars\nYOUR AVG LENGTH: ${metrics.yourAvgLength} chars`,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
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

  // Energy-matching hint based on their message lengths
  let energyHint = '';
  if (metrics) {
    if (metrics.lastReceivedLength <= 15) {
      energyHint = `\nENERGY LEVEL: Their last message was only ${metrics.lastReceivedLength} chars. Match that energy — keep replies very short (2-5 words). Do NOT ask questions or push for plans.`;
    } else if (metrics.theirAvgLength < 20) {
      energyHint = `\nENERGY LEVEL: They average ${metrics.theirAvgLength} chars per message. Keep replies brief and casual.`;
    }
  }

  return [
    `STRATEGY (your sharp friend says):`,
    `"${strategy.move.one_liner}"`,
    `Energy: ${strategy.move.energy} | Risk: ${strategy.move.risk}`,
    rules.length > 0 ? `RULES:\n${rules.map(r => `- ${r}`).join('\n')}` : '',
    energyHint,
  ].filter(Boolean).join('\n');
}
