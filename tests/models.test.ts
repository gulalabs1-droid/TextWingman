import assert from 'node:assert/strict';
import { test } from 'node:test';
import { agentModel, chatParams, MODEL_DEFAULTS, modelFor } from '../lib/models';

const messages = [{ role: 'user' as const, content: 'hi' }];

test('defaults use current GPT-6 models', () => {
  assert.deepEqual(modelFor('reply', {}), MODEL_DEFAULTS.reply);
  assert.equal(modelFor('fast', {}).model, 'gpt-6-luna');
  assert.equal(modelFor('deep', {}).model, 'gpt-6.1-sol');
});

test('environment overrides model and valid reasoning effort only', () => {
  assert.deepEqual(modelFor('reply', { OPENAI_MODEL_REPLY: 'gpt-6.1-sol', OPENAI_REASONING_REPLY: 'medium' }), { model: 'gpt-6.1-sol', effort: 'medium' });
  assert.equal(modelFor('reply', { OPENAI_REASONING_REPLY: 'turbo' }).effort, MODEL_DEFAULTS.reply.effort);
});

test('reasoning models drop custom temperature and replace max_tokens with headroom', () => {
  const params = chatParams('reply', { messages, temperature: 0.8, max_tokens: 400, response_format: { type: 'json_object' } }, {});
  assert.equal(params.model, 'gpt-6.1-terra');
  assert.equal('temperature' in params, false);
  assert.equal('max_tokens' in params, false);
  assert.equal(params.max_completion_tokens, 1400);
  assert.equal(params.reasoning_effort, 'low');
  assert.deepEqual(params.response_format, { type: 'json_object' });
});

test('no-reasoning tasks keep temperature and the original token budget', () => {
  const params = chatParams('fast', { messages, temperature: 0.7, max_tokens: 100 }, {});
  assert.equal(params.temperature, 0.7);
  assert.equal(params.max_completion_tokens, 100);
  assert.equal(params.reasoning_effort, 'none');
});

test('legacy override keeps the old parameter shape for rollback', () => {
  const params = chatParams('fast', { messages, temperature: 0.7, max_tokens: 100 }, { OPENAI_MODEL_FAST: 'gpt-4o-mini' });
  assert.equal(params.model, 'gpt-4o-mini');
  assert.equal(params.max_tokens, 100);
  assert.equal('reasoning_effort' in params, false);
  assert.deepEqual(agentModel('reply', { OPENAI_MODEL_REPLY: 'gpt-4o' }), { model: 'gpt-4o' });
  assert.deepEqual(agentModel('reply', {}), { model: 'gpt-6.1-terra', modelSettings: { reasoning: { effort: 'low' } } });
});
