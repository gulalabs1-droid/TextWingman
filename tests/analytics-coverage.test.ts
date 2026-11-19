import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { isAllowedEventName } from '../lib/analytics-events';

// /api/track rejects names it doesn't know, so an event the app sends but the
// allowlist lacks is silently lost. This catches that at test time.
const ROOT = join(__dirname, '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'node_modules' ? [] : sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

test('every event the app tracks is accepted by the analytics endpoint', () => {
  const missing = new Set<string>();
  for (const file of ['app', 'components', 'lib'].flatMap(dir => sourceFiles(join(ROOT, dir)))) {
    for (const match of readFileSync(file, 'utf8').matchAll(/\btrack\(\s*['"]([a-z0-9_]+)['"]/g)) {
      if (!isAllowedEventName(match[1])) missing.add(`${match[1]} (${file.slice(ROOT.length + 1)})`);
    }
  }
  assert.deepEqual([...missing], []);
});
