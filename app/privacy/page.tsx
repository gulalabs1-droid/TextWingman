import type { Metadata } from 'next';
import MarketingShell from '@/components/MarketingShell';
import { SUPPORT_EMAIL } from '@/lib/contact';
import styles from '@/app/info.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy | Text Wingman',
  description: 'Read the Text Wingman privacy policy.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return <MarketingShell><main className={styles.main} id="page-content"><div className={`${styles.content} ${styles.narrow}`}>
    <header className={`${styles.hero} ${styles.legalHero}`}><p className={styles.eyebrow}>THE FINE PRINT / PRIVACY POLICY</p><h1 className={styles.title}>YOUR PRIVACY.<br /><em>YOUR CALL.</em></h1><p className={styles.intro}>How Text Wingman describes the information used to provide the service.</p></header>
    <div className={styles.legalDoc}><p className={styles.legalDate}>Policy previously updated April 2026. Sign-in, contact and Court voting details updated November 2026.</p>
      <section><h2>What We Collect</h2><ul>
        <li><strong>Account info:</strong> Email address and, if you choose password sign-in, authentication information managed by our authentication provider.</li>
        <li><strong>Conversation content you paste or upload:</strong> Messages, screenshots, and OCR-extracted text are sent to OpenAI for processing. Saved threads and coach sessions are stored in our database so you can resume them later.</li>
        <li><strong>Generated content:</strong> AI replies, drafts, and strategy outputs are saved to your account history.</li>
        <li><strong>Usage data:</strong> Daily limits, copy events, and feature interactions for product analytics and abuse prevention.</li>
        <li><strong>Wingman Court votes:</strong> A random browser identifier is stored in a cookie for up to one year; a hashed version and your selected option are stored to record and update your vote. Clearing cookies or changing browsers can allow another vote.</li>
        <li><strong>Billing info:</strong> Handled by Stripe — we never see your card number.</li>
        <li><strong>Anonymous analytics:</strong> Page views and performance metrics via Vercel Analytics (no third-party cookies).</li>
        <li><strong>Error logs:</strong> Crash reports via Sentry (text masked, media blocked) to fix bugs.</li>
      </ul></section>
      <section><h2>How We Use Your Data</h2><ul><li>Generate AI-powered reply suggestions and strategy</li><li>Save your sessions so you can pick up where you left off</li><li>Count Wingman Court votes and let you change your selection on the same browser</li><li>Manage your account, plan, and subscription</li><li>Improve product quality (aggregated usage patterns only)</li><li>Send important account or billing updates</li></ul></section>
      <section><h2>What We Don&apos;t Do</h2><ul><li>We don&apos;t sell your data to third parties</li><li>We don&apos;t use your conversations to train public AI models</li><li>We don&apos;t spam you with marketing emails</li><li>We don&apos;t connect to your messaging apps or read texts directly — you choose what to share</li></ul></section>
      <section><h2>Data Retention</h2><p>Saved threads, coach sessions, and reply history persist on your account until you delete them. Usage logs are retained for up to 90 days for abuse prevention. You can delete your account at any time, which removes all associated data within 30 days.</p></section>
      <section><h2>Subprocessors</h2><p>We rely on these vetted third-party services to operate Text Wingman:</p><ul><li><strong>Supabase</strong> — database + authentication</li><li><strong>Vercel</strong> — hosting + analytics</li><li><strong>OpenAI</strong> — AI inference (per OpenAI&apos;s API policy, your data is not used to train their models)</li><li><strong>Stripe</strong> — payments</li><li><strong>Sentry</strong> — error monitoring</li></ul></section>
      <section><h2>Data Security</h2><p>All data is encrypted in transit (TLS) and at rest. Row-level security policies in Supabase ensure your data is never accessible to other users. Production secrets are stored only in our hosting platform and never exposed in client code.</p></section>
      <section><h2>Your Rights</h2><p>You can delete your account and all associated data at any time. Contact us to request data export or deletion.</p></section>
      <section><h2>Contact</h2><p>Privacy questions? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p></section>
    </div>
  </div></main></MarketingShell>;
}
