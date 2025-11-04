import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, MessageCircle, Zap, Check } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-purple-600">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-20 text-center">
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

        {/* Demo Screenshot Placeholder */}
        <div className="max-w-md md:max-w-2xl mx-auto mt-12 md:mt-16">
          <div className="rounded-3xl border-4 border-white/20 bg-white/10 backdrop-blur shadow-2xl p-6 md:p-8">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl h-80 md:h-96 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Zap className="h-16 md:h-20 w-16 md:w-20 text-white mx-auto" />
                <p className="text-base md:text-lg font-medium text-white/90">
                  App Demo Preview
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-center gap-8 text-center text-white/80">
          <div>
            <div className="text-3xl font-bold text-white">10K+</div>
            <div className="text-sm">Users</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">50K+</div>
            <div className="text-sm">Replies Generated</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">4.9★</div>
            <div className="text-sm">User Rating</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-white">How It Works</h2>
          <p className="text-xl text-white/80">
            Three simple steps to perfect replies
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-white">Simple Pricing</h2>
          <p className="text-xl text-white/80">
            Choose the plan that works for you
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Try it out</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>5 replies per day</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>All 3 tone options</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>Basic support</span>
                </li>
              </ul>
              <Button asChild className="w-full" variant="outline">
                <Link href="/app">Get Started</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Monthly */}
          <Card className="border-primary border-2 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </div>
            <CardHeader>
              <CardTitle>Monthly</CardTitle>
              <CardDescription>Unlimited access</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$7</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span className="font-medium">Unlimited replies</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>All 3 tone options</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>Share card generator</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Button asChild className="w-full">
                <Link href="/app">Start Now</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Annual */}
          <Card>
            <CardHeader>
              <CardTitle>Annual</CardTitle>
              <CardDescription>Best value</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-muted-foreground">/year</span>
              </div>
              <p className="text-sm text-primary font-medium">Save $55</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span className="font-medium">Unlimited replies</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>All 3 tone options</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>Share card generator</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Button asChild className="w-full" variant="outline">
                <Link href="/app">Get Annual</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-white/60">
            <p>&copy; 2024 Text Wingman. All rights reserved.</p>
            <div className="flex gap-6 justify-center mt-4">
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
          </div>
        </div>
      </footer>
    </div>
  );
}
