import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { COURT_POLL_ID, isCourtChoice, votePercent, type CourtChoice } from '../lib/court';
import { courtVoterHash, readCourtResults, saveCourtVote } from '../lib/court-server';

type Ballot = { poll_id: string; voter_hash: string; choice: CourtChoice };

function makeDatabase() {
  const ballots = new Map<string, Ballot>();
  const failures = { read: false, write: false };
  const admin = {
    from(table: string) {
      assert.equal(table, 'wingman_court_votes');
      return {
        select(_columns: string, options?: { head?: boolean }) {
          const filters: Record<string, string> = {};
          const matches = () => [...ballots.values()].filter(row =>
            Object.entries(filters).every(([key, value]) => row[key as keyof Ballot] === value));
          const query = {
            eq(column: string, value: string) {
              filters[column] = value;
              return query;
            },
            maybeSingle() {
              return Promise.resolve({ data: matches()[0] ?? null, error: failures.read ? new Error('read failed') : null });
            },
            then(resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) {
              assert.equal(options?.head, true);
              return Promise.resolve({ count: failures.read ? null : matches().length, error: failures.read ? new Error('read failed') : null }).then(resolve, reject);
            },
          };
          return query;
        },
        upsert(row: Ballot, options: { onConflict: string }) {
          assert.equal(options.onConflict, 'poll_id,voter_hash');
          if (failures.write) return Promise.resolve({ error: new Error('write failed') });
          ballots.set(`${row.poll_id}:${row.voter_hash}`, row);
          return Promise.resolve({ error: null });
        },
      };
    },
  } as unknown as SupabaseClient;
  return { admin, ballots, failures };
}

test('Court accepts only the listed choices and uses real percentages', () => {
  assert.deepEqual(['A', 'B', 'C', 'D', '', null, 1].map(isCourtChoice), [true, true, true, false, false, false, false]);
  assert.equal(votePercent(0, 0), 0);
  assert.equal(votePercent(1, 3), 33);
  assert.equal(votePercent(2, 3), 67);
});

test('voter identifiers are random-token hashes, never the token itself', () => {
  const token = 'a'.repeat(64);
  const hash = courtVoterHash(token);
  assert.match(hash ?? '', /^[a-f0-9]{64}$/);
  assert.notEqual(hash, token);
  assert.equal(courtVoterHash(token), hash);
  assert.equal(courtVoterHash('a'.repeat(63)), null);
  assert.equal(courtVoterHash('z'.repeat(64)), null);
});

test('Court records real totals and lets a browser change its vote without another ballot', async () => {
  const { admin, ballots } = makeDatabase();
  const first = courtVoterHash('a'.repeat(64))!;
  const second = courtVoterHash('b'.repeat(64))!;
  assert.deepEqual(await readCourtResults(admin, null), { counts: { A: 0, B: 0, C: 0 }, total: 0, selected: null });

  await saveCourtVote(admin, first, 'A');
  assert.deepEqual(await readCourtResults(admin, first), { counts: { A: 1, B: 0, C: 0 }, total: 1, selected: 'A' });
  await saveCourtVote(admin, first, 'B');
  assert.deepEqual(await readCourtResults(admin, first), { counts: { A: 0, B: 1, C: 0 }, total: 1, selected: 'B' });
  await saveCourtVote(admin, second, 'C');
  assert.deepEqual(await readCourtResults(admin, second), { counts: { A: 0, B: 1, C: 1 }, total: 2, selected: 'C' });
  assert.equal(ballots.size, 2);
  assert.equal([...ballots.values()][0].poll_id, COURT_POLL_ID);
});

test('database failures are surfaced instead of inventing votes or claiming a save', async () => {
  const { admin, failures } = makeDatabase();
  failures.read = true;
  await assert.rejects(readCourtResults(admin, null), /Unable to load/);
  failures.read = false;
  failures.write = true;
  await assert.rejects(saveCourtVote(admin, 'c'.repeat(64), 'A'), /Unable to save/);
});
