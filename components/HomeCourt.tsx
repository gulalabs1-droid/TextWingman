'use client';

import { useState } from 'react';
import styles from '@/app/homepage.module.css';

const choices = [
  { id: 'A', text: '“what’s funny?”' },
  { id: 'B', text: '“you got me laughing too”' },
  { id: 'C', text: 'Nothing. Let it breathe.' },
];

export default function HomeCourt() {
  const [selected, setSelected] = useState<string | null>(null);
  return <div className={styles.poll} id="court-poll">
    <div><p className={styles.eyebrow}>WINGMAN COURT / INTERACTIVE PREVIEW</p><h3>They hit you with “lol”.<br />What are you sending back?</h3><p className={styles.pollNote}>Pick your move. This is a local preview, not a live audience vote.</p></div>
    <div><div className={styles.voteOptions} role="group" aria-label="Choose a reply">
      {choices.map(choice => <button key={choice.id} type="button" aria-pressed={selected === choice.id} className={`${styles.vote} ${selected === choice.id ? styles.voteSelected : ''}`} onClick={() => setSelected(choice.id)}><strong>{choice.id}</strong>{choice.text}</button>)}
    </div><p className={styles.pollFeedback} aria-live="polite">{selected ? `You picked ${selected}. This preview is not recorded or shared.` : 'Pick the move you would make.'}</p></div>
  </div>;
}
