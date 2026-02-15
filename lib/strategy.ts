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
    one_liner: 'Match their energy. Keep it natural.',
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

  return { youCount, themCount, totalMessages, investmentRatio, recentEnergy, lastSpeaker };
}

// ── Strategy prompt ──────────────────────────────────────
const STRATEGY_PROMPT = `You are a text conversation strategist. Analyze the thread and return a JSON strategy recommendation.

RULES:
- Output STRICT JSON ONLY. No extra text, no markdown, no explanation.
- Be non-judgmental. Never say "you're chasing" or "you're desperate." Use neutral framing like "You're investing more right now."
- Be conservative: if <4 total messages, set momentum and balance to "Unknown" and give safe defaults.
- one_liner must be <=12 words, no emojis, no judgment. Actionable and tactical.
- No therapy language, no attachment theory, no paragraphs. Strictly tactical coaching.

JSON SCHEMA (use exactly this shape):
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

DECISION GUIDE:
- momentum: Rising = they're engaging more over time. Flat = even exchanges. Declining = shorter/slower from them. Stalling = conversation dying.
- balance: Compare investment (message length, questions asked, enthusiasm). "You leading" = you're putting in more effort.
- energy: pull_back if you're over-investing. match if balanced. escalate if they're clearly into it. clarify if mixed signals. logistics if ready to meet.
- risk: low = safe move. medium = could go either way. high = bold move that might backfire.`;

// ── Main analysis function ───────────────────────────────
export async function analyzeStrategy(
  threadText: string,
  context?: string,
): Promise<{ strategy: StrategyResult; metrics: ThreadMetrics; latencyMs: number }> {
  const startTime = Date.now();
  const metrics = computeMetrics(threadText);

  // Short thread → safe default
  if (metrics.totalMessages < 4) {
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
          content: `THREAD:\n${threadText}\n\nCONTEXT: ${context || 'unknown'}\nMETRICS: ${JSON.stringify(metrics)}`,
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
export function formatStrategyForDraft(strategy: StrategyResult): string {
  const c = strategy.move.constraints;
  return [
    `STRATEGY COACHING (follow these recommendations):`,
    `- Recommended energy: ${strategy.move.energy}`,
    `- Momentum: ${strategy.momentum} | Balance: ${strategy.balance}`,
    `- Constraints: keep_short=${c.keep_short}, no_questions=${c.no_questions}, add_tease=${c.add_tease}, push_meetup=${c.push_meetup}`,
    `- Coach says: "${strategy.move.one_liner}"`,
  ].join('\n');
}
