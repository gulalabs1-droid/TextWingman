import Link from 'next/link';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Camera, Check, MessageCircle, Send, ShieldCheck, UserRound } from 'lucide-react';
import QuickReplyComposer from '@/components/QuickReplyComposer';
import HomeCourt from '@/components/HomeCourt';
import { SITE_URL, SOCIAL_LINKS } from '@/lib/site';
import { PLAN_PRICES } from '@/lib/pricing';
import { FREE_REPLY_LIMIT, REPLY_USAGE_WINDOW_HOURS } from '@/lib/usage-limits';
import styles from './homepage.module.css';

const faqs = [
  { question: 'Can I try it without signing up?', answer: `Yes. Paste a message and get three reply options without an account or card. Free users get ${FREE_REPLY_LIMIT} uses per ${REPLY_USAGE_WINDOW_HOURS} hours, shared between reply generations and coach messages.` },
  { question: 'Does it send messages or connect to my inbox?', answer: 'No. Text Wingman only sees the text or screenshot you choose to share. You copy, edit and send the reply yourself. Remove names, phone numbers and anything private first.' },
  { question: 'Will it know what the other person means?', answer: 'It can suggest possibilities from the context you provide, not read minds. Replies are drafts, not guarantees of a response or a date.' },
  { question: 'How is this different from a general chatbot?', answer: 'Text Wingman puts the conversation, three reply options, editing and saved threads in one focused texting workspace.' },
  { question: 'What happens when I create an account?', answer: 'A free account lets you keep the conversation and return when they answer. Pro is optional and is not required to try your first replies.' },
  { question: 'What does Pro cost?', answer: `Pro Monthly is ${PLAN_PRICES.monthly.displayAmount} per month. Pro Annual is ${PLAN_PRICES.annual.displayAmount} billed yearly. Review your selected plan and any trial details before confirming in checkout.` },
];

const softwareSchema = {
  '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Text Wingman',
  applicationCategory: 'LifestyleApplication', operatingSystem: 'Web', url: SITE_URL,
  description: 'Paste a text or upload a conversation screenshot. Compare three reply drafts, edit one and copy it. Try free without an account or card.',
  offers: [
    { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: `${FREE_REPLY_LIMIT} free uses per ${REPLY_USAGE_WINDOW_HOURS} hours` },
    { '@type': 'Offer', price: String(PLAN_PRICES.monthly.amount), priceCurrency: 'USD', description: 'Pro billed monthly' },
    { '@type': 'Offer', price: String(PLAN_PRICES.annual.amount), priceCurrency: 'USD', description: 'Pro billed annually' },
  ],
};

function Brand() {
  return <Link className={styles.brand} href="/" aria-label="Text Wingman home"><span className={styles.brandIcon}><Send size={19} strokeWidth={2.4} /></span><span>text<strong>wingman</strong><small>.app</small></span></Link>;
}

const nav = <><a href="#studio">The tool</a><a href="#shows">The shows</a><a href="#how">How it works</a><a href="#pricing">Pricing</a><Link href="/guides">Guides</Link></>;

export default function HomePage() {
  return <div className={styles.home} id="top">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) }) }} />
    <a className={styles.skip} href="#reply-composer">Skip to the reply tool</a>
    <header className={styles.header}><div className={`${styles.wrap} ${styles.nav}`}>
      <Brand /><nav className={styles.navLinks} aria-label="Main navigation">{nav}</nav>
      <div className={styles.navActions}><Link className={styles.signIn} href="/login?mode=signin">Sign in</Link><a className={`${styles.button} ${styles.buttonLime} ${styles.navButton}`} href="#studio">Try it free <ArrowUpRight size={15} /></a></div>
      <details className={styles.mobileNav}><summary aria-label="Open navigation">Menu <span>☰</span></summary><nav aria-label="Mobile navigation">{nav}<Link href="/login?mode=signin">Sign in</Link></nav></details>
    </div></header>
    <main>
      <section className={styles.hero}><div className={`${styles.wrap} ${styles.heroGrid}`}>
        <div className={styles.heroIntro}><div className={styles.tag}><span /> THE INTERNET&apos;S TEXTING WINGMAN</div>
          <h1 className={styles.heroTitle}>SAY LESS.<br /><em>TEXT</em> <span>BETTER.</span></h1>
          <p className={styles.heroCopy}>Caught staring at that message? Drop it in. Get three reply ideas you can make sound like <strong>you</strong>, not a robot. Then get back to your life.</p>
          <div className={styles.heroActions}><a className={`${styles.button} ${styles.buttonLime}`} href="#studio">Try the reply studio <ArrowUpRight size={17} /></a><a className={`${styles.button} ${styles.buttonOutline}`} href="#shows">Enter the group chat <ArrowDownRight size={17} /></a></div>
          <div className={styles.trust}><span><Check size={15} /> {FREE_REPLY_LIMIT} free uses per {REPLY_USAGE_WINDOW_HOURS} hours</span><span><Check size={15} /> 3 reply options per generation</span><span><Check size={15} /> No signup to try</span></div>
        </div>
        <div id="studio" className={styles.studioFrame}><div className={styles.studio}><div className={styles.studioHead}><strong>THE REPLY STUDIO ✳</strong><span><i /> REAL AI, YOUR CALL</span></div><div id="reply-composer" className={styles.studioBody}><QuickReplyComposer embedded /></div></div></div>
      </div></section>
      <div className={styles.ticker}><div className={`${styles.wrap} ${styles.tickerRow}`}><span>NO MORE <b>OVERTHINKING</b></span><i>✳</i><span>YOUR VIBE. <b>YOUR WORDS.</b></span><i>✳</i><span>GET THE TEXT <b>RIGHT.</b></span><i>✳</i><span>THREE REPLIES. <b>ONE MOVE.</b></span></div></div>
      <section className={styles.section} id="shows"><div className={styles.wrap}>
        <div className={styles.sectionTop}><div><p className={styles.eyebrow}>01 / THE CULTURE</p><h2 className={styles.sectionTitle}>IT&apos;S NOT JUST AN APP.<br />IT&apos;S <em>A WHOLE CONVERSATION.</em></h2></div><p className={styles.sectionDesc}>The funniest texts, the toughest calls, the replies everyone has an opinion on. Welcome to the group chat.</p></div>
        <div className={styles.shows}>
          <article className={`${styles.show} ${styles.court}`}><div className={styles.showTop}><span>COMMUNITY VOTE</span><b>01</b></div><div className={`${styles.showArt} ${styles.abc}`} aria-hidden="true">A<span>/</span>B</div><h3>Wingman Court.</h3><p>Was that text a W or an L? You pick the winning reply.</p><a className={styles.showLink} href="#court-poll" aria-label="Vote in Wingman Court"><ArrowDownRight /></a></article>
          <article className={`${styles.show} ${styles.after}`}><div className={styles.showTop}><span>SHOW CONCEPT</span><b>02</b></div><div className={styles.showArt}><div className={styles.signal} aria-hidden="true">◉</div></div><h3>Wingman After Dark.</h3><p>Anonymous dilemmas. An AI host. A livestream concept for the group chat.</p></article>
          <article className={`${styles.show} ${styles.dont}`}><div className={styles.showTop}><span>SERIES CONCEPT</span><b>03</b></div><div className={`${styles.showArt} ${styles.dontArt}`} aria-hidden="true">DON&apos;T<br />SEND<br />THAT.</div><h3>Don&apos;t Send That.</h3><p>Sometimes deleting the paragraph is the best decision you&apos;ll make.</p></article>
        </div>
        <HomeCourt />
      </div></section>
      <section className={`${styles.section} ${styles.how}`} id="how"><div className={styles.wrap}>
        <div className={styles.sectionTop}><div><p className={styles.eyebrow}>02 / HOW IT WORKS</p><h2 className={styles.sectionTitle}>THREE STEPS.<br />BACK TO <em>BEING YOU.</em></h2></div><p className={styles.sectionDesc}>No essays, no complicated prompts, no cheesy lines. Just a starting point when you need one.</p></div>
        <div className={styles.steps}>{[
          { n: '01 / DROP IT IN', title: 'Paste the text.', text: 'Enter the message you got or upload a screenshot. Remove names and private details first.', icon: <Camera /> },
          { n: '02 / FIND YOUR VIBE', title: 'Pick your energy.', text: 'Compare three options, edit the words and choose what feels right for the conversation.', icon: <MessageCircle /> },
          { n: '03 / MAKE YOUR MOVE', title: 'Copy. Send. Done.', text: 'You stay in control. Copy your reply and send it yourself in your messaging app.', icon: <Send /> },
        ].map(step => <article className={styles.step} key={step.n}><span>{step.n}</span><div className={styles.stepIcon}>{step.icon}</div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
      </div></section>
      <section className={styles.section} id="pricing"><div className={`${styles.wrap} ${styles.pricing}`}><div><p className={styles.eyebrow}>03 / UPGRADE YOUR CONVERSATIONS</p><h2 className={styles.sectionTitle}>THE FREE VERSION HELPS.<br /><em>PRO STAYS READY.</em></h2><p className={styles.pricingText}>Start free. Upgrade when Text Wingman becomes your go-to for first messages, difficult replies, and keeping conversations moving. Use what makes sense for you.</p><a href="#studio" className={`${styles.button} ${styles.buttonOutline}`}>Start with the free version <ArrowUpRight size={16} /></a></div>
        <div className={styles.priceCard}><div className={styles.priceTop}><strong>TEXT WINGMAN PRO ✳</strong><span>FOR THE REGULARS</span></div><div className={styles.price}>{PLAN_PRICES.monthly.displayAmount}<small>/mo</small></div><p className={styles.priceCaption}>Billed monthly. Cancel renewal anytime.</p><ul>{['Unlimited replies and Coach Mode', 'Saved conversation history', 'Openers, decodes and follow-up ideas', 'You review and send every reply'].map(item => <li key={item}><Check size={14} /> {item}</li>)}</ul><Link href="/pricing?plan=monthly" className={styles.priceButton}>Explore Pro plans <ArrowRight size={17} /></Link><p className={styles.priceMini}>Annual plan available for {PLAN_PRICES.annual.displayAmount}/year. Review all terms before checkout.</p></div>
      </div></section>
      <section className={styles.faqSection}><div className={styles.wrap}><p className={styles.eyebrow}>04 / GOOD TO KNOW</p><h2 className={styles.faqTitle}>BEFORE YOU PASTE.</h2><div className={styles.faqList}>{faqs.map(faq => <details key={faq.question}><summary>{faq.question}<span>+</span></summary><p>{faq.answer}</p></details>)}</div></div></section>
    </main>
    <footer className={styles.footer}><div className={`${styles.wrap} ${styles.footerInner}`}><Brand /><nav aria-label="Footer navigation"><Link href="/features">Features</Link><Link href="/guides">Guides</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/contact">Contact</Link><Link href="/changelog">What&apos;s new</Link>{Object.entries(SOCIAL_LINKS).map(([name, href]) => <a key={name} href={href} target="_blank" rel="noopener noreferrer">{name}</a>)}</nav><small>© {new Date().getFullYear()} Text Wingman by Gula Labs.</small></div></footer>
    <div className={styles.accessNote}><ShieldCheck size={14} /> No inbox access <span>·</span> <UserRound size={14} /> You press send</div>
  </div>;
}
