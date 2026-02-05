'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle2, 
  Sparkles, 
  Shield, 
  Target, 
  TrendingUp,
  ChevronDown,
  Loader2,
  Mail
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function V2TeaserPage() {
  const [email, setEmail] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(true);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          ref: referralSource || null 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        setShowStickyBar(false);
        toast({
          title: "You're in! 🎉",
          description: "We'll email you when V2 goes live.",
        });
        
        // Track event (optional)
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'v2_waitlist_submit', {
            event_category: 'engagement',
            event_label: 'v2_waitlist'
          });
        }
      } else {
        toast({
          title: 'Oops!',
          description: data.error || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to join waitlist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToWaitlist = () => {
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="transition-transform hover:scale-105">
            <Logo size="md" showText={true} className="cursor-pointer" />
          </Link>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 rounded-xl">
              <Link href="/app">Try App</Link>
            </Button>
            <Button 
              asChild
              size="sm" 
              className="bg-green-600 text-white hover:bg-green-700 rounded-xl font-semibold"
            >
              <Link href="/pricing">Get Pro</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <motion.div 
          className="max-w-4xl mx-auto text-center space-y-8"
          initial="initial"
          animate="animate"
          variants={staggerChildren}
        >
          <motion.div 
            variants={fadeIn}
            className="inline-flex items-center gap-2 bg-green-600/20 backdrop-blur text-green-400 px-4 py-2 rounded-full text-sm font-medium border border-green-500/30"
          >
            <CheckCircle2 className="h-4 w-4" />
            V2 is Live for Pro Users
          </motion.div>
          
          <motion.h1 
            variants={fadeIn}
            className="text-5xl md:text-7xl font-bold tracking-tight"
          >
            Replies that get it right
            <span className="block bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mt-2">
              verified by 3 AI agents.
            </span>
          </motion.h1>
          
          <motion.p 
            variants={fadeIn}
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
          >
            V2 is <span className="text-green-400 font-semibold">now live</span> for Pro users. A 3-agent pipeline that drafts, enforces rules (≤18 words, no emojis, no needy text), and verifies tone. Every reply is checked twice before you see it.
          </motion.p>
          
          <motion.div 
            variants={fadeIn}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Button 
              asChild
              size="lg" 
              className="text-lg px-8 h-14 bg-green-600 text-white hover:bg-green-700 rounded-2xl font-bold shadow-2xl shadow-green-600/20"
            >
              <Link href="/app">Try V2 Now →</Link>
            </Button>
            <Button 
              asChild
              size="lg" 
              className="text-lg px-8 h-14 border-2 border-white bg-transparent text-white hover:bg-white/10 rounded-2xl font-semibold"
            >
              <Link href="/pricing">Get Pro Access</Link>
            </Button>
          </motion.div>

          {/* Badges */}
          <motion.div 
            variants={fadeIn}
            className="flex flex-wrap justify-center gap-3 pt-8"
          >
            {['3-Agent Pipeline', '≤18 Words Enforced', 'Tone-Verified', 'No Emojis • No Needy Text'].map((badge, idx) => (
              <div 
                key={idx}
                className="px-4 py-2 rounded-full border border-violet-400/50 bg-violet-500/15 text-violet-200 text-sm font-medium"
              >
                {badge}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerChildren}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={fadeIn} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              How Dual-Check AI™ verifies your reply
            </h2>
            <p className="text-xl text-gray-300">
              Four agents working together to get it right
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Draft Agent */}
            <motion.div variants={fadeIn}>
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-violet-500/50 h-full hover:border-violet-400 transition-all">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-violet-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">Draft Agent</h3>
                  <p className="text-gray-300">A/B/C options fast.</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Rule-Check */}
            <motion.div variants={fadeIn}>
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/50 h-full hover:border-blue-400 transition-all">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">Rule-Check</h3>
                  <p className="text-gray-300">≤ 18 words, no emojis, no double-text, respectful boundaries.</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Context Agent */}
            <motion.div variants={fadeIn}>
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500/50 h-full hover:border-purple-400 transition-all">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">Context Agent</h3>
                  <p className="text-gray-300">Adapts phrasing for Crush / New Match / Friend / Work / Family.</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tone Verify */}
            <motion.div variants={fadeIn}>
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-green-500/50 h-full hover:border-green-400 transition-all">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">Tone Verify</h3>
                  <p className="text-gray-300">Confirms Shorter / Spicier / Softer actually matches length + assertiveness + warmth.</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* V1 vs V2 Comparison */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerChildren}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={fadeIn} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">V1 vs V2</h2>
            <p className="text-xl text-gray-300">Evolution of accuracy</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* V1 */}
            <motion.div variants={fadeIn}>
              <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700 h-full backdrop-blur">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">V1</h3>
                    <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-300 text-sm font-medium border border-blue-500/30">
                      Live
                    </span>
                  </div>
                  <ul className="space-y-4">
                    {[
                      'Quick A/B/C replies',
                      'Tone toggles (Shorter / Spicier / Softer)',
                      'Share-card (They said / I said)',
                      '3 free/day · Pro $9.99/week'
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-200">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full mt-6 bg-white text-black hover:bg-gray-200 border-0" variant="outline">
                    <Link href="/app">Try V1 Now</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* V2 */}
            <motion.div variants={fadeIn}>
              <Card className="bg-gradient-to-br from-violet-900/40 to-purple-900/40 border-violet-500/70 h-full relative overflow-hidden backdrop-blur">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <CardContent className="p-8 relative">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">V2</h3>
                    <span className="px-3 py-1 rounded-full bg-green-600/30 text-green-300 text-sm font-medium border border-green-400/30 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Live Now
                    </span>
                  </div>
                  <ul className="space-y-4">
                    {[
                      '3-Agent Pipeline: Draft → Rule-Check → Tone-Verify',
                      'Enforced: ≤18 words, no emojis, no needy language',
                      'Auto-revise: Fixes violations up to 2x before showing',
                      'Confidence scores + verification badges'
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-white font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    asChild
                    className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold"
                  >
                    <Link href="/app">Try V2 Now</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Timeline */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerChildren}
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={fadeIn} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">What V2 Does</h2>
            <p className="text-xl text-gray-300">The 3-agent verification pipeline</p>
          </motion.div>

          <div className="space-y-6">
            {[
              { period: 'Step 1', title: 'Draft Agent', desc: 'Generates 3 reply options: Shorter, Spicier, Softer' },
              { period: 'Step 2', title: 'Rule-Check Agent', desc: 'Enforces ≤18 words, no emojis, no needy language, no double questions. Auto-revises up to 2x.' },
              { period: 'Step 3', title: 'Tone-Verify Agent', desc: 'Confirms each reply matches its intended tone. Scores confidence 0-100.' },
              { period: 'Result', title: 'Verified Replies', desc: 'You see badges: ✅ Rule-Compliant • ✅ Tone Verified • Confidence %' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeIn}
                className="flex gap-6 items-start"
              >
                <div className="flex-shrink-0 w-24">
                  <div className="px-3 py-1 rounded-full bg-violet-600/10 text-violet-400 text-sm font-medium text-center">
                    {item.period}
                  </div>
                </div>
                <Card className="flex-1 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700 backdrop-blur">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-1 text-white">{item.title}</h3>
                    <p className="text-gray-300">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerChildren}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeIn} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">FAQ</h2>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                q: 'Why do your replies feel more accurate?',
                a: "Because we don't ship the first draft. V2 runs four agents on every reply: draft, rule-check, context, and tone-verify."
              },
              {
                q: 'Does V1 still work?',
                a: 'Yes! V1 is live and free to use. V2 adds the 3-agent verification pipeline for Pro users.'
              }
            ].map((item, idx) => (
              <motion.div key={idx} variants={fadeIn}>
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700 backdrop-blur">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-3 text-white">{item.q}</h3>
                    <p className="text-gray-300 leading-relaxed">{item.a}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="container mx-auto px-4 py-20">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerChildren}
          className="max-w-2xl mx-auto"
        >
          <Card className="bg-gradient-to-br from-violet-100 to-purple-100 border-violet-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-8 md:p-12 relative">
              {!isSubmitted ? (
                <>
                  <motion.div variants={fadeIn} className="text-center mb-8">
                    <Mail className="h-16 w-16 text-violet-600 mx-auto mb-6" />
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Be first on V2</h2>
                    <p className="text-xl text-gray-700">
                      Drop your email. We&apos;ll invite you to test Dual-Check AI™ early.
                    </p>
                  </motion.div>

                  <motion.form variants={fadeIn} onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-14 text-lg bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-violet-600 focus:ring-violet-600"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Input
                        type="text"
                        placeholder="Where did you hear about this? (optional)"
                        value={referralSource}
                        onChange={(e) => setReferralSource(e.target.value)}
                        className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-violet-600 focus:ring-violet-600"
                        disabled={isSubmitting}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      className="w-full h-14 text-lg font-bold bg-violet-600 hover:bg-violet-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        'Join Waitlist'
                      )}
                    </Button>
                  </motion.form>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-400" />
                  </div>
                  <h3 className="text-3xl font-bold mb-3">You&apos;re in! 🎉</h3>
                  <p className="text-xl text-gray-400">
                    We&apos;ll email you when V2 goes live.
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Sticky Mobile Bar */}
      {showStickyBar && !isSubmitted && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-gray-800 p-4 md:hidden z-50">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-gray-300">
              V2 is live for Pro
            </span>
            <Button 
              onClick={scrollToWaitlist}
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 font-bold"
            >
              Join
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center space-y-6">
            <Logo size="lg" showText={true} />
            <p className="text-gray-500 text-sm">
              Built by Text Wingman • Dual-Check AI™
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Contact</Link>
            </div>
            <p className="text-gray-600 text-xs">
              © 2025 Text Wingman. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
