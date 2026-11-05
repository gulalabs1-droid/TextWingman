// One place to choose OpenAI models. Override per task in Vercel without a code change:
//   OPENAI_MODEL_REPLY=gpt-6.1-terra   OPENAI_REASONING_REPLY=low
// Setting a gpt-4* model restores the legacy parameter shape for a quick rollback (until 2027-01-14).
import type { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';

export type ModelTask = 'reply' | 'vision' | 'deep' | 'fast';
export type ReasoningEffort = 'none' | 'low' | 'medium' | 'high';

type ModelChoice = { model: string; effort: ReasoningEffort };
type Env = Record<string, string | undefined>;

export const MODEL_DEFAULTS: Record<ModelTask, ModelChoice> = {
  // The replies people copy: natural, short writing.
  reply: { model: 'gpt-6.1-terra', effort: 'low' },
  // Reading conversation screenshots.
  vision: { model: 'gpt-6.1-terra', effort: 'low' },
  // Pro deep analysis and critic passes, where judgment matters more than latency.
  deep: { model: 'gpt-6.1-sol', effort: 'low' },
  // High-volume helpers: coach chat, decode, openers, revives, vibe check, tone, refine, strategy.
  fast: { model: 'gpt-6-luna', effort: 'none' },
};

const EFFORTS = new Set<ReasoningEffort>(['none', 'low', 'medium', 'high']);

// Reasoning tokens count against max_completion_tokens, so keep room for them on top of the visible answer.
const REASONING_HEADROOM: Record<ReasoningEffort, number> = { none: 0, low: 1000, medium: 3000, high: 8000 };

export function modelFor(task: ModelTask, env: Env = process.env): ModelChoice {
  const key = task.toUpperCase();
  const model = env[`OPENAI_MODEL_${key}`]?.trim() || MODEL_DEFAULTS[task].model;
  const effortOverride = env[`OPENAI_REASONING_${key}`]?.trim().toLowerCase() as ReasoningEffort | undefined;
  const effort = effortOverride && EFFORTS.has(effortOverride) ? effortOverride : MODEL_DEFAULTS[task].effort;
  return { model, effort };
}

export function isLegacyModel(model: string): boolean {
  return /^gpt-4/.test(model);
}

type ChatParams = ChatCompletionCreateParamsNonStreaming;

/**
 * Adapts Chat Completions params for the chosen model:
 * - GPT-6 rejects max_tokens; use max_completion_tokens with reasoning headroom.
 * - GPT-6 rejects custom temperature unless reasoning effort is "none".
 */
export function chatParams(task: ModelTask, params: Omit<ChatParams, 'model'>, env: Env = process.env): ChatParams {
  const { model, effort } = modelFor(task, env);
  if (isLegacyModel(model)) return { ...params, model };

  const { temperature, max_tokens, max_completion_tokens, ...rest } = params;
  const limit = max_completion_tokens ?? max_tokens;
  return {
    ...rest,
    model,
    // The installed SDK types predate "none"; the API accepts it for GPT-6 Luna/Terra.
    reasoning_effort: effort as ChatParams['reasoning_effort'],
    ...(effort === 'none' && temperature != null ? { temperature } : {}),
    ...(limit != null ? { max_completion_tokens: limit + REASONING_HEADROOM[effort] } : {}),
  };
}

/** Settings for @openai/agents Agent definitions. */
export function agentModel(task: ModelTask, env: Env = process.env) {
  const { model, effort } = modelFor(task, env);
  return isLegacyModel(model)
    ? { model }
    : { model, modelSettings: { reasoning: { effort } } };
}
