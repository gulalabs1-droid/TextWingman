import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, MessageCircle, Zap, Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { AnimatedShowcase } from "@/components/AnimatedShowcase";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-purple-600">
      {/* Header/Navbar */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="transition-transform hover:scale-105">
            <Logo size="md" showText={true} className="cursor-pointer" />
          </Link>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 rounded-xl">
              <Link href="/app">Try Now</Link>
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
              <Link href="#pricing" className="scroll-smooth">View Pricing</Link>
            </Button>
          </div>
        </div>

        {/* Animated Showcase */}
        <div className="mt-12 md:mt-16">
          <AnimatedShowcase />
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
              </ul>
              <Button asChild className="w-full h-12 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all" variant="outline">
                <Link href="/app">Start Free →</Link>
              </Button>
              <p className="text-xs text-center text-gray-500">No credit card required</p>
            </CardContent>
          </Card>

          {/* Monthly */}
          <Card className="relative overflow-visible bg-gradient-to-br from-purple-600 to-indigo-600 border-0 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 rounded-3xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-6 py-2 rounded-full text-sm font-black shadow-xl whitespace-nowrap">
              🔥 MOST POPULAR
            </div>
            <CardHeader className="pb-8 pt-12">
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
                  <span className="text-white font-bold">Unlimited AI replies ♾️</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-medium">All 3 tone styles</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-medium">Viral share cards 🔗</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-medium">Priority support 🚀</span>
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
              <p className="text-xs text-center text-purple-200">Join 1,000+ happy users</p>
            </CardContent>
          </Card>

          {/* Annual */}
          <Card className="relative overflow-hidden bg-white/95 backdrop-blur border-2 border-purple-300 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl">
            <div className="absolute top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg rotate-3">
              SAVE 65%
            </div>
            <CardHeader className="pb-8 pt-8 bg-gradient-to-br from-purple-50 to-white">
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
                <p className="text-xs text-gray-500">Just $2.42/month</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-gray-900 font-bold">Everything in Pro ✨</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Unlimited replies forever</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Lock in this price 🔒</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Early access to new features</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700 font-medium">VIP support channel</span>
                </li>
              </ul>
              <Button asChild className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
                <Link href="/app">Get Annual Deal →</Link>
              </Button>
              <p className="text-xs text-center text-gray-500">Limited time offer</p>
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
            <p className="text-xs text-white/40">&copy; 2024 Text Wingman. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
