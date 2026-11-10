import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import MarketingShell from '@/components/MarketingShell';
import { SEO_GUIDES, getGuideBySlug } from '@/lib/seo-guides';
import styles from '@/app/info.module.css';

export async function generateStaticParams() {
  return SEO_GUIDES.map(guide => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return { title: 'Guide Not Found' };
  return {
    title: guide.metaTitle, description: guide.metaDescription, keywords: guide.keywords,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: { title: guide.metaTitle, description: guide.metaDescription, type: 'article' },
    twitter: { card: 'summary_large_image', title: guide.metaTitle, description: guide.metaDescription },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Article', headline: guide.metaTitle, description: guide.metaDescription, keywords: guide.keywords.join(', '), author: { '@type': 'Organization', name: 'Text Wingman' } };
  const tryUrl = `/tiktok?utm_source=seo&utm_medium=organic_search&utm_campaign=guides&utm_content=${guide.slug}`;

  return <MarketingShell hasMobileCta><main className={styles.main} id="page-content"><div className={`${styles.content} ${styles.narrow} ${styles.withMobileCta}`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/guides">Guides</Link><span>/</span><span aria-current="page">{guide.title}</span></nav>
    <article className={styles.articleBody}><header className={styles.articleHero}><p className={styles.eyebrow}>FIELD NOTES / TEXTING GUIDE <span aria-hidden="true">{guide.heroEmoji}</span></p><h1 className={`${styles.title} ${styles.articleTitle}`}>{guide.title}</h1><p className={styles.intro}>{guide.situation}</p></header>
      <section className={styles.articleSection}><h2>They sent</h2><div className={styles.messageBubble}>“{guide.theirMessage}”</div></section>
      <section className={styles.articleSection}><h2>One reply to reconsider</h2><div className={`${styles.replyCard} ${styles.badReply}`}><p>“{guide.badReply}”</p><p>{guide.badWhy}</p></div></section>
      <section className={styles.articleSection}><h2>A few other ways to respond</h2><div className={styles.replyList}>{guide.goodReplies.map((reply, i) => <div className={styles.replyCard} key={i}><small>{reply.tone}</small><p>“{reply.text}”</p><p>{reply.why}</p></div>)}</div></section>
      <section className={styles.articleSection}><h2>A little perspective</h2><ol className={styles.tips}>{guide.tips.map((tip, i) => <li key={i}>{tip}</li>)}</ol></section>
      <section className={styles.callout}><div><p className={styles.eyebrow} style={{ color: '#405f29' }}>MAKE IT PERSONAL</p><h2>What did they send you?</h2><p>Paste a message or upload a screenshot to get three reply ideas for your conversation. No account or card to start.</p></div><Link className={styles.button} href={tryUrl}>Try it free <ArrowRight size={16} /></Link></section>
      <section className={styles.related}><p className={styles.eyebrow}>KEEP READING</p><h2>More texting guides.</h2><div className={styles.relatedGrid}>{SEO_GUIDES.filter(item => item.slug !== guide.slug).slice(0, 4).map(item => <Link key={item.slug} href={`/guides/${item.slug}`}>{item.heroEmoji} &nbsp;{item.title} <ArrowUpRight size={14} style={{ display: 'inline' }} /></Link>)}</div></section>
    </article>
  </div></main><div className={styles.mobileCta}><Link className={styles.button} href={tryUrl}>Get AI replies free <ArrowRight size={16} /></Link></div></MarketingShell>;
}
