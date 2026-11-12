import type { Metadata } from 'next';
import MarketingShell from '@/components/MarketingShell';
import CultureCourt from '@/components/CultureCourt';
import CultureVideo from '@/components/CultureVideo';
import { publishedCourtCases } from '@/lib/culture-content';
import { SUPPORT_EMAIL } from '@/lib/contact';
import styles from '@/app/culture.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Wingman Court | Text Wingman',
  description: 'One text. Two replies. Vote on the move and see how the community ruled.',
  alternates: { canonical: '/court' },
};

export default async function CourtPage({ searchParams }: { searchParams: Promise<{ case?: string }> }) {
  const params = await searchParams;
  const cases = publishedCourtCases();
  return <MarketingShell><main id="page-content" className={styles.wrap}>
    <header className={styles.hero}><div><p className={styles.eyebrow}>The Culture / Wingman Court</p><h1 className={styles.title}>WAS THAT TEXT<br /><em>A W OR AN L?</em></h1><p className={styles.intro}>One text. Two replies. You&apos;re the jury. Vote, then see the community results and our take. New cases arrive each week.</p><div className={styles.actions}><a className={styles.button} href="#docket-heading">Vote on a case</a></div></div><div className={styles.courtHeroVideo}><CultureVideo src="/culture/tw-culture-1-wingman-court.mp4" label="Watch the Wingman Court introduction" caption="A fictional case from the Wingman Court series." /></div></header>
    <section className={styles.section} aria-labelledby="docket-heading"><div className={styles.sectionHead}><h2 id="docket-heading">The docket.</h2><p>These situations are fictional examples, not submissions from real people. No account is needed to vote.</p></div><CultureCourt cases={cases} initialCase={params.case} /></section>
    <div className={styles.courtMobileVideo}><CultureVideo src="/culture/tw-culture-1-wingman-court.mp4" label="Watch the Wingman Court introduction" caption="A fictional case from the Wingman Court series." /></div>
    <section className={styles.panel} aria-labelledby="bring-case"><p className={styles.eyebrow}>Bring a case</p><h2 id="bring-case" className={styles.dilemma}>Got a text you can&apos;t answer?</h2><p className={styles.line}>If you&apos;re 18 or older, email an anonymized situation for consideration. Remove names, places and identifying details yourself; please do not send screenshots. We&apos;ll ask permission before sharing or adapting a real submission.</p><div className={styles.actions}><a className={styles.outline} href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Wingman Court submission')}`}>Email a case</a></div><p className={styles.notice}>Your email app opens first; nothing is sent until you send it. Please do not send material involving minors, abuse, threats or self-harm.</p></section>
  </main></MarketingShell>;
}
