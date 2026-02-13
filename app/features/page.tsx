import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { ArrowRight, Brain, Send, BookmarkCheck, Camera, Shield, Sparkles, MessageCircle, Check, Zap } from 'lucide-react';
import { CURRENT_VERSION } from '@/lib/changelog';

const FEATURES = [
  {
    id: 'reply-generator',
    badge: 'Core',
    badgeColor: 'bg-purple-500',
    icon: MessageCircle,
    iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    title: 'Reply Generator',
    tagline: 'Paste their message. Get 3 perfect replies.',
    description: 'Drop any text message into Text Wingman and instantly get three reply options — Shorter (brief & casual), Spicier (playful & flirty), and Softer (warm & genuine). Each reply is crafted to match the context and vibe of the conversation.',
    howItWorks: [
      'Paste the message you received',
      'Pick the context (crush, friend, work, etc.)',
      'Hit Generate and get 3 replies instantly',
      'Copy your favorite and paste it into your chat',
    ],
    example: {
      input: '"Hey, what are you doing this weekend?"',
      outputs: [
        { tone: 'Shorter', text: 'Nothing set yet, why what\'s up', emoji: '⚡' },
        { tone: 'Spicier', text: 'Depends, you planning something fun or boring', emoji: '🔥' },
        { tone: 'Softer', text: 'Keeping it open — would love to hang if you\'re free', emoji: '💚' },
      ],
    },
  },
  {
    id: 'decoder',
    badge: 'New',
    badgeColor: 'bg-amber-500',
    icon: Brain,
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    title: 'Message Decoder',
    tagline: '"What do they actually mean?"',
    description: 'Ever stare at a text wondering what they really mean? The Decoder analyzes the subtext, intent, and emotional energy behind any message. It catches things you might miss — like whether they\'re testing you, pulling away, or genuinely interested.',
    howItWorks: [
      'Paste a message (or full conversation thread)',
      'Hit the 🧠 Decode button',
      'See the intent, subtext, energy level, and flags',
      'Get a Coach Tip on exactly how to respond',
    ],
    example: {
      input: '"lol ok well lmk"',
      outputs: [
        { tone: 'Intent', text: 'They\'re giving you one last chance to commit before they move on', emoji: '🎯' },
        { tone: 'Energy', text: 'Pulling away — low effort response signals fading interest', emoji: '🚪' },
        { tone: 'Coach Tip', text: 'Don\'t match their energy. Be specific: suggest a plan with a time and place.', emoji: '💡' },
      ],
    },
  },
  {
    id: 'opener',
    badge: 'New',
    badgeColor: 'bg-pink-500',
    icon: Send,
    iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600',
    title: 'Opening Line Generator',
    tagline: 'Start conversations that actually go somewhere.',
    description: 'Don\'t know what to say first? Switch to Opener Mode and get three conversation starters tailored to the situation — whether it\'s a dating app match, an Instagram DM, or someone you just met. Each opener has a different energy: Bold, Witty, or Warm.',
    howItWorks: [
      'Switch to Opener Mode at the top',
      'Pick the situation (Dating App, Instagram, Cold Text, etc.)',
      'Optionally describe the person for personalized openers',
      'Get 3 openers with explanations of why each one works',
    ],
    example: {
      input: 'Dating App • "Loves hiking, golden retriever, funny pizza bio"',
      outputs: [
        { tone: 'Bold', text: 'Your dog has better trail pics than most people I know', emoji: '🎯' },
        { tone: 'Witty', text: 'Pizza bio and a golden retriever? You\'re either perfect or a trap', emoji: '⚡' },
        { tone: 'Warm', text: 'What\'s the best trail you and your pup have done lately', emoji: '💚' },
      ],
    },
  },
  {
    id: 'saved-threads',
    badge: 'New',
    badgeColor: 'bg-blue-500',
    icon: BookmarkCheck,
    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
    title: 'Saved Threads',
    tagline: 'Never lose context. Pick up where you left off.',
    description: 'Name and save ongoing conversations so you can come back anytime. When you load a saved thread, the AI remembers the full context — so your replies stay consistent and natural across the whole conversation arc.',
    howItWorks: [
      'Paste or upload a conversation',
      'Hit the 📑 Save button and name it (e.g., "Sarah 🔥")',
      'Come back later and load the thread',
      'Generate replies with full conversation context',
    ],
    example: null,
  },
  {
    id: 'screenshot',
    badge: 'New',
    badgeColor: 'bg-green-500',
    icon: Camera,
    iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
    title: 'Screenshot Upload',
    tagline: 'Screenshot it. We\'ll read it.',
    description: 'Take a screenshot of any conversation — iMessage, WhatsApp, Instagram, Tinder, Bumble, Hinge — and upload it. Our AI reads the entire thread, identifies who said what, and fills it in automatically. No copy-pasting between apps.',
    howItWorks: [
      'Screenshot any conversation on your phone',
      'Tap Upload Screenshot in the app',
      'AI reads every message with Them/You labels',
      'Generate replies or decode the whole thread',
    ],
    example: null,
  },
  {
    id: 'v2-verified',
    badge: 'Pro',
    badgeColor: 'bg-green-600',
    icon: Shield,
    iconBg: 'bg-gradient-to-br from-green-500 to-teal-600',
    title: 'V2 Verified Mode',
    tagline: '3-agent pipeline. Every reply verified before you see it.',
    description: 'V2 Mode runs every reply through a 3-step AI pipeline: Draft → Rule-Check (≤18 words, no emojis, no needy text) → Tone-Verify. If a reply fails any check, it gets auto-revised up to 2 times. You only see replies that passed all checks.',
    howItWorks: [
      'Toggle V2 Verified Mode on (Pro feature)',
      'Agent 1 drafts three replies',
      'Agent 2 checks rules: word count, no emojis, no desperate language',
      'Agent 3 verifies each reply matches the selected tone',
    ],
    example: null,
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-950">
      {/* Nav */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="transition-transform hover:scale-105">
            <Logo size="md" showText={true} className="cursor-pointer" />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 rounded-xl text-sm hidden sm:flex">
              <Link href="/changelog">Changelog</Link>
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

      {/* Hero */}
      <section className="container mx-auto px-4 pt-8 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm font-medium border border-purple-500/30 mb-6">
          <Sparkles className="h-4 w-4" />
          v{CURRENT_VERSION} — {FEATURES.filter(f => f.badge === 'New').length} new features
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Everything Text Wingman
          <span className="block bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mt-1">Can Do</span>
        </h1>
        <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
          Reply generation is just the start. Decode messages, craft opening lines, save threads, and never fumble a text again.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {FEATURES.map(f => (
            <a key={f.id} href={`#${f.id}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm text-white/80 hover:text-white">
              <f.icon className="h-4 w-4" />
              {f.title}
            </a>
          ))}
        </div>
      </section>

      {/* Feature Sections */}
      <div className="container mx-auto px-4 pb-20 space-y-20 max-w-5xl">
        {FEATURES.map((feature, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <section key={feature.id} id={feature.id} className="scroll-mt-24">
              <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-12 items-center`}>
                {/* Text Side */}
                <div className="flex-1 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl ${feature.iconBg} flex items-center justify-center shadow-xl`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white ${feature.badgeColor}`}>
                        {feature.badge}
                      </span>
                    </div>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white">{feature.title}</h2>
                  <p className="text-xl text-white/40 font-medium italic">{feature.tagline}</p>
                  <p className="text-white/70 leading-relaxed">{feature.description}</p>

                  {/* How it works */}
                  <div className="space-y-3 pt-2">
                    <p className="text-sm font-bold text-white/50 uppercase tracking-wider">How it works</p>
                    {feature.howItWorks.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-white/60">{i + 1}</span>
                        </div>
                        <p className="text-white/70 text-sm">{step}</p>
                      </div>
                    ))}
                  </div>

                  <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold mt-4">
                    <Link href="/app">
                      Try it now <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>

                {/* Example / Visual Side */}
                <div className="flex-1 w-full max-w-md">
                  {feature.example ? (
                    <Card className="bg-white/5 border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                      <CardContent className="p-6 space-y-4">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                          <p className="text-xs font-bold text-white/40 mb-2">Input</p>
                          <p className="text-white/90 text-sm font-medium">{feature.example.input}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-px flex-1 bg-white/10" />
                          <Sparkles className="h-4 w-4 text-purple-400" />
                          <div className="h-px flex-1 bg-white/10" />
                        </div>
                        <div className="space-y-3">
                          {feature.example.outputs.map((out, i) => (
                            <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/[0.07] transition-colors">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{out.emoji}</span>
                                <span className="text-xs font-bold text-white/50">{out.tone}</span>
                              </div>
                              <p className="text-white/90 text-sm font-medium leading-relaxed">&ldquo;{out.text}&rdquo;</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
                      <div className={`w-20 h-20 rounded-3xl ${feature.iconBg} flex items-center justify-center shadow-2xl`}>
                        <feature.icon className="h-10 w-10 text-white" />
                      </div>
                      <p className="text-white/50 text-sm max-w-[240px]">{feature.tagline}</p>
                      <Button asChild className="bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-xl text-sm">
                        <Link href="/app">See it in action →</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <section className="container mx-auto px-4 pb-20 text-center">
        <div className="max-w-2xl mx-auto bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-3xl p-10">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to never fumble a text again?</h2>
          <p className="text-white/60 mb-6">All features. Free to start. No credit card required.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-gray-100 rounded-xl font-bold text-lg h-14 px-8">
              <Link href="/app">Start for Free</Link>
            </Button>
            <Button asChild size="lg" className="bg-white/10 border border-white/30 text-white hover:bg-white/20 rounded-xl font-bold text-lg h-14 px-8">
              <Link href="/#pricing">See Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
