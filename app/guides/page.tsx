import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import MarketingShell from '@/components/MarketingShell';
import { SEO_GUIDES } from '@/lib/seo-guides';
import styles from '@/app/info.module.css';

export const metadata: Metadata = {
  title: 'Texting Guides — What to Say in Every Situation | Text Wingman',
  description: 'Free texting guides for every situation — how to reply to "wyd", what to do when left on read, flirting tips, first messages, and more.',
  keywords: ['texting guide', 'what to text', 'how to reply', 'texting tips', 'texting advice'],
  alternates: { canonical: '/guides' },
  openGraph: { title: 'Texting Guides — What to Say in Every Situation', description: 'Free texting guides with examples and ideas for what to say next.', type: 'website' },
};

export default function GuidesIndex() {
  return <MarketingShell><main className={styles.main} id="page-content"><div className={styles.content}>
    <div className={styles.hero}><p className={styles.eyebrow}>THE FIELD NOTES / TEXTING GUIDES</p><h1 className={styles.title}>FOR THE TEXTS<br /><em>THAT STOP YOU.</em></h1><p className={styles.intro}>Left on read? Stuck on an opener? Find a situation that sounds familiar and get a little perspective before you reply.</p></div>
    <section className={styles.section} aria-labelledby="guides-heading"><div className={styles.sectionHeader}><div><p className={styles.eyebrow}>01 / EXPLORE THE GUIDES</p><h2 id="guides-heading">Find your situation.</h2></div><p>Examples to get you thinking, not rules for every conversation.</p></div><div className={styles.guideGrid}>{SEO_GUIDES.map((guide, index) => <Link className={styles.card} key={guide.slug} href={`/guides/${guide.slug}`}><div className={styles.cardMeta}><span>FIELD NOTE / {String(index + 1).padStart(2, '0')}</span><span aria-hidden="true">{guide.heroEmoji}</span></div><h3>{guide.title}</h3><p>{guide.metaDescription}</p><span className={styles.cardLink}>Read guide <ArrowUpRight size={15} /></span></Link>)}</div></section>
    <section className={styles.callout}><div><p className={styles.eyebrow} style={{ color: '#405f29' }}>02 / MAKE IT PERSONAL</p><h2>Got a text of your own?</h2><p>Paste the message or upload a screenshot to get three reply ideas for your situation. No account or card to start.</p></div><Link className={styles.button} href="/tiktok?utm_source=seo&utm_medium=organic_search&utm_campaign=guides&utm_content=guides_index">Try it free <ArrowRight size={16} /></Link></section>
  </div></main></MarketingShell>;
}
