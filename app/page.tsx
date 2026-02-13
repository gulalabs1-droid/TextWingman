import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, MessageCircle, Check, X, ArrowRight, Shield, Zap, Camera, Brain, ChevronRight } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-purple-600">
      {/* Header/Navbar */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="transition-transform hover:scale-105">
            <Logo size="md" showText={true} className="cursor-pointer" />
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 rounded-xl hidden sm:flex">
              <Link href="/features">Features</Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 rounded-xl hidden sm:flex">
              <Link href="#pricing">Pricing</Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 rounded-xl text-sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="sm" className="bg-white text-black hover:bg-gray-100 rounded-xl font-semibold">
              <Link href="/app">Try Free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════ */}
      {/* 1. HERO — Outcome-Focused             */}
      {/* ═══════════════════════════════════════ */}
      <section className="container mx-auto px-4 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Headline + Sub */}
          <div className="text-center space-y-5 mb-12 md:mb-16">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white">
              Win Every
              <span className="block bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mt-1">Text.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-lg mx-auto">
              Stop overthinking. Start sending. Paste a message or screenshot — get verified replies in seconds.
            </p>
            <p className="text-sm text-white/40 font-medium">
              Free. No card. 5 replies + decode + opener every day.
            </p>
          </div>

          {/* Live Demo Flow Visual */}
          <div className="max-w-3xl mx-auto">
            <Link href="/app" className="block group">
              <div className="bg-white/[0.06] backdrop-blur border border-white/10 rounded-3xl p-5 sm:p-8 hover:bg-white/[0.09] transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-purple-500/10 group-hover:border-white/20">
                {/* Step Flow */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-3 mb-6">
                  {/* Step 1: Input */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Camera className="h-3.5 w-3.5 text-purple-300" />
                      </div>
                      <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Input</span>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl p-3">
                      <p className="text-white/80 text-sm">&ldquo;lol ok well lmk&rdquo;</p>
                    </div>
                  </div>
                  {/* Step 2: Decode */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 relative">
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 hidden md:block">
                      <ChevronRight className="h-4 w-4 text-white/20" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Brain className="h-3.5 w-3.5 text-amber-300" />
                      </div>
                      <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Decode</span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-amber-200/80 text-xs">They&apos;re pulling away.</p>
                      <p className="text-white/50 text-xs">Fading interest — last chance energy.</p>
                    </div>
                  </div>
                  {/* Step 3: Replies */}
                  <div className="bg-white/5 border border-green-500/10 rounded-2xl p-4 space-y-2.5 relative">
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 hidden md:block">
                      <ChevronRight className="h-4 w-4 text-white/20" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Shield className="h-3.5 w-3.5 text-green-300" />
                      </div>
                      <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Verified</span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-green-200/90 text-xs">&ldquo;let&apos;s do friday, 8pm&rdquo;</p>
                      <p className="text-green-200/90 text-xs">&ldquo;i got something better in mind&rdquo;</p>
                    </div>
                  </div>
                </div>

                {/* CTA Row */}
                <div className="flex items-center justify-between">
                  <p className="text-white/30 text-xs sm:text-sm">Paste a message, upload a screenshot, or type a situation</p>
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg group-hover:scale-105 transition-transform shrink-0 ml-4">
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
      {/* 2. BEFORE / AFTER — Works For Every Vibe */}
      {/* ═══════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Works For Every Vibe</h2>
          <p className="text-white/60">From dry to magnetic in one tap</p>
        </div>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Dating */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-red-300 font-semibold text-xs uppercase tracking-wider">Before</span>
                <span className="ml-auto text-xs text-white/40">💕 Dating</span>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3 mb-2">
                <p className="text-white text-sm">&ldquo;wyd tonight?&rdquo;</p>
              </div>
              <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-3">
                <p className="text-red-200 text-sm">&ldquo;chillin, u?&rdquo;</p>
                <p className="text-red-400/80 text-xs mt-1.5">Low effort. Dead end.</p>
              </div>
            </div>
            <div className="bg-white/5 border border-green-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="text-green-300 font-semibold text-xs uppercase tracking-wider">After</span>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3 mb-2">
                <p className="text-white text-sm">&ldquo;wyd tonight?&rdquo;</p>
              </div>
              <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-3">
                <p className="text-green-200 text-sm">&ldquo;depends. what u thinking?&rdquo;</p>
                <p className="text-green-400/80 text-xs mt-1.5">Short. Confident. Ball in their court.</p>
              </div>
            </div>
          </div>
          {/* Friends */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-red-300 font-semibold text-xs uppercase tracking-wider">Before</span>
                <span className="ml-auto text-xs text-white/40">🤝 Friends</span>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3 mb-2">
                <p className="text-white text-sm">&ldquo;u tryna link up?&rdquo;</p>
              </div>
              <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-3">
                <p className="text-red-200 text-sm">&ldquo;idk bro maybe later&rdquo;</p>
                <p className="text-red-400/80 text-xs mt-1.5">Flaky. Non-committal.</p>
              </div>
            </div>
            <div className="bg-white/5 border border-green-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="text-green-300 font-semibold text-xs uppercase tracking-wider">After</span>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3 mb-2">
                <p className="text-white text-sm">&ldquo;u tryna link up?&rdquo;</p>
              </div>
              <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-3">
                <p className="text-green-200 text-sm">&ldquo;say less, pull up&rdquo;</p>
                <p className="text-green-400/80 text-xs mt-1.5">Decisive. High energy. No hesitation.</p>
              </div>
            </div>
          </div>
          {/* Work */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-red-300 font-semibold text-xs uppercase tracking-wider">Before</span>
                <span className="ml-auto text-xs text-white/40">💼 Work</span>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3 mb-2">
                <p className="text-white text-sm">&ldquo;can you get this done by end of day?&rdquo;</p>
              </div>
              <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-3">
                <p className="text-red-200 text-sm">&ldquo;yeah sure I guess&rdquo;</p>
                <p className="text-red-400/80 text-xs mt-1.5">Passive. No confidence.</p>
              </div>
            </div>
            <div className="bg-white/5 border border-green-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="text-green-300 font-semibold text-xs uppercase tracking-wider">After</span>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3 mb-2">
                <p className="text-white text-sm">&ldquo;can you get this done by end of day?&rdquo;</p>
              </div>
              <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-3">
                <p className="text-green-200 text-sm">&ldquo;on it, will have it over by 5&rdquo;</p>
                <p className="text-green-400/80 text-xs mt-1.5">Clear. Professional. Committed.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* 3. HOW IT WORKS — 3 Simple Steps       */}
      {/* ═══════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">How It Works</h2>
          <p className="text-white/60">Three steps. Ten seconds.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { step: '1', title: 'Paste', desc: 'Drop in the message you received — or upload a screenshot' },
            { step: '2', title: 'Generate', desc: 'Pick the vibe and hit generate. Get 3 reply options instantly.' },
            { step: '3', title: 'Send', desc: 'Copy your favorite reply and paste it into your chat. Done.' },
          ].map((s) => (
            <div key={s.step} className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="text-2xl font-black text-white">{s.step}</span>
              </div>
              <h3 className="text-lg font-bold text-white">{s.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* 4. WHY IT'S DIFFERENT — 3 Pillars      */}
      {/* ═══════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Why It Hits Different</h2>
          <p className="text-white/60">Every reply is verified before you see it.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/[0.07] transition-all">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-purple-300" />
            </div>
            <h3 className="font-bold text-white mb-2">3-Agent Verified</h3>
            <p className="text-white/60 text-sm">One AI drafts. Another checks the rules. A third verifies the tone. If it fails, it gets auto-revised.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/[0.07] transition-all">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Zap className="h-6 w-6 text-green-300" />
            </div>
            <h3 className="font-bold text-white mb-2">≤18 Words. No Emojis.</h3>
            <p className="text-white/60 text-sm">Short, confident, no desperate energy. Every reply is enforced against rules that make texts actually hit.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/[0.07] transition-all">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-blue-300" />
            </div>
            <h3 className="font-bold text-white mb-2">Tone Confidence Scored</h3>
            <p className="text-white/60 text-sm">Each reply gets a confidence score — so you know it matches the energy you asked for before you send it.</p>
          </div>
        </div>
        <div className="text-center mt-8">
          <Link href="/features" className="text-purple-300 hover:text-white text-sm font-medium transition-colors inline-flex items-center gap-1">
            See all features <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20 mt-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-white">Simple Pricing</h2>
          <p className="text-xl text-white/80">
            Start free. Upgrade when you&apos;re ready.
          </p>
          <p className="text-sm text-purple-300 mt-4">Founder pricing — lock in these rates forever</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4 pt-8 pb-4">
          {/* Free Tier */}
          <Card className="relative overflow-hidden bg-white/95 backdrop-blur border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl">
            <CardHeader className="pb-8 pt-8 bg-gradient-to-br from-gray-50 to-white">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-gray-900">Free</CardTitle>
                <CardDescription className="text-base text-gray-600">Get a real taste</CardDescription>
              </div>
              <div className="mt-6 mb-2">
                <span className="text-5xl font-black text-gray-900">$0</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium">5 replies per day</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium">1 message decode per day</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium">1 opener per day</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Screenshot upload</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="h-4 w-4 text-gray-400" />
                  </div>
                  <span className="text-gray-400 font-medium">V2 Verified replies</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="h-4 w-4 text-gray-400" />
                  </div>
                  <span className="text-gray-400 font-medium">Saved threads</span>
                </li>
              </ul>
              <Button asChild className="w-full h-12 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all" variant="outline">
                <Link href="/app">Start Free →</Link>
              </Button>
              <p className="text-xs text-center text-gray-500">No credit card required</p>
            </CardContent>
          </Card>

          {/* Pro Weekly - Highlighted */}
          <Card className="relative overflow-visible bg-gradient-to-br from-purple-600 to-indigo-600 border-0 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 rounded-3xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-purple-700 px-6 py-2 rounded-full text-sm font-black shadow-xl whitespace-nowrap">
              MOST POPULAR
            </div>
            <CardHeader className="pb-8 pt-12">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-white">Pro Weekly</CardTitle>
                <CardDescription className="text-base text-purple-100">Unlimited everything</CardDescription>
              </div>
              <div className="mt-6 mb-2 flex items-end gap-2">
                <span className="text-5xl font-black text-white">$9.99</span>
                <span className="text-xl text-purple-200 mb-1.5">/week</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-bold">Unlimited replies</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-bold">Unlimited decodes</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-bold">Unlimited openers</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-medium">Saved threads</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4 text-green-200" />
                  </div>
                  <span className="text-green-200 font-bold">V2 Verified — always on</span>
                </li>
              </ul>
              <Button asChild className="w-full h-14 text-lg font-black rounded-xl bg-white text-purple-700 hover:bg-gray-100 shadow-2xl hover:shadow-purple-900/30 hover:scale-105 transition-all">
                <Link href="/pricing">Get Pro →</Link>
              </Button>
              <p className="text-xs text-center text-purple-200">Cancel anytime</p>
            </CardContent>
          </Card>

          {/* Pro Annual - Best Value */}
          <Card className="relative overflow-visible bg-white/95 backdrop-blur border-2 border-purple-400 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-full text-sm font-black shadow-xl whitespace-nowrap">
              BEST VALUE
            </div>
            <div className="absolute top-14 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg rotate-3">
              SAVE 80%
            </div>
            <CardHeader className="pb-8 pt-12 bg-gradient-to-br from-purple-50 to-white">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-gray-900">Pro Annual</CardTitle>
                <CardDescription className="text-base text-gray-600">Best value — save 80%</CardDescription>
              </div>
              <div className="mt-6 mb-2 flex items-end gap-2">
                <span className="text-5xl font-black text-gray-900">$99.99</span>
                <span className="text-xl text-gray-500 mb-1.5">/year</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-green-600">Save $419 vs weekly</p>
                <p className="text-xs text-gray-500">Just $1.92/week</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-gray-900 font-bold">Everything in Pro Weekly</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Price locked forever</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700 font-medium">First access to new features</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Priority support</span>
                </li>
              </ul>
              <Button asChild className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
                <Link href="/pricing">Get Annual →</Link>
              </Button>
              <p className="text-xs text-center text-gray-500">Billed once, in full. Cancel anytime.</p>
            </CardContent>
          </Card>
        </div>

      </section>


      {/* Footer */}
      <footer className="border-t border-white/20 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center space-y-6">
            <Logo size="lg" showText={true} />
            <p className="text-sm text-white/60 text-center max-w-md">
              Your AI-powered text companion for perfect replies every time.
            </p>
            <div className="flex gap-6 text-sm text-white/60">
              <Link href="/terms" className="hover:text-white transition">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-white transition">
                Privacy
              </Link>
              <Link href="/contact" className="hover:text-white transition">
                Contact
              </Link>
            </div>
            <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} Text Wingman. All rights reserved.</p>
            <p className="text-xs text-white/30 mt-2">Built with ❤️ by real people in DC — made for real conversations.</p>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent md:hidden z-50">
        <Button asChild className="w-full h-12 text-base font-bold rounded-xl bg-white text-black hover:bg-gray-100 shadow-2xl">
          <Link href="/app">Try It Free →</Link>
        </Button>
      </div>
    </div>
  );
}
