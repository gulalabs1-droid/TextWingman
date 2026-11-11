import assert from 'node:assert/strict';
import { createServer, type IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';
import { NextRequest } from 'next/server';
import { GET, POST } from '../app/api/court/route';

type Ballot = { poll_id: string; voter_hash: string; choice: string };

async function bodyOf(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

test('Court endpoint saves, changes and reads votes while rejecting invalid requests', async () => {
  const ballots = new Map<string, Ballot>();
  const database = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (url.pathname !== '/rest/v1/wingman_court_votes') {
      response.writeHead(404).end();
      return;
    }
    if (request.method === 'POST') {
      const ballot = JSON.parse(await bodyOf(request)) as Ballot;
      ballots.set(`${ballot.poll_id}:${ballot.voter_hash}`, ballot);
      response.writeHead(201).end();
      return;
    }
    const matches = [...ballots.values()].filter(ballot => ['poll_id', 'voter_hash', 'choice'].every(key => {
      const filter = url.searchParams.get(key);
      return !filter || filter === `eq.${ballot[key as keyof Ballot]}`;
    }));
    response.setHeader('Content-Type', 'application/json');
    if (request.method === 'HEAD') {
      response.setHeader('Content-Range', `*/${matches.length}`);
      response.writeHead(200).end();
    } else {
      response.writeHead(200).end(JSON.stringify(matches.map(({ choice }) => ({ choice }))));
    }
  });
  await new Promise<void>(resolve => database.listen(0, '127.0.0.1', resolve));
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${(database.address() as AddressInfo).port}`;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-key';

  const request = (choice: string, cookie?: string, origin = 'https://textwingman.app') => new NextRequest('https://textwingman.app/api/court', {
    method: 'POST', headers: { 'content-type': 'application/json', origin, ...(cookie ? { cookie } : {}) }, body: JSON.stringify({ choice }),
  });
  try {
    assert.equal((await POST(request('D'))).status, 400);
    assert.equal((await POST(request('A', undefined, 'https://example.org'))).status, 403);
    assert.equal(ballots.size, 0);
    const first = await POST(request('A'));
    assert.equal(first.status, 200);
    const token = first.cookies.get('tw_court_voter')?.value;
    assert.match(token ?? '', /^[a-f0-9]{64}$/);
    assert.equal(first.cookies.get('tw_court_voter')?.httpOnly, true);
    const cookie = `tw_court_voter=${token}`;
    const current = () => GET(new NextRequest('https://textwingman.app/api/court', { headers: { cookie } }));
    assert.deepEqual(await (await current()).json(), { counts: { A: 1, B: 0, C: 0 }, total: 1, selected: 'A' });
    assert.equal((await POST(request('C', cookie))).status, 200);
    assert.deepEqual(await (await current()).json(), { counts: { A: 0, B: 0, C: 1 }, total: 1, selected: 'C' });
    assert.equal(ballots.size, 1);
    assert.notEqual([...ballots.values()][0].voter_hash, token);
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
    await new Promise<void>((resolve, reject) => database.close(error => error ? reject(error) : resolve()));
  }
});
