import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { CHANGELOG } from '../lib/changelog';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

test('public plan wording uses the shared free allowance and rolling-window constants', () => {
  for (const path of ['app/page.tsx', 'app/features/page.tsx', 'app/login/page.tsx', 'app/pricing/page.tsx', 'app/share/[slug]/page.tsx']) {
    const contents = source(path);
    assert.match(contents, /FREE_REPLY_LIMIT/, path);
    assert.match(contents, /REPLY_USAGE_WINDOW_HOURS/, path);
    assert.doesNotMatch(contents, /\b(?:5|five)\s+(?:free\s+)?(?:replies|uses|messages)\b/i, path);
  }
});

test('Court is described as a real community vote and linked from the features page', () => {
  const homepage = source('app/page.tsx');
  const court = source('components/HomeCourt.tsx');
  const features = source('app/features/page.tsx');
  assert.match(homepage, /COMMUNITY VOTE/);
  assert.match(court, /COMMUNITY VOTE/);
  assert.match(features, /href="\/court"/);
  assert.doesNotMatch(`${homepage}\n${court}`, /local preview|not a live audience vote|preview is not recorded/i);
  assert.match(CHANGELOG[0].title, /Culture/);
});
