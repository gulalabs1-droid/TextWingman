import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { COURT_CHOICES, COURT_POLL_ID, isCourtChoice, type CourtChoice, type CourtResults } from '@/lib/court';

export function courtVoterHash(token: string): string | null {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return createHash('sha256').update(token).digest('hex');
}

export async function readCourtResults(admin: SupabaseClient, voterHash: string | null): Promise<CourtResults> {
  const countRequests = COURT_CHOICES.map(choice => admin.from('wingman_court_votes')
    .select('choice', { count: 'exact', head: true })
    .eq('poll_id', COURT_POLL_ID)
    .eq('choice', choice.id));
  const selectedRequest = voterHash
    ? admin.from('wingman_court_votes').select('choice').eq('poll_id', COURT_POLL_ID).eq('voter_hash', voterHash).maybeSingle()
    : Promise.resolve({ data: null, error: null });
  const [countResults, selectedResult] = await Promise.all([Promise.all(countRequests), selectedRequest]);
  if (countResults.some(result => result.error || typeof result.count !== 'number') || selectedResult.error) {
    throw new Error('Unable to load Court votes');
  }
  const counts = Object.fromEntries(COURT_CHOICES.map((choice, index) => [choice.id, countResults[index].count ?? 0])) as Record<CourtChoice, number>;
  const selected = selectedResult.data?.choice;
  return {
    counts,
    total: counts.A + counts.B + counts.C,
    selected: isCourtChoice(selected) ? selected : null,
  };
}

export async function saveCourtVote(admin: SupabaseClient, voterHash: string, choice: CourtChoice): Promise<void> {
  const { error } = await admin.from('wingman_court_votes').upsert({
    poll_id: COURT_POLL_ID,
    voter_hash: voterHash,
    choice,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'poll_id,voter_hash' });
  if (error) throw new Error('Unable to save Court vote');
}
