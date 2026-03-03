'use client';

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Check, ArrowRight, Shield, Camera, Target, TrendingUp, ChevronDown, Brain, Zap, Upload, Lock } from "lucide-react";
import { Logo } from "@/components/Logo";

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Text Wingman',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  description: 'AI texting coach that reads your conversation, gives strategy, and generates replies you\'d actually send. Crush, ex, friend, coworker — one coach that adapts to every situation.',
  url: 'https://textwingman.com',
  offers: [
    { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free — 5 replies/day' },
    { '@type': 'Offer', price: '9.99', priceCurrency: 'USD', description: 'Pro Weekly — Unlimited' },
    { '@type': 'Offer', price: '99.99', priceCurrency: 'USD', description: 'Pro Annual — Best Value' },
  ],
  featureList: [
    'Deep Analysis — upload a screenshot, get 6 reply options scored by a critic agent with a clear winner',
    'AI texting coach — ask anything, get strategy + replies in one chat',
    'Screenshot upload — instant full conversation analysis',
    'Visible scoring metrics — Neediness Risk, Clarity, Forward Motion, Tone Match on every candidate',
    'Strategy breakdown — momentum, balance, energy, sharp one-liner on every analysis',
    'Conversation intelligence — detects tone, unanswered questions, power dynamics',
    'Decode mode — understand what their message really means',
    'Conversation Revive — re-engage dead threads',
    'Opener generator — first messages for any situation',
    'Verified pipeline — every reply quality-checked for neediness, strategy alignment, and natural voice',
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
  const [showSticky, setShowSticky] = useState(false);
  const compRef = useRef<HTMLDivElement>(null);
  const [compVisible, setCompVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowSticky(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setCompVisible(true); }, { threshold: 0.3 });
    if (compRef.current) obs.observe(compRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ═══ Navbar ═══ */}
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

      {/* ═══ HERO ═══ */}
      <section className="container mx-auto px-4 pt-16 pb-16 md:pt-24 md:pb-24">
        <div className="max-w-4xl mx-auto text-center space-y-6 mb-14 md:mb-20">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-300 px-4 py-1.5 rounded-full text-xs font-bold border border-violet-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            New — Context-Aware Coach: friend, work &amp; dating modes
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.05]">
            Stop overthinking.
            <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent mt-2">Start sending.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
            Drop a screenshot. Coach runs a full analysis — 6 reply options scored against each other, one clear winner, full strategy breakdown. The sharpest reply every time.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/app" className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-bold shadow-xl shadow-violet-600/25 px-8 h-14 text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
              Try it free <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-white/25 text-xs">No sign-up required &bull; 5 free replies/day</p>
          </div>
        </div>

        {/* Animated Live Demo */}
        <div className="max-w-2xl mx-auto">
          <Link href="/app" className="block group">
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-3xl p-5 sm:p-7 hover:bg-white/[0.06] transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-violet-500/5 group-hover:border-white/[0.14] overflow-hidden">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-white/70 text-sm font-bold">Coach</span>
                <span className="ml-auto px-2 py-0.5 rounded-lg text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/15">Deep Analysis</span>
              </div>

              {/* User message — fades in */}
              <div className="flex justify-end mb-3 animate-[fadeSlideUp_0.6s_ease-out_0.3s_both]">
                <div className="bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 border border-violet-500/15 rounded-2xl rounded-br-md px-4 py-2.5 max-w-[85%]">
                  <p className="text-white/85 text-[13px] leading-relaxed">she said &ldquo;my friends bailed on me lol&rdquo; what do I say?</p>
                </div>
              </div>

              {/* Coach analysis — fades in with delay */}
              <div className="flex justify-start mb-4 animate-[fadeSlideUp_0.6s_ease-out_0.8s_both]">
                <div className="max-w-[95%] space-y-2.5">
                  {/* Strategy pills */}
                  <div className="flex flex-wrap gap-1.5 px-1 animate-[fadeSlideUp_0.4s_ease-out_1.0s_both]">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 flex items-center gap-1"><TrendingUp className="h-2.5 w-2.5" />Rising</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.06] text-white/40 border border-white/[0.08]">Balanced</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400/60 border border-emerald-500/15">escalate</span>
                  </div>
                  <p className="text-[11px] text-white/40 italic px-1 animate-[fadeSlideUp_0.4s_ease-out_1.2s_both]">&ldquo;She&apos;s hinting. Make the move. Don&apos;t ask — suggest.&rdquo;</p>
                  {/* Winner card */}
                  <div className="relative animate-[fadeSlideUp_0.5s_ease-out_1.4s_both]">
                    <div className="absolute -top-1.5 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 z-10">
                      <Shield className="h-2.5 w-2.5 text-amber-400" />
                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Winner</span>
                    </div>
                    <div className="mt-1 px-4 pt-5 pb-3 rounded-xl bg-amber-500/[0.08] border border-amber-500/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">🎯 Clean Direct</span>
                        <span className="text-[10px] text-amber-400/50">Copy →</span>
                      </div>
                      <p className="text-[13px] text-white/90 font-medium">come through then</p>
                      <p className="text-[9px] text-amber-400/40 mt-1">💡 Low neediness, high forward motion, matches energy</p>
                    </div>
                  </div>
                  {/* Backup card */}
                  <div className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] animate-[fadeSlideUp_0.5s_ease-out_1.7s_both]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-bold text-white/30 uppercase">Backup</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400">😏 Playful Tease</span>
                    </div>
                    <p className="text-[12px] text-white/65">sounds like you need saving</p>
                  </div>
                  <p className="text-[9px] text-white/20 px-1 animate-[fadeSlideUp_0.4s_ease-out_2.0s_both]">+ 4 more candidates · tap to see all scores</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-white/20 text-xs">Drop a screenshot. Get 6 scored options. Send the winner.</p>
                <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-violet-600/20 group-hover:scale-105 transition-transform shrink-0 ml-4">
                  Try it <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
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

      {/* ═══ 3 STEPS — moved up so people see the simple process first ═══ */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Three steps. That&apos;s it.</h2>
          <p className="text-white/40">No learning curve. No setup. Just results.</p>
        </div>
        <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { n: '1', icon: <Upload className="h-5 w-5 text-violet-400" />, title: 'Drop it in', desc: 'Screenshot, paste their message, or just ask Coach what to do.' },
            { n: '2', icon: <Brain className="h-5 w-5 text-fuchsia-400" />, title: 'Coach reads everything', desc: 'Tone, momentum, power dynamics, unanswered questions — nothing gets missed.' },
            { n: '3', icon: <Zap className="h-5 w-5 text-emerald-400" />, title: 'Send with confidence', desc: '3 verified reply options under 18 words. No neediness, no generic fluff.' },
          ].map(step => (
            <div key={step.n} className="text-center space-y-4 group">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.05] border border-white/[0.10] flex items-center justify-center group-hover:border-violet-500/30 group-hover:shadow-lg group-hover:shadow-violet-500/10 transition-all duration-300">
                {step.icon}
              </div>
              <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-violet-600/20">{step.n}</div>
              <h3 className="font-bold text-white">{step.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/app" className="text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors">
            See it in action →
          </Link>
        </div>
      </section>

      {/* ═══ COMPARISON — scroll-triggered animation on right card ═══ */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">The difference is embarrassing.</h2>
          <p className="text-white/50">Other tools see one message. Coach reads the full conversation.</p>
        </div>
        <div ref={compRef} className="max-w-4xl mx-auto grid md:grid-cols-2 gap-5">
          {/* Left — Without */}
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
          {/* Right — With (animated on scroll) */}
          <div className={`bg-white/[0.03] border border-emerald-500/20 rounded-3xl p-6 space-y-4 transition-all duration-700 ${compVisible ? 'opacity-100 translate-y-0 shadow-2xl shadow-emerald-500/5 border-emerald-500/30' : 'opacity-40 translate-y-4'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full bg-emerald-400 transition-all duration-500 ${compVisible ? 'scale-100' : 'scale-0'}`} />
              <span className="text-emerald-300 font-bold text-xs uppercase tracking-wider">With Wingman</span>
            </div>
            <div className={`bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 transition-all duration-500 delay-100 ${compVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <p className="text-white/40 text-[10px] font-bold uppercase mb-1.5">Coach reads the thread</p>
              <p className="text-white/50 text-xs">6 messages &bull; Rising momentum &bull; She&apos;s hinting</p>
            </div>
            <div className={`bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl p-3 transition-all duration-500 delay-300 ${compVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Target className="h-3 w-3 text-emerald-400" />
                <p className="text-emerald-300 text-[10px] font-bold uppercase">Coach says</p>
              </div>
              <p className="text-white/90 text-sm font-semibold">&ldquo;She&apos;s hinting. Make a move. Don&apos;t ask — suggest.&rdquo;</p>
            </div>
            <div className={`flex flex-wrap gap-1.5 transition-all duration-500 delay-500 ${compVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 flex items-center gap-1"><TrendingUp className="h-2.5 w-2.5" />Rising</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.06] text-white/40 border border-white/[0.08]">Balanced</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400/60 border border-emerald-500/15">escalate</span>
            </div>
            <div className={`bg-emerald-500/[0.06] border border-emerald-500/15 rounded-xl p-3 transition-all duration-500 delay-700 ${compVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <p className="text-emerald-300/60 text-[10px] font-bold uppercase mb-1.5">You send</p>
              <p className="text-emerald-200 text-sm font-semibold">&ldquo;come through then&rdquo;</p>
              <p className="text-emerald-400/60 text-[11px] mt-2">3 words. She&apos;s on her way.</p>
            </div>
          </div>
        </div>
        <div className="text-center mt-10">
          <Link href="/app" className="text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors">
            See it in action →
          </Link>
        </div>
      </section>

      {/* ═══ FEATURES — 5 cards, horizontal scroll mobile, 3-col desktop ═══ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">One coach. Every situation.</h2>
            <p className="text-white/50">No tabs. No modes. Just tell Coach what you need.</p>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0 max-w-4xl md:mx-auto scrollbar-hide">
          {[
            { icon: '🏆', title: 'Deep Analysis', desc: '6 candidates scored by a critic agent. Winner badge. Backup option.' },
            { icon: '🎯', title: 'Context-aware mode', desc: 'Dating, friend, or work — Coach changes its whole coaching approach for each.' },
            { icon: '📊', title: 'Visible metrics', desc: 'Neediness Risk, Clarity, Forward Motion — see exactly why it won.' },
            { icon: '🔍', title: 'Decode messages', desc: 'Intent, subtext, red/green flags revealed.' },
            { icon: '🔥', title: 'Revive dead chats', desc: 'Re-engage without looking thirsty.' },
            { icon: '📸', title: 'Screenshot upload', desc: 'Drop it in — triggers the full analysis pipeline.' },
          ].map((f) => (
            <div key={f.title} className="min-w-[220px] snap-center md:min-w-0 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-violet-500/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 group">
              <span className="text-3xl block mb-4 group-hover:scale-110 transition-transform duration-300">{f.icon}</span>
              <h3 className="font-bold text-white text-sm mb-2">{f.title}</h3>
              <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SCENARIOS — 6 cards across 3 categories ═══ */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Built for every situation.</h2>
          <p className="text-white/50">Coach knows who you&apos;re talking to and changes its whole approach.</p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-500/10 text-pink-300 border border-pink-500/20">💘 Dating</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">🤝 Friends</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">💼 Work</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {[
            { emoji: '💘', tag: 'Dating', tagColor: 'bg-pink-500/10 text-pink-300 border-pink-500/20', title: 'The crush you can\'t read', desc: 'Left on delivered for 6 hours then replied "lol sorry I fell asleep." Coach reads the momentum and gives you the exact move.', color: 'border-pink-500/20 hover:border-pink-500/30' },
            { emoji: '💔', tag: 'Dating', tagColor: 'bg-pink-500/10 text-pink-300 border-pink-500/20', title: 'The ex who texted back', desc: '"Hey, been thinking about you" at 1am. Not too eager, not too cold — Coach walks the line perfectly.', color: 'border-red-500/20 hover:border-red-500/30' },
            { emoji: '🧊', tag: 'Dating', tagColor: 'bg-pink-500/10 text-pink-300 border-pink-500/20', title: 'The convo that died', desc: 'Talking every day, then nothing for 4 days. Coach writes the re-engagement without looking thirsty.', color: 'border-cyan-500/20 hover:border-cyan-500/30' },
            { emoji: '🤝', tag: 'Friend', tagColor: 'bg-blue-500/10 text-blue-300 border-blue-500/20', title: 'The friendship that\'s drifting', desc: 'You used to talk every day. Now it\'s been two weeks. Coach helps you reach back without making it weird.', color: 'border-blue-500/20 hover:border-blue-500/30' },
            { emoji: '😬', tag: 'Friend', tagColor: 'bg-blue-500/10 text-blue-300 border-blue-500/20', title: 'After the awkward moment', desc: 'Said something weird, or they did. Coach helps you address it directly and move on — no over-apologizing.', color: 'border-indigo-500/20 hover:border-indigo-500/30' },
            { emoji: '💼', tag: 'Work', tagColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20', title: 'The message to your boss', desc: 'Asking for something, pushing back, or following up. Coach calibrates for professional dynamics — clear ask, right tone.', color: 'border-amber-500/20 hover:border-amber-500/30' },
          ].map((s, i) => (
            <div key={i} className={`bg-white/[0.03] border ${s.color} rounded-2xl p-6 transition-all hover:bg-white/[0.05] hover:-translate-y-1 hover:shadow-lg duration-300`}>
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{s.emoji}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.tagColor}`}>{s.tag}</span>
              </div>
              <h3 className="font-bold text-white mb-2">{s.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/app" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-bold shadow-lg shadow-violet-600/20 px-8 py-3.5 transition-all hover:scale-[1.02] active:scale-[0.98]">
            Handle it now — free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ═══ PRICING — moved up so users see cost early ═══ */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Simple pricing.</h2>
          <p className="text-white/50">Start free. Upgrade when you need the sharp friend always on call.</p>
          <p className="text-xs text-emerald-400/60 mt-3 font-medium">Founder pricing — lock in these rates forever</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 hover:bg-white/[0.05] transition-all duration-300">
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
          <div className="relative bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-3xl p-6 hover:border-violet-500/40 transition-all duration-300">
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
            <Link href="/pricing" className="w-full h-14 text-base font-black rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-xl shadow-violet-600/20 hover:scale-[1.02] transition-all flex items-center justify-center animate-[gentlePulse_3s_ease-in-out_infinite]">Get Pro →</Link>
            <p className="text-xs text-center text-white/30 mt-3">7-day free trial available</p>
          </div>
          <div className="relative bg-white/[0.03] border border-emerald-500/20 rounded-3xl p-6 hover:bg-white/[0.05] transition-all duration-300">
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

      {/* ═══ FAQ — glass-morph expand ═══ */}
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
            { q: 'How is this different from ChatGPT?', a: 'ChatGPT gives you one generic paragraph. Wingman runs a full analysis — 6 reply options generated and scored against each other by a critic agent. You see a winner, a backup, strategy pills, and visible metrics. No guessing. No robotic sentences.' },
            { q: 'Does it work for texts outside of dating?', a: 'Yes — and the coaching actually changes based on who you\'re texting. Select Friend or Work and Coach switches to a completely different mode. Work messages get professional calibration (clarity, no slang, power dynamics). Friend messages get warmth and honesty without pressure. Dating is still the core focus, but everything else is fully supported.' },
            { q: 'Will people know I\'m using AI?', a: 'No. Every reply sounds like a real person — lowercase, casual, no emojis. The 18-word limit keeps it natural. Plus you can edit any reply.' },
          ].map((faq, i) => (
            <details key={i} className="group bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] rounded-2xl overflow-hidden hover:bg-white/[0.05] hover:border-white/[0.14] transition-all duration-300">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                <span className="font-bold text-white text-sm pr-4">{faq.q}</span>
                <ChevronDown className="h-4 w-4 text-white/30 shrink-0 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5 -mt-1 animate-[fadeSlideUp_0.3s_ease-out]">
                <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
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

      {/* Floating Sticky CTA — appears after scrolling past hero */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ${showSticky ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="p-4 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent">
          <div className="max-w-lg mx-auto">
            <Link href="/app" className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-2xl shadow-violet-600/30 flex items-center justify-center gap-2 hover:from-violet-500 hover:to-fuchsia-500 transition-all">
              <Sparkles className="h-4 w-4" /> Try It Free
            </Link>
          </div>
        </div>
      </div>

      {/* Custom keyframes */}
      <style jsx>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gentlePulse {
          0%, 100% { box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.2); }
          50% { box-shadow: 0 10px 35px -5px rgba(139, 92, 246, 0.4); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
