import Link from 'next/link';
import { ArrowRight, Camera, Check, ChevronDown, Copy, MessageSquare, ShieldCheck, UserRound } from 'lucide-react';
import { Logo } from '@/components/Logo';
import QuickReplyComposer from '@/components/QuickReplyComposer';
import { SITE_URL, SOCIAL_LINKS } from '@/lib/site';
import { ANNUAL_SAVINGS_DISPLAY, ANNUAL_SAVINGS_PERCENT, PLAN_PRICES } from '@/lib/pricing';

const faqs = [
  { question: 'Can I try it without signing up?', answer: 'Yes. Paste a message above and get three reply options without an account or card. The free allowance is five generations per day. Choose an example if you want to see how it works before sharing your own text.' },
  { question: 'Does it send messages or connect to my inbox?', answer: 'No. Gula only sees the text or screenshot you choose to share. You copy a reply, edit it and send it yourself in your messaging app. Remove names, phone numbers and anything private before sharing.' },
  { question: 'Will it know what the other person means?', answer: 'It can suggest possibilities from the context you provide, not read minds. A short message can have several meanings. The replies are drafts, not guarantees of a response or a date.' },
  { question: 'How is this different from a general chatbot?', answer: 'Gula puts the conversation, three reply options, editing and saved threads in one focused texting workspace. You do not have to write a long prompt. Choose what fits your situation and make it sound like you.' },
  { question: 'What happens when I create an account?', answer: 'A free account lets you keep the conversation and return when they answer. Check your email to confirm your account. Pro is optional and is not required to try your first replies.' },
  { question: 'What does Pro cost?', answer: `Pro Monthly is ${PLAN_PRICES.monthly.displayAmount} per month. Pro Annual is ${PLAN_PRICES.annual.displayAmount} billed yearly. You can cancel renewal from billing. Review the selected plan and any trial details before confirming in checkout.` },
];

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Gula Text Wingman',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  description: 'Paste a text or upload a conversation screenshot. Compare three reply drafts, edit one and copy it. Try free without an account or card.',
  offers: [
    { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Five free generations per day' },
    { '@type': 'Offer', price: String(PLAN_PRICES.monthly.amount), priceCurrency: 'USD', description: 'Pro billed monthly' },
    { '@type': 'Offer', price: String(PLAN_PRICES.annual.amount), priceCurrency: 'USD', description: 'Pro billed annually' },
  ],
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) }) }} />

      <a href="#reply-composer" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-violet-600 focus:px-4 focus:py-3">Skip to the reply tool</a>
      <header className="container mx-auto flex items-center justify-between gap-3 px-4 py-4 sm:py-5">
        <Link href="/" aria-label="Gula Text Wingman home" className="shrink-0"><Logo size="sm" showText /></Link>
        <nav aria-label="Main navigation" className="flex items-center gap-1 whitespace-nowrap sm:gap-3">
          <Link href="/guides" className="hidden rounded-xl px-3 py-2 text-sm text-white/65 hover:text-white sm:block">Texting guides</Link>
          <a href="#pricing" className="rounded-xl px-3 py-2 text-sm text-white/65 hover:text-white">Pricing</a>
          <Link href="/login?mode=signin" className="rounded-xl px-3 py-2 text-sm text-white/65 hover:text-white">Sign in</Link>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 pb-10 pt-5 sm:pb-16 sm:pt-10">
          <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/[0.08] blur-3xl" />
          <div className="relative mx-auto mb-5 max-w-2xl text-center sm:mb-7">
            <p className="mb-3 text-xs font-semibold tracking-wide text-violet-200/80">For the text you are overthinking.</p>
            <h1 className="text-[32px] font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">What should I say next?<span className="mt-1 block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">Three replies. Your call.</span></h1>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/65">Paste their message. Compare three short replies, make one sound like you, and copy it. No account or card to start.</p>
          </div>
          <div id="reply-composer" className="relative scroll-mt-4"><QuickReplyComposer embedded /></div>
          <div className="mx-auto mt-2 flex max-w-xl flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-white/55">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-violet-300" /> No inbox access</span>
            <span className="inline-flex items-center gap-1.5"><Camera className="h-3.5 w-3.5 text-violet-300" /> Screenshots welcome</span>
            <span className="inline-flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5 text-violet-300" /> You press send</span>
          </div>
        </section>

        <section className="border-y border-white/[0.06] bg-white/[0.015] px-4 py-12 sm:py-16" aria-labelledby="how-it-works">
          <div className="mx-auto max-w-4xl">
            <h2 id="how-it-works" className="mb-8 text-center text-2xl font-bold sm:text-3xl">Less guessing. A reply you can use.</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                { icon: MessageSquare, title: '1. Share the context', text: 'Paste the latest message or a few lines of the conversation. Leave out names and numbers.' },
                { icon: UserRound, title: '2. Make the choice', text: 'Compare a short option, another angle and a warmer reply. Edit the words to fit you.' },
                { icon: Copy, title: '3. Copy, then send', text: 'Keep control of your conversation. Gula never messages someone on your behalf.' },
              ].map(step => <div key={step.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><step.icon className="mb-4 h-5 w-5 text-violet-300" /><h3 className="mb-2 font-bold">{step.title}</h3><p className="text-sm leading-relaxed text-white/60">{step.text}</p></div>)}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-14 sm:py-20" aria-labelledby="your-voice">
          <div className="mx-auto grid max-w-4xl items-center gap-8 md:grid-cols-2">
            <div><p className="mb-3 text-xs font-bold uppercase tracking-widest text-violet-300">Your voice, not a script</p><h2 id="your-voice" className="text-2xl font-bold leading-tight sm:text-3xl">A draft is a starting point.<br />You make it yours.</h2><p className="mt-4 text-sm leading-relaxed text-white/60">Too formal? Too long? Edit before copying. Your choices provide style signals such as length and punctuation, without putting your raw message into style-learning events.</p><p className="mt-3 text-sm leading-relaxed text-white/60">A free account lets you keep the thread and pick it up when they answer. Start with the tool above; decide whether to save after you have a useful reply.</p><a href="#reply-composer" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-violet-200">Try your first reply <ArrowRight className="h-4 w-4" /></a></div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"><p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/45">Illustrative example, not a customer story</p><p className="mb-2 text-xs text-white/50">They said</p><p className="rounded-2xl bg-white/[0.06] p-4 text-lg">&ldquo;we need to talk&rdquo;</p><p className="mb-2 mt-5 text-xs text-white/50">One possible reply</p><p className="rounded-2xl border border-violet-300/25 bg-violet-400/10 p-4 text-lg">&ldquo;Sure, when are you free?&rdquo;</p><p className="mt-4 text-xs leading-relaxed text-white/50">Acknowledge the message without guessing what they mean. More context may call for a different reply.</p></div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-6 border-y border-white/[0.06] px-4 py-14 sm:py-20" aria-labelledby="pricing-title">
          <div className="mb-8 text-center"><h2 id="pricing-title" className="text-2xl font-bold sm:text-3xl">Start free. Upgrade only if it helps.</h2><p className="mt-3 text-sm text-white/60">Use your first replies before deciding on Pro.</p></div>
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
            <PricingCard title="Free" amount="$0" interval="to start" items={['5 generations per day', '3 reply options per generation', 'Paste text or upload a screenshot', 'No account or card to try']} href="#reply-composer" cta="Try it here" detail="An example also uses one free generation." />
            <PricingCard title="Pro Monthly" amount={PLAN_PRICES.monthly.displayAmount} interval="billed monthly" items={['Unlimited replies and Coach', 'Decodes, openers and revives', 'Saved conversation history', 'Manage renewal from billing']} href="/pricing?plan=monthly" cta="Review Monthly" detail="Review trial and payment details before confirming." featured />
            <PricingCard title="Pro Annual" amount={PLAN_PRICES.annual.displayAmount} interval="billed yearly" items={['Everything in Pro Monthly', `Save ${ANNUAL_SAVINGS_DISPLAY} compared with 12 monthly payments`, 'One annual payment', 'Manage renewal from billing']} href="/pricing?plan=annual" cta="Review Annual" detail={`Save ${ANNUAL_SAVINGS_PERCENT}% versus paying monthly.`} />
          </div>
        </section>

        <section className="container mx-auto px-4 py-14 sm:py-20" aria-labelledby="faq-title"><h2 id="faq-title" className="mb-8 text-center text-2xl font-bold sm:text-3xl">Before you paste.</h2><div className="mx-auto max-w-2xl space-y-3">{faqs.map(faq => <details key={faq.question} className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]"><summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-semibold">{faq.question}<ChevronDown className="h-4 w-4 shrink-0 text-white/50 transition-transform group-open:rotate-180" /></summary><p className="px-5 pb-5 text-sm leading-relaxed text-white/60">{faq.answer}</p></details>)}</div></section>

        <section className="px-4 pb-14 text-center sm:pb-20"><h2 className="text-2xl font-bold sm:text-3xl">Get unstuck on this text.</h2><a href="#reply-composer" className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-7 py-3 font-bold hover:from-violet-500 hover:to-fuchsia-500">Try a reply free <ArrowRight className="h-4 w-4" /></a><p className="mt-3 text-xs text-white/50">No account. No card. You choose what to send.</p></section>
      </main>

      <footer className="border-t border-white/[0.06] px-4 py-8"><div className="mx-auto flex max-w-5xl flex-col items-center gap-5"><Logo size="sm" showText /><nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm text-white/55"><Link href="/features">Features</Link><Link href="/guides">Guides</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/contact">Contact</Link><Link href="/changelog">What&apos;s new</Link>{Object.entries(SOCIAL_LINKS).map(([name, href]) => <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="capitalize">{name}</a>)}</nav><p className="text-xs text-white/40">&copy; {new Date().getFullYear()} Gula Text Wingman.</p></div></footer>
    </div>
  );
}

function PricingCard({ title, amount, interval, items, href, cta, detail, featured = false }: { title: string; amount: string; interval: string; items: string[]; href: string; cta: string; detail: string; featured?: boolean }) {
  return <div className={`flex flex-col rounded-3xl border p-6 ${featured ? 'border-violet-400/40 bg-gradient-to-br from-violet-600/15 to-fuchsia-600/10' : 'border-white/10 bg-white/[0.025]'}`}><h3 className="text-xl font-bold">{title}</h3><p className="mt-4 text-4xl font-bold tracking-tight">{amount}</p><p className="mt-1 text-sm text-white/55">{interval}</p><ul className="mb-6 mt-6 flex-1 space-y-3">{items.map(item => <li key={item} className="flex gap-2 text-sm leading-relaxed text-white/75"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />{item}</li>)}</ul><Link href={href} className={`flex min-h-12 items-center justify-center rounded-xl px-4 font-bold ${featured ? 'bg-violet-600 hover:bg-violet-500' : 'border border-white/15 bg-white/[0.05] hover:bg-white/10'}`}>{cta}</Link><p className="mt-3 text-center text-xs leading-relaxed text-white/50">{detail}</p></div>;
}
