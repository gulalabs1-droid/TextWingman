'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CourtResults } from '@/lib/court';
import { votePercent } from '@/lib/court';
import type { CourtCase } from '@/lib/culture-content';
import { track } from '@/lib/analytics';
import styles from '@/app/culture.module.css';

type Choice = 'A' | 'B';

export default function CultureCourt({ cases, initialCase }: { cases: CourtCase[]; initialCase?: string }) {
  const [index, setIndex] = useState(() => Math.max(0, cases.findIndex(item => item.id === initialCase)));
  const [results, setResults] = useState<CourtResults | null>(null);
  const [selected, setSelected] = useState<Choice | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const current = cases[index];

  useEffect(() => {
    let active = true;
    fetch(`/api/court?poll=${encodeURIComponent(current.id)}`, { cache: 'no-store', signal: AbortSignal.timeout(10000) })
      .then(response => { if (!response.ok) throw new Error('unavailable'); return response.json(); })
      .then((data: CourtResults) => { if (active) { setResults(data); setSelected(data.selected === 'A' || data.selected === 'B' ? data.selected : null); } })
      .catch(() => { if (active) setMessage('Voting is temporarily unavailable. Please try again.'); });
    return () => { active = false; };
  }, [current.id]);

  function move(next: number) {
    setResults(null);
    setSelected(null);
    setMessage('');
    setIndex(next);
  }

  async function vote(choice: Choice) {
    if (pending || !results) return;
    setPending(true);
    setMessage('Saving your vote...');
    try {
      const response = await fetch('/api/court', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pollId: current.id, choice }) });
      const saved = response.ok ? await response.json() : null;
      if (!saved?.saved || saved.selected !== choice) throw new Error('not saved');
      setSelected(choice);
      track('court_vote_saved', { case_id: current.id, choice });
      try {
        const updated = await fetch(`/api/court?poll=${encodeURIComponent(current.id)}`, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
        if (!updated.ok) throw new Error('results unavailable');
        const data: CourtResults = await updated.json();
        setResults(data);
        setMessage(data.selected === choice ? 'Your vote is saved.' : 'Vote saved. Enable cookies to remember or change your pick.');
      } catch {
        setResults(null);
        setMessage('Your vote was saved, but results are temporarily unavailable.');
      }
    } catch {
      setMessage('We could not confirm your vote. Please try again.');
    } finally {
      setPending(false);
    }
  }

  async function share() {
    const url = `${window.location.origin}/court?case=${encodeURIComponent(current.id)}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Wingman Court', text: 'I ruled on this one. What would you send?', url });
      else { await navigator.clipboard.writeText(url); setMessage('Case link copied.'); }
    } catch { setMessage('The case was not shared. Please try again.'); }
  }

  const total = results?.total ?? 0;
  return <div className={styles.panel}>
    <div className={styles.caseMeta}><span>Case {String(index + 1).padStart(2, '0')} / {current.docket}</span><span>{index + 1} of {cases.length}</span></div>
    <p className={styles.setup}>{current.setup}</p><p className={styles.message}>{current.message}</p>
    <div className={styles.choices} role="group" aria-label="Choose your reply">
      {(['A', 'B'] as const).map(choice => <button key={choice} type="button" className={`${styles.choice} ${selected === choice ? styles.chosen : ''}`} disabled={!results || pending} aria-pressed={selected === choice} onClick={() => void vote(choice)}><strong>{choice}</strong><span>{choice === 'A' ? current.a : current.b}</span></button>)}
    </div>
    <p className={styles.feedback} aria-live="polite">{message || (!results ? 'Loading the case...' : selected ? 'Your vote is saved.' : 'One vote per browser when cookies are enabled. You can change your pick.')}</p>
    {selected && <div className={styles.ruling}><h3>The ruling / Text Wingman&apos;s take</h3><p>{current.ruling}</p>{results && total > 0 && <p><small>Community results: A {results.counts.A} ({votePercent(results.counts.A, total)}%) · B {results.counts.B} ({votePercent(results.counts.B, total)}%) · {total} {total === 1 ? 'vote' : 'votes'}</small></p>}</div>}
    <div className={styles.actions}><button className={styles.outline} disabled={index === 0 || pending} onClick={() => move(index - 1)}>Previous case</button><button className={styles.outline} disabled={index >= cases.length - 1 || pending} onClick={() => move(index + 1)}>Next case</button><button className={styles.outline} onClick={() => void share()}>Share this case</button></div>
    <div className={styles.actions}><Link className={styles.button} href={`/?culture_origin=court_${current.id}&case=${encodeURIComponent(current.id)}#studio`}>Try this example</Link><Link className={styles.outline} href={`/?culture_origin=court_${current.id}#studio`}>Got your own case? Paste it</Link></div>
  </div>;
}
