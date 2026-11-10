import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Mail, MessageCircle } from 'lucide-react';
import MarketingShell from '@/components/MarketingShell';
import { SUPPORT_EMAIL } from '@/lib/contact';
import styles from '@/app/info.module.css';

export const metadata: Metadata = {
  title: 'Contact | Text Wingman',
  description: 'Contact Text Wingman with questions about your account, billing, or the app.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return <MarketingShell><main className={styles.main} id="page-content"><div className={`${styles.content} ${styles.narrow}`}>
    <header className={styles.hero}><p className={styles.eyebrow}>CONTACT / GET IN TOUCH</p><h1 className={styles.title}>LET&apos;S <em>TALK.</em></h1><p className={styles.intro}>Questions, feedback, or something not working? Get in touch with the Text Wingman team.</p></header>
    <div className={styles.contactGrid}>
      <section className={styles.contactCard}><div className={styles.cardIcon}><Mail size={21} /></div><p className={styles.eyebrow}>01 / EMAIL</p><h2>Drop us a line.</h2><p>For questions about your account, billing, or how to use Text Wingman.</p><a className={styles.contactLink} href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL} <ArrowUpRight size={16} /></a></section>
      <section className={styles.contactCard}><div className={styles.cardIcon}><MessageCircle size={21} /></div><p className={styles.eyebrow}>02 / START HERE</p><h2>Need a quick answer?</h2><p>Explore how the tool works or check the guides for ideas on what to say next.</p><Link className={styles.contactLink} href="/guides">Browse the guides <ArrowRight size={16} /></Link></section>
    </div>
    <section className={styles.callout}><div><p className={styles.eyebrow} style={{ color: '#405f29' }}>BACK TO YOUR CONVERSATION</p><h2>Ready when you are.</h2><p>Paste the text and get reply ideas you can make your own.</p></div><Link className={styles.button} href="/#studio">Try it free <ArrowRight size={16} /></Link></section>
  </div></main></MarketingShell>;
}
