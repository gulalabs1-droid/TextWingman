import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, MessageCircle, Zap, Check, X, Star, ArrowRight, Brain, Filter, Target, Heart, Briefcase, Users } from "lucide-react";
import { Logo } from "@/components/Logo";
import { AnimatedShowcase } from "@/components/AnimatedShowcase";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-purple-600">
      {/* Urgency Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white text-center py-2 px-4 text-sm font-medium">
        <span className="animate-pulse inline-block mr-2">🚀</span>
        Launch Special: <span className="font-bold">$7/mo</span> — Price increases Jan 1st
        <Link href="#pricing" className="ml-2 underline hover:no-underline">Lock it in →</Link>
      </div>

      {/* Header/Navbar */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="transition-transform hover:scale-105">
            <Logo size="md" showText={true} className="cursor-pointer" />
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 rounded-xl hidden sm:flex">
              <Link href="/app">Try V1</Link>
            </Button>
            <Button asChild variant="ghost" className="relative text-white hover:bg-white/10 rounded-xl border border-violet-400/30 bg-violet-600/10">
              <Link href="/v2" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>V2 Preview</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-white text-black hover:bg-gray-100 rounded-xl font-semibold">
              <Link href="#pricing">Pricing</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-16 text-center">
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-medium border border-white/20">
            <Sparkles className="h-4 w-4" />
            AI-Powered Text Replies
          </div>
          
          <p className="text-lg md:text-xl text-purple-200 font-medium">
            Replies that hit. Confidence that shows.
          </p>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white">
            Never Text Alone
            <span className="block bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mt-2">Again</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            Paste any DM or message and instantly get 3 perfect replies. Choose your vibe: Shorter, Spicier, or Softer.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 h-14 bg-white text-black hover:bg-gray-100 shadow-2xl hover:shadow-white/30 rounded-2xl font-bold transition-all duration-300 active:scale-95 hover:scale-105">
              <Link href="/app">
                Try It Free
                <MessageCircle className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" className="text-lg px-8 h-14 bg-purple-600 text-white hover:bg-purple-700 border-2 border-purple-400 rounded-2xl font-semibold transition-all duration-300 active:scale-95 hover:scale-105 shadow-lg hover:shadow-purple-400/40">
              <Link href="#before-after" className="scroll-smooth">See It In Action</Link>
            </Button>
          </div>
          
          {/* Trust Line */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-white/60">
            <span className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-400" /> Free forever
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-400" /> No credit card
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" /> Loved by 1,000+ texters
            </span>
          </div>
        </div>

        {/* Animated Showcase */}
        <div className="mt-12 md:mt-16">
          <AnimatedShowcase />
        </div>
      </section>

      {/* Before & After Section */}
      <section id="before-after" className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">The Glow-Up Is Real</h2>
          <p className="text-white/70">See the difference AI makes</p>
        </div>
        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Before */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span className="text-red-300 font-semibold text-sm uppercase tracking-wide">Before</span>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">They said:</p>
                <p className="text-white">&ldquo;wyd tonight?&rdquo;</p>
              </div>
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Your reply:</p>
                <p className="text-red-200">&ldquo;nm just chilling hbu&rdquo;</p>
                <p className="text-red-400 text-xs mt-2">😬 Dry. No energy. Conversation killer.</p>
              </div>
            </div>
          </div>
          {/* After */}
          <div className="bg-white/5 backdrop-blur border border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-green-300 font-semibold text-sm uppercase tracking-wide">After (with Wingman)</span>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">They said:</p>
                <p className="text-white">&ldquo;wyd tonight?&rdquo;</p>
              </div>
              <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Your reply:</p>
                <p className="text-green-200">&ldquo;depends... what&apos;d you have in mind? 👀&rdquo;</p>
                <p className="text-green-400 text-xs mt-2">✨ Smooth. Curious. Keeps it going.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Works For Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">Works For Every Conversation</h2>
          <p className="text-white/70">Pick your vibe, we handle the rest</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-pink-600 to-purple-700 border-0 text-white text-center hover:scale-105 transition-transform shadow-xl shadow-pink-500/20">
            <CardContent className="pt-6 pb-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/20 flex items-center justify-center">
                <Heart className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Dating</h3>
              <p className="text-white/90 text-sm">Flirty, tension-building replies that keep them interested</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-600 to-cyan-700 border-0 text-white text-center hover:scale-105 transition-transform shadow-xl shadow-blue-500/20">
            <CardContent className="pt-6 pb-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/20 flex items-center justify-center">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Friends</h3>
              <p className="text-white/90 text-sm">Casual, witty responses with just the right humor</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-slate-600 to-gray-700 border-0 text-white text-center hover:scale-105 transition-transform shadow-xl shadow-gray-500/20">
            <CardContent className="pt-6 pb-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/20 flex items-center justify-center">
                <Briefcase className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Work</h3>
              <p className="text-white/90 text-sm">Professional, clean replies that sound polished</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Why It Hits Harder Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Why Text Wingman Hits Harder</h2>
          <p className="text-white/70">Not just another AI — built specifically for texting</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-center hover:bg-white/15 transition-all">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-purple-500/30 flex items-center justify-center">
              <Brain className="h-6 w-6 text-purple-300" />
            </div>
            <h3 className="font-bold text-white mb-2">Detects Intent</h3>
            <p className="text-white/80 text-sm">Reads tone + hidden meaning in their message</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-center hover:bg-white/15 transition-all">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-pink-500/30 flex items-center justify-center">
              <Target className="h-6 w-6 text-pink-300" />
            </div>
            <h3 className="font-bold text-white mb-2">Matches Your Style</h3>
            <p className="text-white/80 text-sm">Short, confident, smooth — your vibe, amplified</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-center hover:bg-white/15 transition-all">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-500/30 flex items-center justify-center">
              <Filter className="h-6 w-6 text-blue-300" />
            </div>
            <h3 className="font-bold text-white mb-2">Filters Cringe</h3>
            <p className="text-white/80 text-sm">No over-texting, no needy vibes, no L replies</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-center hover:bg-white/15 transition-all">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-yellow-500/30 flex items-center justify-center">
              <Zap className="h-6 w-6 text-yellow-300" />
            </div>
            <h3 className="font-bold text-white mb-2">3 Optimized Options</h3>
            <p className="text-white/80 text-sm">Shorter, Spicier, Softer — pick your perfect reply</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 mt-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-white">How It Works</h2>
          <p className="text-xl text-white/80">
            Three simple steps to perfect replies
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-8">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <CardTitle>Paste Message</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Copy any message you received and paste it into Text Wingman
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <CardTitle>Get 3 Options</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AI generates Shorter, Spicier, and Softer reply options instantly
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <CardTitle>Copy & Send</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Choose your favorite, copy it, and send with confidence
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20 mt-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-white">Simple Pricing</h2>
          <p className="text-xl text-white/80">
            Choose the plan that works for you
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 pt-8 pb-4">
          {/* Free Tier */}
          <Card className="relative overflow-hidden bg-white/95 backdrop-blur border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl">
            <CardHeader className="pb-8 pt-8 bg-gradient-to-br from-gray-50 to-white">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-gray-900">Free</CardTitle>
                <CardDescription className="text-base text-gray-600">Perfect to get started</CardDescription>
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
                  <span className="text-gray-700 font-medium">All 3 tone options</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Smart context selector</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="h-4 w-4 text-gray-400" />
                  </div>
                  <span className="text-gray-400 font-medium">Smart vibe tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="h-4 w-4 text-gray-400" />
                  </div>
                  <span className="text-gray-400 font-medium">Tone calibration</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="h-4 w-4 text-gray-400" />
                  </div>
                  <span className="text-gray-400 font-medium">Priority speed</span>
                </li>
              </ul>
              <Button asChild className="w-full h-12 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all" variant="outline">
                <Link href="/app">Start Free →</Link>
              </Button>
              <p className="text-xs text-center text-gray-500">No credit card required</p>
            </CardContent>
          </Card>

          {/* Monthly */}
          <Card className="relative overflow-visible bg-gradient-to-br from-purple-600 to-indigo-600 border-0 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 rounded-3xl">
            <CardHeader className="pb-8 pt-8">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-white">Pro Monthly</CardTitle>
                <CardDescription className="text-base text-purple-100">Unlimited replies for any conversation</CardDescription>
              </div>
              <div className="mt-6 mb-2 flex items-end gap-2">
                <span className="text-5xl font-black text-white">$7</span>
                <span className="text-xl text-purple-200 mb-1.5">/month</span>
              </div>
              <p className="text-sm text-purple-200">Less than a coffee ☕</p>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-bold">Never run out of replies ♾️</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-medium">Shorter, Spicier, Softer tones</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-medium">Flex with share cards 🔗</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4 text-yellow-300" />
                  </div>
                  <span className="text-yellow-200 font-bold">Smart Vibe Tracking 🎯</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-medium">Priority support</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-medium">Cancel anytime</span>
                </li>
              </ul>
              <Button asChild className="w-full h-14 text-lg font-black rounded-xl bg-white text-purple-700 hover:bg-gray-100 shadow-2xl hover:shadow-purple-900/30 hover:scale-105 transition-all">
                <Link href="/app">Get Pro Now →</Link>
              </Button>
              <p className="text-xs text-center text-purple-200 mt-2">Instant upgrade — no interruption to your chats</p>
            </CardContent>
          </Card>

          {/* Annual */}
          <Card className="relative overflow-visible bg-white/95 backdrop-blur border-2 border-purple-400 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-6 py-2 rounded-full text-sm font-black shadow-xl whitespace-nowrap">
              🔥 MOST POPULAR
            </div>
            <div className="absolute top-14 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg rotate-3">
              SAVE 65%
            </div>
            <CardHeader className="pb-8 pt-12 bg-gradient-to-br from-purple-50 to-white">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-gray-900">Pro Annual</CardTitle>
                <CardDescription className="text-base text-gray-600">Best value — save over 65%</CardDescription>
              </div>
              <div className="mt-6 mb-2 flex items-end gap-2">
                <span className="text-5xl font-black text-gray-900">$29</span>
                <span className="text-xl text-gray-500 mb-1.5">/year</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-green-600">Save $55 vs monthly!</p>
                <p className="text-xs text-gray-500">Just $2.42/month • <span className="font-semibold">Only $0.08/day</span></p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-gray-900 font-bold">Everything in Pro Monthly ✨</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Text like a legend, forever</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Price locked — never pay more 🔒</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700 font-medium">First dibs on new features</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700 font-medium">VIP support — skip the line</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Smart vibe tracking 🎯</span>
                </li>
              </ul>
              <Button asChild className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
                <Link href="/app">Get Annual Deal →</Link>
              </Button>
              <p className="text-xs text-center text-gray-500">Billed once, in full. Cancel anytime.</p>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Table */}
        <div className="max-w-2xl mx-auto mt-16 px-4">
          <h3 className="text-2xl font-bold text-white text-center mb-8">Free vs Pro</h3>
          <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-4 text-white/80 font-medium">Feature</th>
                  <th className="text-center p-4 text-white/80 font-medium">Free</th>
                  <th className="text-center p-4 text-white font-bold bg-purple-600/30">Pro</th>
                </tr>
              </thead>
              <tbody className="text-white/90">
                <tr className="border-b border-white/10">
                  <td className="p-4">Daily replies</td>
                  <td className="text-center p-4">5</td>
                  <td className="text-center p-4 bg-purple-600/10 font-bold">Unlimited ♾️</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-4">Tone options</td>
                  <td className="text-center p-4">3</td>
                  <td className="text-center p-4 bg-purple-600/10">3</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-4">Viral share cards</td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-red-400 mx-auto" /></td>
                  <td className="text-center p-4 bg-purple-600/10"><Check className="h-5 w-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-4">Smart vibe tracking</td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-red-400 mx-auto" /></td>
                  <td className="text-center p-4 bg-purple-600/10"><Check className="h-5 w-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4">Priority support</td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-red-400 mx-auto" /></td>
                  <td className="text-center p-4 bg-purple-600/10"><Check className="h-5 w-5 text-green-400 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Loved by Texters Everywhere</h2>
          <p className="text-white/70">Join 1,000+ happy users crushing their conversations</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Testimonial 1 */}
          <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
            <CardContent className="pt-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-white/90 mb-4">
                &ldquo;I used to overthink every text. Now I just paste and pick. My dating life has never been smoother 🔥&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">J</div>
                <div>
                  <p className="font-semibold">Jake M.</p>
                  <p className="text-sm text-white/60">Pro user since 2024</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial 2 */}
          <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
            <CardContent className="pt-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-white/90 mb-4">
                &ldquo;The softer tone option saved my relationship. Seriously. Best $7 I ever spent.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">S</div>
                <div>
                  <p className="font-semibold">Sarah K.</p>
                  <p className="text-sm text-white/60">Annual subscriber</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial 3 */}
          <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
            <CardContent className="pt-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-white/90 mb-4">
                &ldquo;Finally, an AI that actually gets texting culture. The spicier replies are *chef&apos;s kiss* 💯&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">M</div>
                <div>
                  <p className="font-semibold">Marcus T.</p>
                  <p className="text-sm text-white/60">Power user</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/20">
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
            <p className="text-xs text-white/40">&copy; 2025 Text Wingman. All rights reserved.</p>
            <p className="text-xs text-white/30 mt-2">Built with ❤️ by real people in DC — made for real conversations.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
