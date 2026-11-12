import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingShell from '@/components/MarketingShell';
import CultureVideo from '@/components/CultureVideo';
import { SUPPORT_EMAIL } from '@/lib/contact';
import { publishedAfterDark } from '@/lib/culture-content';
import styles from '@/app/culture.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Wingman After Dark | Text Wingman',
  description: 'Fictional late-night texting dilemmas, thoughtful reads, and a message to make your own.',
  alternates: { canonical: '/after-dark' },
};

export default function AfterDarkPage() {
  const entries = publishedAfterDark();
  const updates = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Wingman After Dark updates')}`;
  const submit = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Wingman After Dark submission')}`;
  return <MarketingShell><main id="page-content" className={styles.wrap}>
    <header className={styles.hero}><div><p className={styles.eyebrow}>The Culture / Wingman After Dark</p><h1 className={styles.title}>THE GROUP CHAT,<br /><em>AFTER HOURS.</em></h1><p className={styles.intro}>A late-night advice show concept. Meet Wing, the AI host, through written fictional dilemmas while we prepare the show. There is no livestream or live chat yet.</p></div><CultureVideo src="/culture/tw-culture-2-wingman-after-dark.mp4" label="Watch the Wingman After Dark concept" caption="A dramatized, fictional example. Wing is an AI host." /></header>
    <section className={styles.panel}><p className={styles.eyebrow}>The format / Show concept</p><h2 className={styles.dilemma}>Confess. The read. The text.</h2><p className={styles.line}>Send an anonymized situation by email. If we select it and receive your permission, Wing, the AI host, can offer a thoughtful read and a draft to make your own. Submissions are reviewed manually; nothing is published automatically.</p></section>
    <section className={styles.section} aria-labelledby="after-dark-heading"><div className={styles.sectionHead}><h2 id="after-dark-heading">Tonight&apos;s read.</h2><p>Fictional examples, not real submissions. A new written dilemma arrives each week.</p></div><div className={styles.stack}>{entries.map(entry => <article key={entry.id} className={styles.panel}><p className={styles.eyebrow}>Fictional example / Wing, your AI host</p><h3 className={styles.dilemma}>{entry.title}</h3><p className={styles.dilemma}>&ldquo;{entry.dilemma}&rdquo;</p><p className={styles.line}><strong>The read</strong>{entry.read}</p><p className={styles.line}><strong>The question</strong>{entry.vote}</p><p className={styles.line}><strong>The text</strong>{entry.text}</p><p className={styles.line}><strong>Last call</strong>{entry.lastCall}</p><div className={styles.actions}><Link className={styles.button} href={`/?culture_origin=after_dark_${entry.id}#studio`}>Paste your own text</Link></div></article>)}</div></section>
    <section className={styles.panel} aria-labelledby="submit-heading"><p className={styles.eyebrow}>Bring a dilemma</p><h2 id="submit-heading" className={styles.dilemma}>Send it in. No names.</h2><p className={styles.line}>If you&apos;re 18 or older, you can email an anonymized situation for possible consideration. Remove names, contact details, places and identifying information yourself. Do not attach screenshots. We will ask permission before sharing or adapting a real submission.</p><div className={styles.actions}><a className={styles.button} href={submit}>Email a submission</a><a className={styles.outline} href={updates}>Request show updates by email</a></div><p className={styles.notice}>These links open your email app; nothing is sent until you send it. Requests are handled manually, not by an automatic waitlist. Please do not send material involving minors, abuse, threats, or self-harm. This is not a crisis, legal, medical, or mental-health service; if someone is in immediate danger, contact local emergency services.</p></section>
  </main></MarketingShell>;
}
