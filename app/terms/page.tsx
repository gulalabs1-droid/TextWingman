import type { Metadata } from 'next';
import MarketingShell from '@/components/MarketingShell';
import { SUPPORT_EMAIL } from '@/lib/contact';
import { FREE_REPLY_LIMIT, REPLY_USAGE_WINDOW_HOURS } from '@/lib/usage-limits';
import styles from '@/app/info.module.css';

export const metadata: Metadata = {
  title: 'Terms of Service | Text Wingman',
  description: 'Read the terms that apply when you use Text Wingman.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return <MarketingShell><main className={styles.main} id="page-content"><div className={`${styles.content} ${styles.narrow}`}>
    <header className={`${styles.hero} ${styles.legalHero}`}><p className={styles.eyebrow}>THE FINE PRINT / TERMS OF SERVICE</p><h1 className={styles.title}>THE <em>TERMS.</em></h1><p className={styles.intro}>The terms that apply when you use Text Wingman.</p></header>
    <div className={styles.legalDoc}><p className={styles.legalDate}>Terms previously updated April 2026. Free-use wording and contact updated November 2026.</p>
      <section><h2>1. Acceptance of Terms</h2><p>By using Text Wingman, you agree to these Terms of Service. If you don&apos;t agree, please don&apos;t use our service.</p></section>
      <section><h2>2. Description of Service</h2><p>Text Wingman is an AI-powered tool that helps you craft text message replies. We provide suggestions based on your input, but you are responsible for the messages you send.</p></section>
      <section><h2>3. User Responsibilities</h2><ul><li>You must be 18 years or older to use this service</li><li>You are responsible for how you use our suggestions</li><li>Do not use the service for harassment, spam, or illegal purposes</li><li>Keep your account credentials secure</li></ul></section>
      <section><h2>4. Subscriptions &amp; Payments</h2><p>Free users get up to {FREE_REPLY_LIMIT} uses per {REPLY_USAGE_WINDOW_HOURS} hours, shared between reply generations and coach messages. Each reply generation provides three options. Pro subscriptions include unlimited replies. Paid subscriptions auto-renew unless cancelled. Review any trial terms at checkout. You can cancel anytime from your account settings.</p></section>
      <section><h2>5. Limitation of Liability</h2><p>Text Wingman provides AI suggestions as-is. We are not responsible for any outcomes from using our suggestions in your conversations.</p></section>
      <section><h2>6. Contact</h2><p>Questions? Email us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p></section>
    </div>
  </div></main></MarketingShell>;
}
