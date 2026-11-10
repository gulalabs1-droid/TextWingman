import Link from 'next/link';
import { ArrowUpRight, Send } from 'lucide-react';
import { SOCIAL_LINKS } from '@/lib/site';
import styles from '@/app/info.module.css';

function Brand() {
  return <Link className={styles.brand} href="/" aria-label="Text Wingman home"><span className={styles.brandIcon}><Send size={19} strokeWidth={2.4} /></span><span>text<strong>wingman</strong><small>.app</small></span></Link>;
}

const navigation = <><Link href="/features">Features</Link><Link href="/guides">Guides</Link><Link href="/#shows">The shows</Link><Link href="/pricing">Pricing</Link><Link href="/changelog">What&apos;s new</Link></>;

export default function MarketingShell({ children, hasMobileCta = false }: { children: React.ReactNode; hasMobileCta?: boolean }) {
  return <div className={styles.site}>
    <a className={styles.skip} href="#page-content">Skip to content</a>
    <header className={styles.header}><div className={`${styles.wrap} ${styles.nav}`}><Brand /><nav className={styles.navLinks} aria-label="Main navigation">{navigation}</nav><div className={styles.actions}><Link href="/login?mode=signin" className={styles.signIn}>Sign in</Link><Link href="/#studio" className={styles.navButton}>Try it free <ArrowUpRight size={15} /></Link></div><details className={styles.mobileNav}><summary aria-label="Open navigation">Menu <span>☰</span></summary><nav aria-label="Mobile navigation">{navigation}<Link href="/login?mode=signin">Sign in</Link></nav></details></div></header>
    {children}
    <footer className={`${styles.footer} ${hasMobileCta ? styles.footerWithCta : ''}`}><div className={`${styles.wrap} ${styles.footerInner}`}><Brand /><nav aria-label="Footer navigation"><Link href="/features">Features</Link><Link href="/guides">Guides</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/contact">Contact</Link><Link href="/changelog">What&apos;s new</Link>{Object.entries(SOCIAL_LINKS).map(([name, href]) => <a key={name} href={href} target="_blank" rel="noopener noreferrer">{name}</a>)}</nav><small>© {new Date().getFullYear()} Text Wingman by Gula Labs.</small></div></footer>
  </div>;
}
