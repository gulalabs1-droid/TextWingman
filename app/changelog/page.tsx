import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import MarketingShell from '@/components/MarketingShell';
import { CHANGELOG, CURRENT_VERSION, TYPE_CONFIG } from '@/lib/changelog';
import styles from '@/app/info.module.css';

export const metadata: Metadata = {
  title: "What's New | Text Wingman",
  description: 'Explore Text Wingman release notes, improvements, and fixes.',
  alternates: { canonical: '/changelog' },
};

export default function ChangelogPage() {
  return <MarketingShell><main className={styles.main} id="page-content"><div className={`${styles.content} ${styles.narrow}`}>
    <header className={styles.hero}><p className={styles.eyebrow}>THE RELEASE NOTES / V{CURRENT_VERSION}</p><h1 className={styles.title}>THE STORY<br /><em>SO FAR.</em></h1><p className={styles.intro}>New tools, thoughtful improvements, and fixes that make Text Wingman a little better to use.</p><div className={styles.heroActions}><Link className={`${styles.button} ${styles.buttonOutline}`} href="/dashboard">Your dashboard <ArrowRight size={16} /></Link></div></header>
    <section aria-labelledby="releases-heading"><div className={styles.sectionHeader}><div><p className={styles.eyebrow}>WHAT&apos;S NEW / RELEASE HISTORY</p><h2 id="releases-heading">The latest moves.</h2></div><p>Product updates and milestones, newest first.</p></div><div className={styles.timeline}>{CHANGELOG.map((entry, index) => {
      const date = new Date(`${entry.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return <article className={styles.release} key={entry.version}><div className={styles.releaseMeta}><strong>v{entry.version}</strong><span>•</span><time dateTime={entry.date}>{date}</time><span className={styles.releaseTag}>{TYPE_CONFIG[entry.type].label}</span>{index === 0 && <span className={styles.releaseTag}>Latest</span>}</div><h2>{entry.title}</h2><p>{entry.description}</p><ul>{entry.highlights.map((item, i) => <li key={i}><Check size={15} /><span>{item}</span></li>)}</ul></article>;
    })}</div></section>
    <section className={styles.callout}><div><p className={styles.eyebrow} style={{ color: '#405f29' }}>YOUR TURN</p><h2>Put the wingman to work.</h2><p>Start with a message and make your next reply your own.</p></div><Link className={styles.button} href="/#studio">Try it free <ArrowRight size={16} /></Link></section>
  </div></main></MarketingShell>;
}
