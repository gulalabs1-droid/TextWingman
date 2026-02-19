import Link from "next/link";
import { Sparkles, MessageCircle, Check, X, ArrowRight, Shield, Camera, Target, TrendingUp, ChevronDown, Brain, Zap, Clock, Upload, Lock } from "lucide-react";
import { Logo } from "@/components/Logo";

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Text Wingman',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  description: 'AI texting coach that reads your conversation, gives strategy, and generates replies you\'d actually send. One coach for every situation.',
  url: 'https://textwingman.com',
  offers: [
    { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free — 5 replies/day' },
    { '@type': 'Offer', price: '9.99', priceCurrency: 'USD', description: 'Pro Weekly — Unlimited' },
    { '@type': 'Offer', price: '99.99', priceCurrency: 'USD', description: 'Pro Annual — Best Value' },
  ],
  featureList: [
    'AI texting coach — ask anything, get strategy + replies in one chat',
    'Screenshot upload — instant conversation analysis',
    'AI reply generation in 3 tones (Quick, Spicy, Soft)',
    'Decode mode — understand what their message really means',
    'Conversation Revive — re-engage dead threads',
    'Opener generator — first messages for any situation',
    'V2 Verified pipeline — rule-checked, tone-verified replies under 18 words',
    'Session history — auto-saved, resume anytime',
  ],
  creator: { '@type': 'Organization', name: 'Gula Labs', url: 'https://textwingman.com' },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is Text Wingman free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. 5 replies, 1 decode, 1 opener, and 1 revive per day — no credit card, no trial. Pro unlocks unlimited everything + the verified pipeline.' } },
    { '@type': 'Question', name: 'Can you see my conversations?', acceptedAnswer: { '@type': 'Answer', text: 'No. Messages are processed in real-time and never stored on our servers. We don\'t connect to your messaging apps.' } },
    { '@type': 'Question', name: 'What apps does it work with?', acceptedAnswer: { '@type': 'Answer', text: 'All of them — iMessage, WhatsApp, Instagram, Tinder, Hinge, Bumble, Facebook Dating, Snapchat, Messenger, Telegram, LinkedIn, and more.' } },
    { '@type': 'Question', name: 'How is this different from ChatGPT?', acceptedAnswer: { '@type': 'Answer', text: 'ChatGPT gives you a robotic paragraph. Wingman gives you 3 verified replies under 18 words that sound like you actually texted them, plus real-time strategy on the conversation dynamics.' } },
    { '@type': 'Question', name: 'Will people know I\'m using AI?', acceptedAnswer: { '@type': 'Answer', text: 'No. Every reply sounds like a real person — lowercase, casual, no emojis, no formal sentences. The 18-word limit keeps it natural.' } },
  ],
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {/* Navbar */}
      <nav className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="transition-transform hover:scale-105">
            <Logo size="md" showText={true} className="cursor-pointer" />
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link href="/features" className="text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl px-3 py-2 text-sm transition-all hidden sm:block">Features</Link>
            <Link href="/guides" className="text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl px-3 py-2 text-sm transition-all hidden sm:block">Guides</Link>
            <Link href="#pricing" className="text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl px-3 py-2 text-sm transition-all hidden sm:block">Pricing</Link>
            <Link href="/login?mode=signin" className="text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl px-3 py-2 text-sm transition-all">Login</Link>
            <Link href="/app" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-semibold shadow-lg shadow-violet-600/20 px-4 py-2 text-sm transition-all">Try Free</Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════ */}
      {/*  HERO — The Sharp Friend                */}
      {/* ═══════════════════════════════════════ */}
      <section className="container mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-4xl mx-auto text-center space-y-6 mb-14 md:mb-20">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-300 px-4 py-1.5 rounded-full text-xs font-bold border border-violet-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            Over 50,000 replies generated
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Stop overthinking.
            <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent mt-2">Start sending.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
            Text Wingman is your AI texting coach. It reads the full conversation, tells you what&apos;s really going on, and writes the reply you wish you thought of.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/app" className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-bold shadow-xl shadow-violet-600/25 px-8 h-14 text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
              Try it free <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-white/25 text-xs">No sign-up required &bull; 5 free replies/day</p>
          </div>
        </div>

        {/* Live Coach Demo */}
        <div className="max-w-2xl mx-auto">
          <Link href="/app" className="block group">
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-3xl p-5 sm:p-7 hover:bg-white/[0.06] transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-violet-500/5 group-hover:border-white/[0.14]">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-white/70 text-sm font-bold">Coach</span>
                <span className="ml-auto px-2 py-0.5 rounded-lg text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">V2 Verified</span>
              </div>

              {/* User message */}
              <div className="flex justify-end mb-3">
                <div className="bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 border border-violet-500/15 rounded-2xl rounded-br-md px-4 py-2.5 max-w-[85%]">
                  <p className="text-white/85 text-[13px] leading-relaxed">she said &ldquo;my friends bailed on me lol&rdquo; what do I say?</p>
                </div>
              </div>

              {/* Coach response */}
              <div className="flex justify-start mb-4">
                <div className="max-w-[92%] space-y-2.5">
                  <div className="bg-white/[0.06] border border-white/[0.10] rounded-2xl rounded-bl-md px-4 py-3">
                    <p className="text-white/80 text-[13px] leading-relaxed">She&apos;s hinting hard. &ldquo;My friends bailed&rdquo; = she wants you to make a move. Don&apos;t ask permission — suggest.</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-1">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 flex items-center gap-1"><TrendingUp className="h-2.5 w-2.5" />Rising</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.06] text-white/40 border border-white/[0.08]">Balanced</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400/60 border border-emerald-500/15">escalate</span>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { emoji: '⚡', tone: 'QUICK', text: 'come through then', color: 'from-cyan-400 to-blue-500' },
                      { emoji: '🔥', tone: 'SPICY', text: 'sounds like you need a rescue', color: 'from-rose-400 to-pink-500' },
                      { emoji: '💚', tone: 'SOFT', text: 'their loss. come chill with me', color: 'from-emerald-400 to-green-500' },
                    ].map(r => (
                      <div key={r.tone} className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-3 flex items-start gap-2.5">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center shrink-0`}><span className="text-[11px]">{r.emoji}</span></div>
                        <div className="flex-1"><span className="text-[9px] font-black tracking-wider text-white/30">{r.tone}</span><p className="text-white/80 text-[13px] mt-0.5">&ldquo;{r.text}&rdquo;</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-white/20 text-xs">Ask anything. Upload screenshots. Get the move.</p>
                <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-violet-600/20 group-hover:scale-105 transition-transform shrink-0 ml-4">
                  Try it <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/*  SOCIAL PROOF BAR                       */}
      {/* ═══════════════════════════════════════ */}
      <section className="border-y border-white/[0.06] py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-center">
            {[
              { n: '50K+', label: 'Replies generated' },
              { n: '12K+', label: 'Conversations coached' },
              { n: '<2s', label: 'Average response time' },
              { n: '4.9★', label: 'User satisfaction' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-2xl font-black text-white">{stat.n}</p>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/*  WITHOUT / WITH                          */}
      {/* ═══════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">The difference is embarrassing.</h2>
          <p className="text-white/50">Other tools see one message. Coach reads the full conversation.</p>
        </div>
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-5">
          <div className="bg-white/[0.03] border border-red-500/15 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
              <span className="text-red-300 font-bold text-xs uppercase tracking-wider">Without Wingman</span>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1.5">They sent</p>
              <p className="text-white/70 text-sm">&ldquo;right? now I got nothing to do&rdquo;</p>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
              <p className="text-white/40 text-[10px] font-bold uppercase mb-1.5">Your brain</p>
              <p className="text-white/50 text-sm italic">&ldquo;Is she hinting? Should I invite her? What if she says no?&rdquo;</p>
            </div>
            <div className="bg-red-500/[0.08] border border-red-500/20 rounded-xl p-3">
              <p className="text-red-300/60 text-[10px] font-bold uppercase mb-1.5">You send</p>
              <p className="text-red-200 text-sm">&ldquo;dang that sucks lol yeah I mean if you want we could maybe link or something idk&rdquo;</p>
              <p className="text-red-400/60 text-[11px] mt-2">37 words. Zero confidence. She left you on read.</p>
            </div>
          </div>
          <div className="bg-white/[0.03] border border-emerald-500/20 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-300 font-bold text-xs uppercase tracking-wider">With Wingman</span>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
              <p className="text-white/40 text-[10px] font-bold uppercase mb-1.5">Coach reads the thread</p>
              <p className="text-white/50 text-xs">6 messages &bull; Rising momentum &bull; She&apos;s hinting</p>
            </div>
            <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Target className="h-3 w-3 text-emerald-400" />
                <p className="text-emerald-300 text-[10px] font-bold uppercase">Coach says</p>
              </div>
              <p className="text-white/90 text-sm font-semibold">&ldquo;She&apos;s hinting. Make a move. Don&apos;t ask — suggest.&rdquo;</p>
            </div>
            <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-xl p-3">
              <p className="text-emerald-300/60 text-[10px] font-bold uppercase mb-1.5">You send</p>
              <p className="text-emerald-200 text-sm font-semibold">&ldquo;come through then&rdquo;</p>
              <p className="text-emerald-400/60 text-[11px] mt-2">3 words. She&apos;s on her way.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/*  WHAT COACH DOES — Feature Grid          */}
      {/* ═══════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">One coach. Every situation.</h2>
          <p className="text-white/50">No tabs. No modes to switch. Just tell Coach what you need.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { icon: '💬', title: 'Generate replies', desc: '3 tones — quick, spicy, soft. Under 18 words. Sounds like you.' },
            { icon: '🔍', title: 'Decode their message', desc: 'What do they really mean? Get intent, subtext, and red/green flags.' },
            { icon: '✨', title: 'Write openers', desc: 'First message for any platform — dating app, DM, cold text, reconnect.' },
            { icon: '🔥', title: 'Revive dead chats', desc: 'Haven\'t heard back in days? Coach writes the perfect re-engagement.' },
            { icon: '📸', title: 'Screenshot upload', desc: 'Drop a screenshot — Coach reads every message and gives you the move.' },
            { icon: '🧠', title: 'Full conversation strategy', desc: 'Momentum, power dynamics, energy level — Coach reads it all before replying.' },
          ].map((f) => (
            <div key={f.title} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.06] hover:border-white/[0.14] transition-all">
              <span className="text-2xl block mb-3">{f.icon}</span>
              <h3 className="font-bold text-white text-sm mb-1.5">{f.title}</h3>
              <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/*  SCENARIO CARDS — Real Situations        */}
      {/* ═══════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Built for real situations.</h2>
          <p className="text-white/50">Crush, ex, boss, new match — Coach adapts to all of it.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { emoji: '💘', title: 'The crush you can\'t read', desc: 'Left on delivered for 6 hours then replied "lol sorry I fell asleep." What do you say?', color: 'border-pink-500/20 hover:border-pink-500/30' },
            { emoji: '💔', title: 'The ex who texted back', desc: '"Hey, been thinking about you" at 1am. Not too eager, not too cold.', color: 'border-red-500/20 hover:border-red-500/30' },
            { emoji: '✨', title: 'New match, blank page', desc: 'Matched on Hinge. Bio says "take me somewhere I\'ve never been." What\'s the opener?', color: 'border-violet-500/20 hover:border-violet-500/30' },
            { emoji: '💼', title: 'Work text you can\'t mess up', desc: '"Per my last message..." from your manager. You need to reply now.', color: 'border-blue-500/20 hover:border-blue-500/30' },
            { emoji: '👻', title: 'The convo that died', desc: 'Talking every day, then nothing for 4 days. Coach writes the re-engagement.', color: 'border-cyan-500/20 hover:border-cyan-500/30' },
            { emoji: '🤝', title: 'Friend drama', desc: '"Are you mad at me?" — you don\'t want to make it worse. Get the right tone.', color: 'border-green-500/20 hover:border-green-500/30' },
          ].map((s, i) => (
            <div key={i} className={`bg-white/[0.03] border ${s.color} rounded-2xl p-5 transition-all hover:bg-white/[0.05]`}>
              <span className="text-2xl mb-3 block">{s.emoji}</span>
              <h3 className="font-bold text-white text-sm mb-2">{s.title}</h3>
              <p className="text-white/40 text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/app" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-bold shadow-lg shadow-violet-600/20 px-8 h-13 py-3.5 transition-all hover:scale-[1.02] active:scale-[0.98]">
            Handle it now — free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/*  HOW IT WORKS — 3 Steps                  */}
      {/* ═══════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Three steps. That&apos;s it.</h2>
        </div>
        <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { n: '1', icon: <Upload className="h-5 w-5 text-violet-400" />, title: 'Drop it in', desc: 'Screenshot, paste their message, or just ask Coach what to do.' },
            { n: '2', icon: <Brain className="h-5 w-5 text-fuchsia-400" />, title: 'Coach reads everything', desc: 'Full thread analysis — momentum, energy, power dynamics, subtext.' },
            { n: '3', icon: <Zap className="h-5 w-5 text-emerald-400" />, title: 'Send with confidence', desc: '3 reply options under 18 words. Pick one, copy, send. Done.' },
          ].map(step => (
            <div key={step.n} className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.05] border border-white/[0.10] flex items-center justify-center">
                {step.icon}
              </div>
              <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-violet-600/20">{step.n}</div>
              <h3 className="font-bold text-white">{step.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/*  FAQ                                     */}
      {/* ═══════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Questions?</h2>
          <p className="text-white/50">The stuff everyone asks before they try it.</p>
        </div>
        <div className="max-w-2xl mx-auto space-y-3">
          {[
            { q: 'Is it actually free?', a: 'Yes. 5 replies, 1 decode, 1 opener, and 1 revive per day — no credit card, no trial expiration. Pro unlocks unlimited everything + V2 Verified pipeline.' },
            { q: 'Can you see my conversations?', a: 'No. Messages are processed in real-time and never stored. We don\'t connect to your messaging apps.' },
            { q: 'What apps does it work with?', a: 'All of them. iMessage, WhatsApp, Instagram, Tinder, Hinge, Bumble, Facebook Dating, Snapchat, Telegram, LinkedIn — anything with text.' },
            { q: 'How is this different from ChatGPT?', a: 'ChatGPT gives you a paragraph that sounds robotic. Wingman generates 3 verified replies under 18 words that sound like you actually texted them, plus real-time strategy analysis.' },
            { q: 'Will people know I\'m using AI?', a: 'No. Every reply sounds like a real person — lowercase, casual, no emojis. The 18-word limit keeps it natural. Plus you can edit any reply.' },
          ].map((faq, i) => (
            <details key={i} className="group bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden hover:bg-white/[0.05] transition-all">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                <span className="font-bold text-white text-sm pr-4">{faq.q}</span>
                <ChevronDown className="h-4 w-4 text-white/30 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5 -mt-1">
                <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/*  PRICING                                 */}
      {/* ═══════════════════════════════════════ */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Simple pricing.</h2>
          <p className="text-white/50">Start free. Upgrade when you need the sharp friend always on call.</p>
          <p className="text-xs text-emerald-400/60 mt-3 font-medium">Founder pricing — lock in these rates forever</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 hover:bg-white/[0.05] transition-all">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">Free</h3>
              <p className="text-white/40 text-sm">Get a real taste</p>
              <div className="mt-4"><span className="text-4xl font-black text-white">$0</span></div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> 5 replies per day</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Full Coach access</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Screenshot upload</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> 1 decode + 1 opener + 1 revive / day</li>
              <li className="flex items-center gap-3 text-white/30 text-sm"><Lock className="h-4 w-4 text-white/15 shrink-0" /> V2 Verified pipeline</li>
              <li className="flex items-center gap-3 text-white/30 text-sm"><Lock className="h-4 w-4 text-white/15 shrink-0" /> Unlimited everything</li>
            </ul>
            <Link href="/app" className="w-full h-12 text-sm font-bold rounded-xl bg-white/[0.06] border border-white/[0.12] text-white hover:bg-white/[0.10] transition-all flex items-center justify-center">Start Free →</Link>
            <p className="text-xs text-center text-white/25 mt-3">No credit card required</p>
          </div>
          <div className="relative bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-3xl p-6 hover:border-violet-500/40 transition-all">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-5 py-1.5 rounded-full text-xs font-black shadow-lg shadow-violet-600/30 whitespace-nowrap">MOST POPULAR</div>
            <div className="mb-6 pt-2">
              <h3 className="text-xl font-bold text-white">Pro Weekly</h3>
              <p className="text-white/40 text-sm">Full access. Cancel anytime.</p>
              <div className="mt-4 flex items-end gap-2"><span className="text-4xl font-black text-white">$9.99</span><span className="text-white/40 mb-1">/week</span></div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-white text-sm font-medium"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Unlimited replies + Coach</li>
              <li className="flex items-center gap-3 text-white text-sm font-medium"><Shield className="h-4 w-4 text-emerald-400 shrink-0" /> V2 Verified pipeline + Strategy</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Unlimited decodes, openers, revives</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Session history — auto-saved</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Cancel anytime</li>
            </ul>
            <Link href="/pricing" className="w-full h-14 text-base font-black rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-xl shadow-violet-600/20 hover:scale-[1.02] transition-all flex items-center justify-center">Get Pro →</Link>
            <p className="text-xs text-center text-white/30 mt-3">7-day free trial available</p>
          </div>
          <div className="relative bg-white/[0.03] border border-emerald-500/20 rounded-3xl p-6 hover:bg-white/[0.05] transition-all">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-5 py-1.5 rounded-full text-xs font-black shadow-lg shadow-emerald-500/30 whitespace-nowrap">SAVE 80%</div>
            <div className="mb-6 pt-2">
              <h3 className="text-xl font-bold text-white">Pro Annual</h3>
              <p className="text-white/40 text-sm">Best value — $1.92/week</p>
              <div className="mt-4 flex items-end gap-2"><span className="text-4xl font-black text-white">$99.99</span><span className="text-white/40 mb-1">/year</span></div>
              <p className="text-emerald-400 text-xs font-bold mt-1">Save $419 vs weekly</p>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-white text-sm font-medium"><Sparkles className="h-4 w-4 text-emerald-400 shrink-0" /> Everything in Pro</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Price locked forever</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> First access to new features</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Priority support</li>
            </ul>
            <Link href="/pricing" className="w-full h-12 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:from-emerald-400 hover:to-cyan-400 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all flex items-center justify-center">Get Annual →</Link>
            <p className="text-xs text-center text-white/25 mt-3">Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/*  FINAL CTA                               */}
      {/* ═══════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Stop staring at that text.</h2>
          <p className="text-white/50 text-lg">Drop the screenshot. Get the move. Send in 10 seconds.</p>
          <Link href="/app" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-bold shadow-xl shadow-violet-600/25 px-10 h-14 text-base transition-all hover:scale-[1.02] active:scale-[0.98]">
            Try it free <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-white/20 text-xs">No sign-up &bull; No credit card &bull; 5 free replies/day</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center space-y-6">
            <Logo size="lg" showText={true} />
            <p className="text-sm text-white/40 text-center max-w-md">
              Your AI texting coach — reads the conversation, gives strategy, and writes the reply you wish you thought of.
            </p>
            <div className="flex gap-6 text-sm text-white/30">
              <Link href="/features" className="hover:text-white/60 transition">Features</Link>
              <Link href="/guides" className="hover:text-white/60 transition">Guides</Link>
              <Link href="/terms" className="hover:text-white/60 transition">Terms</Link>
              <Link href="/privacy" className="hover:text-white/60 transition">Privacy</Link>
              <Link href="/contact" className="hover:text-white/60 transition">Contact</Link>
            </div>
            <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} Text Wingman. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent md:hidden z-50">
        <Link href="/app" className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-2xl shadow-violet-600/20 flex items-center justify-center">Try It Free →</Link>
      </div>
    </div>
  );
}
