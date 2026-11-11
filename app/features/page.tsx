import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BookmarkCheck, Camera, MessageCircle, Pencil, ShieldCheck, Sparkles } from 'lucide-react';
import MarketingShell from '@/components/MarketingShell';
import { PLAN_PRICES } from '@/lib/pricing';
import { FREE_REPLY_LIMIT, REPLY_USAGE_WINDOW_HOURS } from '@/lib/usage-limits';
import styles from '@/app/info.module.css';

export const metadata: Metadata = {
  title: 'Features | Text Wingman',
  description: 'Explore reply suggestions, screenshot upload, saved conversations, and Wingman Court voting.',
  alternates: { canonical: '/features' },
};

const features = [
  { icon: MessageCircle, title: 'Three ways to reply.', text: 'Paste the message and compare three reply drafts. Pick the one that fits, or change it to sound more like you.' },
  { icon: Camera, title: 'Start with a screenshot.', text: 'Upload a conversation screenshot and review the extracted text before deciding what to send. For your privacy, remove names and sensitive details first.' },
  { icon: Sparkles, title: 'Bring the context.', text: 'Choose whether you are replying to someone you are dating, a friend, or a work contact. More context can make the suggestions more useful.' },
  { icon: Pencil, title: 'Make it yours.', text: 'Edit a draft, copy it, and send it yourself. Text Wingman does not connect to your inbox or send messages on your behalf.' },
  { icon: BookmarkCheck, title: 'Keep the conversation.', text: 'Create a free account to save a conversation and return to it later in the full coach.' },
  { icon: ShieldCheck, title: 'You make the call.', text: 'Suggestions are starting points, not mind-reading or guarantees. Use your judgment and choose the words that feel right.' },
];

export default function FeaturesPage() {
  return <MarketingShell><main className={styles.main} id="page-content"><div className={styles.content}>
    <div className={styles.hero}><p className={styles.eyebrow}>THE TOOL / BUILT FOR REAL CONVERSATIONS</p><h1 className={styles.title}>A LITTLE LESS<br /><em>OVERTHINKING.</em></h1><p className={styles.intro}>From the text that caught you off guard to the conversation you want to keep going. Text Wingman helps you find a reply you actually want to send.</p><div className={styles.heroActions}><Link className={styles.button} href="/#studio">Try the reply studio <ArrowUpRight size={16} /></Link><Link className={`${styles.button} ${styles.buttonOutline}`} href="/pricing">Explore Pro <ArrowRight size={16} /></Link></div></div>
    <section className={styles.section} aria-labelledby="features-heading"><div className={styles.sectionHeader}><div><p className={styles.eyebrow}>01 / YOUR WINGMAN</p><h2 id="features-heading">A better starting point.</h2></div><p>Try {FREE_REPLY_LIMIT} free uses per {REPLY_USAGE_WINDOW_HOURS} hours, shared between reply generations and coach messages. Each generation gives you three reply options.</p></div><div className={styles.featureGrid}>{features.map(feature => <article className={styles.card} key={feature.title}><div className={styles.cardIcon}><feature.icon size={21} /></div><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div></section>
    <section className={`${styles.card} ${styles.courtPromo}`} aria-labelledby="court-heading"><div><p className={styles.eyebrow}>02 / WINGMAN COURT</p><h2 id="court-heading">You be the judge.</h2><p>Pick the reply you would send and see how the community voted. Your choice is saved, and you can change it on the same browser when cookies are enabled.</p></div><Link className={styles.button} href="/#court-poll">Vote in Wingman Court <ArrowRight size={16} /></Link></section>
    <section className={styles.callout} aria-labelledby="pro-heading"><div><p className={styles.eyebrow} style={{ color: '#405f29' }}>03 / WHEN YOU NEED MORE</p><h2 id="pro-heading">More conversations. More context.</h2><p>Pro includes unlimited replies and additional coaching tools. Monthly is {PLAN_PRICES.monthly.displayAmount}/month; annual is {PLAN_PRICES.annual.displayAmount}/year. Review plan and trial terms before confirming.</p></div><Link className={styles.button} href="/pricing">See Pro plans <ArrowRight size={16} /></Link></section>
  </div></main></MarketingShell>;
}
