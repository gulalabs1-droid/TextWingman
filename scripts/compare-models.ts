// Side-by-side reply quality and latency using the production reply prompt.
// Usage: npx tsx --env-file=.env.local scripts/compare-models.ts [model ...]
// Default compares the retiring model with the GPT-6 candidates. Costs a few cents per run.
const SAMPLES: Array<{ context: string; message: string }> = [
  { context: 'crush', message: "haha maybe, depends who's asking" },
  { context: 'crush', message: 'lol' },
  { context: 'crush', message: "i'm kinda busy this week tbh" },
  { context: 'newmatch', message: 'so what do you do for fun?' },
  { context: 'crush', message: 'we need to talk' },
  { context: 'ex', message: 'hey, been thinking about you' },
  { context: 'friend', message: 'are you still mad about saturday' },
  { context: 'work', message: 'can you get me the deck by EOD?' },
];

async function main() {
  const models = process.argv.slice(2).length ? process.argv.slice(2) : ['gpt-4o-mini', 'gpt-6-luna', 'gpt-6.1-terra'];
  const { generateReplies } = await import('../lib/openai');
  const totals: Record<string, { ms: number; ok: number }> = {};

  for (const sample of SAMPLES) {
    console.log(`\n=== [${sample.context}] "${sample.message}"`);
    for (const model of models) {
      process.env.OPENAI_MODEL_REPLY = model;
      const started = Date.now();
      try {
        const replies = await generateReplies(sample.message, sample.context);
        const ms = Date.now() - started;
        totals[model] = { ms: (totals[model]?.ms || 0) + ms, ok: (totals[model]?.ok || 0) + 1 };
        console.log(`  ${model.padEnd(14)} ${String(ms).padStart(5)}ms  ${replies.map(r => `${r.tone}: ${r.text}`).join('  |  ')}`);
      } catch (error) {
        console.log(`  ${model.padEnd(14)} FAILED  ${error instanceof Error ? error.message : error}`);
      }
    }
  }

  console.log('\n=== Average latency');
  for (const model of models) {
    const t = totals[model];
    console.log(`  ${model.padEnd(14)} ${t ? `${Math.round(t.ms / t.ok)}ms over ${t.ok}/${SAMPLES.length}` : 'no successful runs'}`);
  }
}

void main();
