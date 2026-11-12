import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingShell from '@/components/MarketingShell';
import CultureVideo from '@/components/CultureVideo';
import { publishedDontSend } from '@/lib/culture-content';
import { SUPPORT_EMAIL } from '@/lib/contact';
import styles from '@/app/culture.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: "Don't Send That | Text Wingman",
  description: 'The paragraph you almost sent, why it might backfire, and a clearer way to say it.',
  alternates: { canonical: '/dont-send-that' },
};

export default function DontSendPage() {
  const entries = publishedDontSend();
  return <MarketingShell><main id="page-content" className={styles.wrap}>
    <header className={styles.hero}><div><p className={styles.eyebrow}>The Culture / Don&apos;t Send That</p><h1 className={styles.title}>DON&apos;T SEND<br /><em>THAT.</em></h1><p className={styles.intro}>Sometimes deleting the paragraph is the best decision you&apos;ll make. Here&apos;s a clearer place to start. These are fictional examples, not real messages.</p></div><CultureVideo src="/culture/tw-culture-3-dont-send-that.mp4" label="Watch the Don't Send That introduction" caption="A fictional example from the series." /></header>
    <section className={styles.section} aria-labelledby="drafts-heading"><div className={styles.sectionHead}><h2 id="drafts-heading">Before you hit send.</h2><p>Compare the draft with a calmer alternative. New entries arrive each week.</p></div><div className={styles.stack}>{entries.map((entry, index) => <article key={entry.id} className={`${styles.panel} ${styles.entry}`}><p className={styles.eyebrow}>Entry {String(index + 1).padStart(2, '0')}</p><h3>{entry.title}</h3><div className={styles.entryGrid}><div className={`${styles.textCard} ${styles.draft}`}><small>The draft</small><p>{entry.draft}</p></div><div className={styles.textCard}><small>Try this instead</small><p>{entry.instead}</p></div></div><p className={styles.why}><strong>Why pause?</strong> {entry.why}</p><div className={styles.actions}><Link className={styles.button} href={`/app?culture_origin=dont_send_${entry.id}&intent=rewrite`}>Work on your draft in Coach</Link></div></article>)}</div></section>
    <section className={styles.panel}><p className={styles.eyebrow}>A little gut check</p><h2 className={styles.dilemma}>Five signs you might want to pause.</h2><ol className={styles.signs}><li>It&apos;s after midnight and you&apos;re not feeling clear-headed.</li><li>It&apos;s much longer than the conversation you&apos;re replying to.</li><li>It starts with &ldquo;I just think it&apos;s funny how.&rdquo;</li><li>You&apos;ve rewritten the first line three times.</li><li>You&apos;re hoping it hurts more than it helps.</li></ol><p className={styles.line}>Type it. Feel it. Then take a breath before you send it.</p><div className={styles.actions}><Link className={styles.button} href="/app?culture_origin=dont_send_checklist&intent=rewrite">Work on your draft in Coach</Link><a className={styles.outline} href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Don't Send That submission")}`}>Email an anonymized draft</a></div><p className={styles.notice}>For submissions, please be 18 or older and remove names, contact details and other identifying information. Do not send screenshots or material involving minors, abuse, threats or self-harm. Your email app opens before anything is sent; we ask permission before sharing or adapting a real submission.</p></section>
  </main></MarketingShell>;
}
