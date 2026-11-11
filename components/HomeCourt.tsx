'use client';

import { useEffect, useRef, useState } from 'react';
import { COURT_CHOICES, type CourtChoice, type CourtResults, votePercent } from '@/lib/court';
import styles from '@/app/homepage.module.css';

async function loadResults(): Promise<CourtResults> {
  const response = await fetch('/api/court', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Results unavailable');
  return response.json();
}

export default function HomeCourt() {
  const [results, setResults] = useState<CourtResults | null>(null);
  const [selected, setSelected] = useState<CourtChoice | null>(null);
  const [pending, setPending] = useState<CourtChoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const voting = useRef(false);
  const revision = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const refresh = async () => {
      if (voting.current) return;
      const current = ++revision.current;
      try {
        const data = await loadResults();
        if (!mounted.current || current !== revision.current) return;
        setResults(data);
        setSelected(data.selected);
        setError(null);
      } catch {
        if (mounted.current && current === revision.current) {
          setResults(null);
          setError('Voting is temporarily unavailable. Please try again soon.');
        }
      }
    };
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 30000);
    return () => {
      mounted.current = false;
      revision.current += 1;
      window.clearInterval(timer);
    };
  }, []);

  const submitVote = async (choice: CourtChoice) => {
    if (voting.current) return;
    voting.current = true;
    const current = ++revision.current;
    setPending(choice);
    setError(null);
    try {
      const response = await fetch('/api/court', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice }),
      });
      const saved = response.ok ? await response.json() : null;
      if (!saved || saved.saved !== true || saved.selected !== choice) throw new Error('Vote not saved');
      if (!mounted.current || current !== revision.current) return;
      setSelected(choice);
      try {
        const data = await loadResults();
        if (mounted.current && current === revision.current) {
          setResults(data);
          if (data.selected !== choice) {
            setError('Your vote was saved. Enable cookies to remember or change your pick.');
          }
        }
      } catch {
        if (mounted.current && current === revision.current) {
          setResults(null);
          setError('Your vote was saved, but results are temporarily unavailable.');
        }
      }
    } catch {
      if (mounted.current && current === revision.current) setError('Your vote could not be saved. Please try again.');
    } finally {
      voting.current = false;
      if (mounted.current && current === revision.current) setPending(null);
    }
  };

  const total = results?.total ?? 0;
  return <div className={styles.poll} id="court-poll">
    <div><p className={styles.eyebrow}>WINGMAN COURT / COMMUNITY VOTE</p><h3>They hit you with “lol”.<br />What are you sending back?</h3><p className={styles.pollNote}>Pick your move and see what the community thinks. One vote per browser when cookies are enabled; you can change your pick.</p></div>
    <div><div className={styles.voteOptions} role="group" aria-label="Choose a reply">
      {COURT_CHOICES.map(choice => <button key={choice.id} type="button" aria-pressed={selected === choice.id} disabled={!results || pending !== null} className={`${styles.vote} ${selected === choice.id ? styles.voteSelected : ''}`} onClick={() => void submitVote(choice.id)}>
        <strong>{choice.id}</strong><span className={styles.voteText}>{choice.text}</span>{results && total > 0 && <span className={styles.voteCount}>{results.counts[choice.id]} · {votePercent(results.counts[choice.id], total)}%</span>}
      </button>)}
    </div><p className={styles.pollFeedback} aria-live="polite">{error || (pending ? 'Saving your vote...' : !results ? 'Loading votes...' : selected ? `Vote saved. ${total} ${total === 1 ? 'vote' : 'votes'} so far.` : total ? `${total} ${total === 1 ? 'vote' : 'votes'} so far. Pick your move.` : 'Be the first to vote.')}</p></div>
  </div>;
}
