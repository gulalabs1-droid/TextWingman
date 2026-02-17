import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, MessageCircle, Check, X, ArrowRight, Shield, Zap, Camera, Brain, Target, TrendingDown, TrendingUp, Eye, RefreshCw, Pencil, ChevronDown, Users, Heart, Briefcase, MessageSquare, HelpCircle } from "lucide-react";
import { Logo } from "@/components/Logo";

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Text Wingman',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  description: 'AI-powered texting companion that reads your conversation, coaches the move, writes the reply, reads between the lines, and checks your vibe before you send.',
  url: 'https://textwingman.com',
  offers: [
    { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free — 5 replies/day' },
    { '@type': 'Offer', price: '9.99', priceCurrency: 'USD', description: 'Pro Weekly — Unlimited' },
    { '@type': 'Offer', price: '99.99', priceCurrency: 'USD', description: 'Pro Annual — Best Value' },
  ],
  featureList: [
    'AI reply generation in 3 tones',
    'Subtext Intelligence — AI reads between the lines on playful, coy, and sarcastic messages',
    'Vibe Check — real-time draft analysis',
    'Tone Translator — rewrite messages in different energy',
    'Screenshot briefing — upload a screenshot, get instant replies',
    'Strategy coaching — AI analyzes conversation dynamics',
    'Decode mode — understand what their message really means',
    'Conversation Revive — re-engage dead threads',
    'Opener generator — first messages for any situation',
  ],
  creator: { '@type': 'Organization', name: 'Gula Labs', url: 'https://textwingman.com' },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is Text Wingman free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. 5 replies, 1 decode, 1 opener, and 1 revive per day — no credit card, no trial expiration. Pro unlocks unlimited everything + strategy coaching + the verified pipeline.' } },
    { '@type': 'Question', name: 'Can Text Wingman see my conversations?', acceptedAnswer: { '@type': 'Answer', text: 'No. Messages are processed in real-time and never stored. We don\'t have accounts linked to messaging apps.' } },
    { '@type': 'Question', name: 'What apps does Text Wingman work with?', acceptedAnswer: { '@type': 'Answer', text: 'All of them — iMessage, WhatsApp, Instagram, Tinder, Hinge, Bumble, Facebook Dating, Snapchat, Messenger, Telegram, LinkedIn, and more.' } },
    { '@type': 'Question', name: 'How is Text Wingman different from ChatGPT?', acceptedAnswer: { '@type': 'Answer', text: 'ChatGPT gives you a paragraph that sounds robotic. Wingman gives you 3 short, casual options under 18 words — verified by a 3-agent pipeline. Plus strategy coaching, vibe checking, tone translation, and thread context.' } },
    { '@type': 'Question', name: 'Will people know I\'m using AI?', acceptedAnswer: { '@type': 'Answer', text: 'No. Every reply sounds like a real person texting — lowercase, casual, no emojis, no formal sentences. The 18-word limit keeps it natural.' } },
  ],
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {/* Header/Navbar */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="transition-transform hover:scale-105">
            <Logo size="md" showText={true} className="cursor-pointer" />
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button asChild variant="ghost" className="text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl hidden sm:flex">
              <Link href="/features">Features</Link>
            </Button>
            <Button asChild variant="ghost" className="text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl hidden sm:flex">
              <Link href="/guides">Guides</Link>
            </Button>
            <Button asChild variant="ghost" className="text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl hidden sm:flex">
              <Link href="#pricing">Pricing</Link>
            </Button>
            <Button asChild variant="ghost" className="text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl text-sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-semibold shadow-lg shadow-violet-600/20">
              <Link href="/app">Try Free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════ */}
      {/* 1. HERO — Conversational Intelligence  */}
      {/* ═══════════════════════════════════════ */}
      <section className="container mx-auto px-4 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Headline + Sub */}
          <div className="text-center space-y-5 mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 px-4 py-1.5 rounded-full text-xs font-bold border border-cyan-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              V3.5 — Subtext Intelligence + Vibe Check + Tone Translator
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white">
              Your sharp friend
              <span className="block bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent mt-1">for every conversation.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              Text Wingman reads your conversation, coaches the move, writes the reply, checks your vibe before you send — and now reads between the lines on playful texts like &ldquo;wateveerr&rdquo; and &ldquo;suuure&rdquo;. Like having a sharp friend who actually gets texting.
            </p>
            <p className="text-sm text-white/30 font-medium">
              Free. No card. Vibe check + tone translator + subtext intelligence + threads + decode + openers + revive.
            </p>
          </div>

          {/* Live Demo — Thread + Strategy + Reply */}
          <div className="max-w-3xl mx-auto">
            <Link href="/app" className="block group">
              <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-3xl p-5 sm:p-8 hover:bg-white/[0.06] transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-emerald-500/5 group-hover:border-white/[0.12]">
                
                {/* Mini Thread */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-[11px] font-bold text-white/30 uppercase tracking-wider">Conversation</span>
                    <span className="text-[10px] text-white/20 ml-auto">6 messages</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-start">
                      <div className="bg-white/[0.07] border border-white/[0.06] rounded-2xl rounded-bl-md px-3.5 py-2 max-w-[75%]">
                        <p className="text-white/70 text-xs">&ldquo;wyd tonight&rdquo;</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 rounded-2xl rounded-br-md px-3.5 py-2 max-w-[75%]">
                        <p className="text-white text-xs">&ldquo;probably just staying in, you?&rdquo;</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-white/[0.07] border border-white/[0.06] rounded-2xl rounded-bl-md px-3.5 py-2 max-w-[75%]">
                        <p className="text-white/70 text-xs">&ldquo;my friends bailed on me lol&rdquo;</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 rounded-2xl rounded-br-md px-3.5 py-2 max-w-[75%]">
                        <p className="text-white text-xs">&ldquo;that&apos;s weak of them&rdquo;</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-white/[0.07] border border-white/[0.06] rounded-2xl rounded-bl-lg px-3.5 py-2 max-w-[75%]">
                        <p className="text-white/70 text-xs">&ldquo;right? now I got nothing to do&rdquo;</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strategy Card */}
                <div className="bg-gradient-to-r from-emerald-500/[0.08] to-cyan-500/[0.08] border border-emerald-500/20 rounded-2xl p-4 mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest">Your sharp friend says</span>
                  </div>
                  <p className="text-white/90 text-sm font-semibold mb-2.5">&ldquo;She&apos;s hinting. This is your window — make a move.&rdquo;</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="h-2.5 w-2.5" /> Rising
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-white/50">Balanced</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">escalate</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-white/30">push meetup</span>
                  </div>
                </div>

                {/* Shaped Replies with Edit hint */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                  <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-3">
                    <p className="text-[10px] font-bold text-white/40 mb-1">⚡ Shorter</p>
                    <p className="text-white/80 text-xs">&ldquo;come through then&rdquo;</p>
                  </div>
                  <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-3">
                    <p className="text-[10px] font-bold text-white/40 mb-1">🔥 Spicier</p>
                    <p className="text-white/80 text-xs">&ldquo;sounds like you need a rescue&rdquo;</p>
                  </div>
                  <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-3">
                    <p className="text-[10px] font-bold text-white/40 mb-1">💚 Softer</p>
                    <p className="text-white/80 text-xs">&ldquo;their loss. come chill with me&rdquo;</p>
                  </div>
                </div>

                {/* Vibe Check + Tone Translator demo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
                  <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm leading-none">🟢</span>
                      <span className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest">Vibe Check</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">New</span>
                    </div>
                    <p className="text-emerald-400/80 text-[11px] font-bold">confident & direct</p>
                    <p className="text-white/40 text-[11px]">Perfect energy, send it. 9/10</p>
                  </div>
                  <div className="bg-violet-500/[0.06] border border-violet-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="h-3 w-3 text-violet-400" />
                      <span className="text-violet-300 text-[10px] font-bold uppercase tracking-widest">Tone Translator</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">New</span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-300">😏 Flirty</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300">😎 Chill</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300">🔥 Bold</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300">⚡ Witty</span>
                    </div>
                    <p className="text-white/40 text-[11px] mt-1.5">Rewrite any message in a different energy</p>
                  </div>
                </div>

                {/* CTA Row */}
                <div className="flex items-center justify-between">
                  <p className="text-white/25 text-xs sm:text-sm">Upload a screenshot or build a conversation</p>
                  <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-violet-600/20 group-hover:scale-105 transition-transform shrink-0 ml-4">
                    Try Free
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* 2. WITHOUT / WITH — Context Advantage   */}
      {/* ═══════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Context changes everything.</h2>
          <p className="text-white/50">Other tools see one message. Wingman reads the whole conversation.</p>
        </div>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-5">
          {/* Without Wingman */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
              <span className="text-red-300 font-bold text-xs uppercase tracking-wider">Without Wingman</span>
            </div>
            <div className="space-y-3">
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1.5">They sent</p>
                <p className="text-white/70 text-sm">&ldquo;right? now I got nothing to do&rdquo;</p>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1.5">You think</p>
                <p className="text-white/50 text-sm italic">&ldquo;Wait is she hinting? Should I invite her? What if she says no? I don&apos;t want to seem thirsty&hellip;&rdquo;</p>
              </div>
              <div className="bg-red-500/[0.08] border border-red-500/20 rounded-xl p-3">
                <p className="text-red-300/60 text-[10px] font-bold uppercase tracking-wider mb-1.5">You send</p>
                <p className="text-red-200 text-sm">&ldquo;dang that sucks lol yeah I mean if you want we could maybe link or something idk up to you though&rdquo;</p>
                <p className="text-red-400/60 text-xs mt-2">Overthinking it. Hedging every word. Zero confidence.</p>
              </div>
            </div>
          </div>

          {/* With Wingman */}
          <div className="bg-white/[0.03] border border-emerald-500/20 rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-300 font-bold text-xs uppercase tracking-wider">With Wingman</span>
            </div>
            <div className="space-y-3">
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1.5">Full thread analyzed</p>
                <p className="text-white/50 text-xs">6 messages &bull; Rising momentum &bull; She&apos;s hinting</p>
              </div>
              <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Target className="h-3 w-3 text-emerald-400" />
                  <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-wider">Sharp friend says</p>
                </div>
                <p className="text-white/90 text-sm font-semibold">&ldquo;She&apos;s hinting. This is your window — make a move.&rdquo;</p>
                <div className="flex gap-1.5 mt-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/30">escalate</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/30">push meetup</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/30">add tease</span>
                </div>
              </div>
              <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-xl p-3">
                <p className="text-emerald-300/60 text-[10px] font-bold uppercase tracking-wider mb-1.5">Strategy-shaped reply</p>
                <p className="text-emerald-200 text-sm">&ldquo;come through then&rdquo;</p>
                <p className="text-emerald-400/60 text-xs mt-2">Short. Confident. Reads the subtext. Makes the move.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* 3. HOW IT WORKS — Two Paths             */}
      {/* ═══════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Four modes. Every situation covered.</h2>
          <p className="text-white/50">Reply, Decode, Revive dead convos, or generate Openers — edit any reply and make it yours.</p>
        </div>
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-5">
          {/* Screenshot Path */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 hover:bg-white/[0.05] transition-all">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Camera className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">Screenshot Briefing</h3>
                <p className="text-white/40 text-xs">Fastest path — one upload</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { n: '1', text: 'Upload a screenshot of the conversation' },
                { n: '2', text: 'AI reads every message and identifies who said what' },
                { n: '3', text: 'Get instant briefing — strategy + 3 replies' },
                { n: '4', text: 'Edit any reply to add your ideas, Polish it, then send' },
              ].map((step) => (
                <div key={step.n} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[11px] font-black text-cyan-400">{step.n}</span>
                  </div>
                  <p className="text-white/60 text-sm">{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Thread Path */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 hover:bg-white/[0.05] transition-all">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">Thread Mode</h3>
                <p className="text-white/40 text-xs">Ongoing coaching companion</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { n: '1', text: 'Paste what they sent and hit Generate' },
                { n: '2', text: 'Pick a reply and tap "I sent this" — or type your own' },
                { n: '3', text: 'Paste their next message — AI sees the full thread' },
                { n: '4', text: 'Edit replies, regenerate for fresh options, or keep going' },
              ].map((step) => (
                <div key={step.n} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[11px] font-black text-violet-400">{step.n}</span>
                  </div>
                  <p className="text-white/60 text-sm">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* 4. WHY IT'S DIFFERENT — 3 Pillars      */}
      {/* ═══════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Why it hits different.</h2>
          <p className="text-white/50">Not a chatbot. Not a template. A competitive advantage.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 text-center hover:bg-white/[0.05] transition-all">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-violet-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Reads the whole conversation</h3>
            <p className="text-white/50 text-sm leading-relaxed">Thread-Aware AI sees every message — theirs and yours. Replies fit the flow, not just the last text.</p>
          </div>
          <div className="bg-white/[0.03] border border-emerald-500/10 rounded-3xl p-6 text-center hover:bg-white/[0.05] transition-all">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Target className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Coaches you on the move</h3>
            <p className="text-white/50 text-sm leading-relaxed">StrategyAgent tells you who&apos;s chasing, the momentum, and what to do next — before you see the replies.</p>
          </div>
          <div className="bg-white/[0.03] border border-violet-500/10 rounded-3xl p-6 text-center hover:bg-white/[0.05] transition-all">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <Pencil className="h-6 w-6 text-violet-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Edit + Polish any reply</h3>
            <p className="text-white/50 text-sm leading-relaxed">Add your own ideas to any reply, then hit Polish — AI smooths it out while keeping your words tight.</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 text-center hover:bg-white/[0.05] transition-all">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-cyan-500/15 flex items-center justify-center">
              <Camera className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Screenshot to briefing</h3>
            <p className="text-white/50 text-sm leading-relaxed">Upload a screenshot. Get strategy analysis + 3 replies in seconds. No typing. No pasting.</p>
          </div>
        </div>
        <div className="text-center mt-6">
          <p className="text-white/25 text-xs mb-4">Plus: subtext intelligence, 3-agent verified pipeline, ≤18 word enforcement, regenerate for fresh options, tone confidence scoring</p>
          <Link href="/features" className="text-emerald-400 hover:text-white text-sm font-medium transition-colors inline-flex items-center gap-1">
            See all features <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* 5. WHO IT'S FOR — Scenario Cards        */}
      {/* ═══════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Built for real situations.</h2>
          <p className="text-white/50">Whether it&apos;s a crush, an ex, or your boss — Wingman adapts.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { emoji: '💘', title: 'The crush you can\'t read', desc: 'She left you on delivered for 6 hours then replied "lol sorry I fell asleep." What do you say?', color: 'border-pink-500/20 hover:border-pink-500/30' },
            { emoji: '💔', title: 'The ex who texted back', desc: '"Hey, been thinking about you" at 1am. You need the perfect response — not too eager, not too cold.', color: 'border-red-500/20 hover:border-red-500/30' },
            { emoji: '✨', title: 'New match, first message', desc: 'You matched on Hinge. Her bio says "take me somewhere I\'ve never been." What\'s your opener?', color: 'border-violet-500/20 hover:border-violet-500/30' },
            { emoji: '💼', title: 'Work text you can\'t mess up', desc: 'Your manager sent a passive-aggressive "Per my last message..." and you need to reply professionally.', color: 'border-blue-500/20 hover:border-blue-500/30' },
            { emoji: '👻', title: 'The convo that died', desc: 'You were talking every day, then she stopped replying. It\'s been 4 days. Revive Mode handles this.', color: 'border-cyan-500/20 hover:border-cyan-500/30' },
            { emoji: '🤝', title: 'Friend drama', desc: '"Are you mad at me?" — your friend is upset and you don\'t want to make it worse. Get the right tone.', color: 'border-green-500/20 hover:border-green-500/30' },
          ].map((scenario, i) => (
            <div key={i} className={`bg-white/[0.03] border ${scenario.color} rounded-2xl p-5 transition-all hover:bg-white/[0.05]`}>
              <span className="text-2xl mb-3 block">{scenario.emoji}</span>
              <h3 className="font-bold text-white text-sm mb-2">{scenario.title}</h3>
              <p className="text-white/40 text-xs leading-relaxed">{scenario.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button asChild className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-bold shadow-lg shadow-violet-600/20 px-8 h-12">
            <Link href="/app">Handle it now &mdash; free <ArrowRight className="h-4 w-4 ml-2" /></Link>
          </Button>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* 6. FAQ — Kill Objections                */}
      {/* ═══════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Questions?</h2>
          <p className="text-white/50">The stuff everyone asks before they try it.</p>
        </div>
        <div className="max-w-2xl mx-auto space-y-3">
          {[
            {
              q: 'Is it actually free?',
              a: 'Yes. 5 replies, 1 decode, 1 opener, and 1 revive per day — no credit card, no trial expiration. Pro unlocks unlimited everything + strategy coaching + the verified pipeline.',
            },
            {
              q: 'Can you see my conversations?',
              a: 'No. Messages are processed in real-time and never stored. We don\'t have accounts linked to messaging apps — you paste or screenshot what you want help with, and that\'s it.',
            },
            {
              q: 'What apps does it work with?',
              a: 'All of them. iMessage, WhatsApp, Instagram, Tinder, Hinge, Bumble, Facebook Dating, Snapchat, Messenger, Telegram, LinkedIn — anything with text. Screenshot upload auto-detects the platform.',
            },
            {
              q: 'How is this different from just asking ChatGPT?',
              a: 'ChatGPT gives you a paragraph that sounds like a robot wrote it. Wingman gives you 3 short, casual options under 18 words — verified by a 3-agent pipeline. Plus strategy coaching, vibe checking, tone translation, and thread context that ChatGPT can\'t do.',
            },
            {
              q: 'Will people know I\'m using AI?',
              a: 'No. Every reply is designed to sound like a real person texting — lowercase, casual, no emojis, no formal sentences. The 18-word limit keeps it natural. Plus you can edit any reply and add your own ideas.',
            },
            {
              q: 'What\'s the Vibe Check?',
              a: 'As you type your own message, AI analyzes it in real-time and tells you how it reads — "too eager", "perfectly unbothered", "a bit needy" — with a score out of 10 and a one-line tip. Like Grammarly for your texting game.',
            },
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

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Simple pricing.</h2>
          <p className="text-white/50">Start free. Upgrade when you need the sharp friend.</p>
          <p className="text-xs text-emerald-400/60 mt-3 font-medium">Founder pricing — lock in these rates forever</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 hover:bg-white/[0.05] transition-all">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">Free</h3>
              <p className="text-white/40 text-sm">Get a real taste</p>
              <div className="mt-4">
                <span className="text-4xl font-black text-white">$0</span>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" /> 5 replies per day
              </li>
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" /> Thread Mode
              </li>
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" /> Screenshot Briefing + Edit & Polish
              </li>
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" /> 1 decode + 1 opener + 1 revive / day
              </li>
              <li className="flex items-center gap-3 text-white/30 text-sm">
                <X className="h-4 w-4 text-white/15 flex-shrink-0" /> Strategy Mode
              </li>
              <li className="flex items-center gap-3 text-white/30 text-sm">
                <X className="h-4 w-4 text-white/15 flex-shrink-0" /> V2 Verified pipeline
              </li>
            </ul>
            <Button asChild className="w-full h-12 text-sm font-bold rounded-xl bg-white/[0.06] border border-white/[0.12] text-white hover:bg-white/[0.10] transition-all">
              <Link href="/app">Start Free →</Link>
            </Button>
            <p className="text-xs text-center text-white/25 mt-3">No credit card required</p>
          </div>

          {/* Pro Weekly - Highlighted */}
          <div className="relative bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-3xl p-6 hover:border-violet-500/40 transition-all">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-5 py-1.5 rounded-full text-xs font-black shadow-lg shadow-violet-600/30 whitespace-nowrap">
              MOST POPULAR
            </div>
            <div className="mb-6 pt-2">
              <h3 className="text-xl font-bold text-white">Pro Weekly</h3>
              <p className="text-white/40 text-sm">Full companion access</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-black text-white">$9.99</span>
                <span className="text-white/40 mb-1">/week</span>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-white text-sm font-medium">
                <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Unlimited replies
              </li>
              <li className="flex items-center gap-3 text-white text-sm font-medium">
                <Target className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Strategy Mode — AI coaching
              </li>
              <li className="flex items-center gap-3 text-white text-sm font-medium">
                <Shield className="h-4 w-4 text-emerald-400 flex-shrink-0" /> V2 Verified pipeline
              </li>
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Edit + Polish — make any reply yours
              </li>
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Unlimited decodes, openers &amp; revives
              </li>
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Cancel anytime
              </li>
            </ul>
            <Button asChild className="w-full h-14 text-base font-black rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-xl shadow-violet-600/20 hover:scale-[1.02] transition-all">
              <Link href="/pricing">Get Pro →</Link>
            </Button>
            <p className="text-xs text-center text-white/30 mt-3">7-day free trial available</p>
          </div>

          {/* Pro Annual - Best Value */}
          <div className="relative bg-white/[0.03] border border-emerald-500/20 rounded-3xl p-6 hover:bg-white/[0.05] transition-all">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-5 py-1.5 rounded-full text-xs font-black shadow-lg shadow-emerald-500/30 whitespace-nowrap">
              SAVE 80%
            </div>
            <div className="mb-6 pt-2">
              <h3 className="text-xl font-bold text-white">Pro Annual</h3>
              <p className="text-white/40 text-sm">Best value — $1.92/week</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-black text-white">$99.99</span>
                <span className="text-white/40 mb-1">/year</span>
              </div>
              <p className="text-emerald-400 text-xs font-bold mt-1">Save $419 vs weekly</p>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-white text-sm font-medium">
                <Sparkles className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Everything in Pro Weekly
              </li>
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Price locked forever
              </li>
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> First access to new features
              </li>
              <li className="flex items-center gap-3 text-white/70 text-sm">
                <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Priority support
              </li>
            </ul>
            <Button asChild className="w-full h-12 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:from-emerald-400 hover:to-cyan-400 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all">
              <Link href="/pricing">Get Annual →</Link>
            </Button>
            <p className="text-xs text-center text-white/25 mt-3">Billed once, in full. Cancel anytime.</p>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="border-t border-white/[0.06] pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center space-y-6">
            <Logo size="lg" showText={true} />
            <p className="text-sm text-white/40 text-center max-w-md">
              Your AI texting companion — reads the conversation, coaches the move, writes the reply, and lets you make it yours.
            </p>
            <div className="flex gap-6 text-sm text-white/30">
              <Link href="/guides" className="hover:text-white/60 transition">
                Guides
              </Link>
              <Link href="/terms" className="hover:text-white/60 transition">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-white/60 transition">
                Privacy
              </Link>
              <Link href="/contact" className="hover:text-white/60 transition">
                Contact
              </Link>
            </div>
            <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} Text Wingman. All rights reserved.</p>
            <p className="text-xs text-white/15">Built with care in DC — made for real conversations.</p>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent md:hidden z-50">
        <Button asChild className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-2xl shadow-violet-600/20">
          <Link href="/app">Try It Free →</Link>
        </Button>
      </div>
    </div>
  );
}
