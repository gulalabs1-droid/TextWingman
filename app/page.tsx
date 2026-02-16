import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, MessageCircle, Check, X, ArrowRight, Shield, Zap, Camera, Brain, Target, TrendingDown, Eye, RefreshCw } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
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
              <RefreshCw className="h-3.5 w-3.5" />
              V3.2 — Revive Mode + Screenshot Briefing
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white">
              Your sharp friend
              <span className="block bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent mt-1">for every conversation.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              Text Wingman reads your whole conversation, tells you the move, and writes the reply. Like having a sharp friend reading over your shoulder.
            </p>
            <p className="text-sm text-white/30 font-medium">
              Free. No card. Threads + replies + decode + openers + revive every day.
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
                        <p className="text-white/70 text-xs">&ldquo;hey how&apos;s your day going&rdquo;</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 rounded-2xl rounded-br-md px-3.5 py-2 max-w-[75%]">
                        <p className="text-white text-xs">&ldquo;pretty good, long week though&rdquo;</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-white/[0.07] border border-white/[0.06] rounded-2xl rounded-bl-md px-3.5 py-2 max-w-[75%]">
                        <p className="text-white/70 text-xs">&ldquo;lol same. what u getting into this weekend&rdquo;</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 rounded-2xl rounded-br-md px-3.5 py-2 max-w-[75%]">
                        <p className="text-white text-xs">&ldquo;not sure yet, might just chill&rdquo;</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-white/[0.07] border border-white/[0.06] rounded-2xl rounded-bl-lg px-3.5 py-2 max-w-[75%]">
                        <p className="text-white/70 text-xs">&ldquo;oh ok lol&rdquo;</p>
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
                  <p className="text-white/90 text-sm font-semibold mb-2.5">&ldquo;You&apos;re boring her. Stop playing it safe.&rdquo;</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 flex items-center gap-1">
                      <TrendingDown className="h-2.5 w-2.5" /> Declining
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-white/50">You leading</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">escalate</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-white/30">add tease</span>
                  </div>
                </div>

                {/* Shaped Replies */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
                  <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-3">
                    <p className="text-[10px] font-bold text-white/40 mb-1">⚡ Shorter</p>
                    <p className="text-white/80 text-xs">&ldquo;come find out&rdquo;</p>
                  </div>
                  <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-3">
                    <p className="text-[10px] font-bold text-white/40 mb-1">🔥 Spicier</p>
                    <p className="text-white/80 text-xs">&ldquo;boring answer. you should fix that&rdquo;</p>
                  </div>
                  <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-3">
                    <p className="text-[10px] font-bold text-white/40 mb-1">💚 Softer</p>
                    <p className="text-white/80 text-xs">&ldquo;we should do something fun then&rdquo;</p>
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
                <p className="text-white/70 text-sm">&ldquo;oh ok lol&rdquo;</p>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1.5">You think</p>
                <p className="text-white/50 text-sm italic">&ldquo;What does that even mean? Are they mad? Bored? Should I double text?&rdquo;</p>
              </div>
              <div className="bg-red-500/[0.08] border border-red-500/20 rounded-xl p-3">
                <p className="text-red-300/60 text-[10px] font-bold uppercase tracking-wider mb-1.5">You send</p>
                <p className="text-red-200 text-sm">&ldquo;haha yeah so anyway what are you up to this weekend do you wanna maybe hang out or something&rdquo;</p>
                <p className="text-red-400/60 text-xs mt-2">Overexplaining. Needy. No awareness of the dynamic.</p>
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
                <p className="text-white/50 text-xs">6 messages &bull; Declining momentum &bull; You leading</p>
              </div>
              <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Target className="h-3 w-3 text-emerald-400" />
                  <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-wider">Sharp friend says</p>
                </div>
                <p className="text-white/90 text-sm font-semibold">&ldquo;You&apos;re chasing. Let them come to you.&rdquo;</p>
                <div className="flex gap-1.5 mt-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/30">keep short</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/30">no questions</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/30">add tease</span>
                </div>
              </div>
              <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-xl p-3">
                <p className="text-emerald-300/60 text-[10px] font-bold uppercase tracking-wider mb-1.5">Strategy-shaped reply</p>
                <p className="text-emerald-200 text-sm">&ldquo;boring answer. you should fix that&rdquo;</p>
                <p className="text-emerald-400/60 text-xs mt-2">Short. Teasing. Confident. Strategy-compliant.</p>
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
          <p className="text-white/50">Reply, Decode, Revive dead convos, or generate Openers — all from screenshots or text.</p>
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
                { n: '4', text: 'Copy your reply and go, or continue in Thread' },
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
                { n: '4', text: 'Strategy coach + shaped replies every round' },
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
        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 text-center hover:bg-white/[0.05] transition-all">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-violet-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Reads the whole conversation</h3>
            <p className="text-white/50 text-sm leading-relaxed">Thread-Aware AI sees every message — theirs and yours. Every reply fits the flow, not just the last text.</p>
          </div>
          <div className="bg-white/[0.03] border border-emerald-500/10 rounded-3xl p-6 text-center hover:bg-white/[0.05] transition-all">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Target className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Coaches you on the move</h3>
            <p className="text-white/50 text-sm leading-relaxed">StrategyAgent tells you who&apos;s chasing, what the momentum is, and what to do next — before you even see the replies.</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 text-center hover:bg-white/[0.05] transition-all">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-cyan-500/15 flex items-center justify-center">
              <Camera className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Screenshot to briefing</h3>
            <p className="text-white/50 text-sm leading-relaxed">Upload a screenshot. Get the full read — strategy analysis + 3 replies — in seconds. No typing. No pasting.</p>
          </div>
        </div>
        <div className="text-center mt-6">
          <p className="text-white/25 text-xs mb-4">Plus: 3-agent verified pipeline, ≤18 word enforcement, tone confidence scoring</p>
          <Link href="/features" className="text-emerald-400 hover:text-white text-sm font-medium transition-colors inline-flex items-center gap-1">
            See all features <ArrowRight className="h-3.5 w-3.5" />
          </Link>
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
                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" /> Screenshot Briefing
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
                <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Thread-aware AI conversations
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
              Your AI texting companion — reads the conversation, coaches the move, writes the reply.
            </p>
            <div className="flex gap-6 text-sm text-white/30">
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
