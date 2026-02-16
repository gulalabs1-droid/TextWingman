import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { ArrowRight, Brain, Send, BookmarkCheck, Camera, Shield, Sparkles, MessageCircle, Check, Zap, Target, TrendingUp, RefreshCw } from 'lucide-react';
import { CURRENT_VERSION } from '@/lib/changelog';

const FEATURES = [
  {
    id: 'thread-mode',
    badge: 'New',
    badgeColor: 'bg-emerald-500',
    icon: MessageCircle,
    iconBg: 'bg-gradient-to-br from-violet-500 to-fuchsia-600',
    title: 'Thread Mode',
    tagline: 'Not just replies. Full conversations.',
    description: 'Text Wingman now tracks your entire conversation — their messages and yours. The AI reads the full thread and generates replies that actually fit the flow, not just the last message. Double-texts, custom replies, auto-save — it all works like a real texting coach by your side.',
    howItWorks: [
      'Paste what they sent you and hit Generate',
      'Pick a reply and tap "I sent this" — or type what you actually said',
      'Paste their next message and generate again — the AI sees everything',
      'Your thread auto-saves so you can come back anytime',
    ],
    example: {
      input: 'Them: "hey how you doing"\nYou: "nothing much, what about you?"\nThem: "nothing lol"',
      outputs: [
        { tone: 'Shorter', text: 'Sounds boring, come do something fun', emoji: '⚡' },
        { tone: 'Spicier', text: 'Nothing? That\'s a crime on a Friday', emoji: '🔥' },
        { tone: 'Softer', text: 'Same here — we should change that', emoji: '💚' },
      ],
    },
  },
  {
    id: 'strategy-mode',
    badge: 'Pro',
    badgeColor: 'bg-emerald-600',
    icon: Target,
    iconBg: 'bg-gradient-to-br from-emerald-500 to-cyan-600',
    title: 'Strategy Mode',
    tagline: 'AI coaching for every conversation.',
    description: 'StrategyAgent analyzes your full thread and gives you a tactical coaching card before you reply. See the conversation momentum, who\'s investing more, and get a recommended move — all in under 2 seconds. The strategy also shapes your generated replies automatically.',
    howItWorks: [
      'Build a thread with 4+ messages back and forth',
      'Hit Generate — StrategyAgent runs alongside reply generation',
      'See your coaching card: momentum, balance, energy, and constraints',
      'Your replies are automatically shaped by the strategy recommendation',
    ],
    example: {
      input: '6-message thread with declining energy',
      outputs: [
        { tone: 'Momentum', text: 'Declining — their messages are getting shorter', emoji: '📉' },
        { tone: 'Balance', text: 'You leading — you\'re investing more right now', emoji: '⚖️' },
        { tone: 'Coach', text: 'Pull back. Keep it short. Let them come to you.', emoji: '🎯' },
      ],
    },
  },
  {
    id: 'reply-generator',
    badge: 'Free',
    badgeColor: 'bg-purple-500',
    icon: Sparkles,
    iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    title: 'Reply Generator',
    tagline: 'Paste their message. Get 3 perfect replies.',
    description: 'Drop any text message into Text Wingman and instantly get three reply options — Shorter (brief & casual), Spicier (playful & flirty), and Softer (warm & genuine). With Thread Mode, every reply is aware of the full conversation. Free users get 5 replies per day. Pro users get unlimited.',
    howItWorks: [
      'Paste the message you received',
      'Pick the context (crush, friend, work, etc.)',
      'Hit Generate and get 3 replies instantly',
      'Copy your favorite and tap "I sent this" to continue the thread',
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
    badge: 'Free',
    badgeColor: 'bg-amber-500',
    icon: Brain,
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    title: 'Message Decoder',
    tagline: '"What do they actually mean?"',
    description: 'Ever stare at a text wondering what they really mean? The Decoder analyzes the subtext, intent, and emotional energy behind any message. Free users get 1 decode per day. Pro users get unlimited.',
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
    badge: 'Free',
    badgeColor: 'bg-pink-500',
    icon: Send,
    iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600',
    title: 'Opening Line Generator',
    tagline: 'Start conversations that actually go somewhere.',
    description: 'Don\'t know what to say first? Switch to Opener Mode and get three conversation starters tailored to the situation. Free users get 1 opener per day. Pro users get unlimited.',
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
    id: 'revive-mode',
    badge: 'New',
    badgeColor: 'bg-cyan-500',
    icon: RefreshCw,
    iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    title: 'Revive Mode',
    tagline: 'Bring dead conversations back to life.',
    description: 'Conversation died? She left you on read? Revive Mode analyzes what went wrong and generates 3 re-engagement messages that feel natural — not thirsty. Never send "hey stranger" again. Free users get 1 revive per day. Pro users get unlimited.',
    howItWorks: [
      'Switch to Revive Mode and paste the old conversation (or upload a screenshot)',
      'Pick the context — crush, ex, friend, etc.',
      'Hit Revive and get an AI analysis of why the convo died',
      'Choose from 3 messages: Smooth (callback), Bold (playful), or Warm (genuine)',
    ],
    example: {
      input: 'Stale convo — last message was "The same" 2 weeks ago',
      outputs: [
        { tone: 'Smooth', text: 'did you ever try that place you were talking about', emoji: '🎯' },
        { tone: 'Bold', text: 'you fell off the earth huh', emoji: '🔥' },
        { tone: 'Warm', text: 'saw something that reminded me of our convo', emoji: '💚' },
      ],
    },
  },
  {
    id: 'screenshot-briefing',
    badge: 'New',
    badgeColor: 'bg-emerald-500',
    icon: Camera,
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    title: 'Screenshot Briefing',
    tagline: 'Upload. Get strategy + replies. Zero typing.',
    description: 'Upload a screenshot of any conversation and get an instant tactical briefing — strategy coaching, momentum analysis, and 3 ready-to-send replies. Works with iMessage, WhatsApp, Instagram, Tinder, Bumble, Hinge, Facebook Dating, Messenger, and Snapchat.',
    howItWorks: [
      'Take a screenshot of any conversation',
      'Upload it in Reply Mode — AI reads every message',
      'Get instant strategy coaching (momentum, balance, energy)',
      'Pick from 3 energy-matched replies and send',
    ],
    example: {
      input: 'Screenshot from Facebook Dating — 4 messages',
      outputs: [
        { tone: 'Strategy', text: 'Declining momentum. They\'re giving you nothing. Don\'t reward it.', emoji: '📉' },
        { tone: 'Shorter', text: 'Bet.', emoji: '⚡' },
        { tone: 'Spicier', text: 'Figures.', emoji: '🔥' },
      ],
    },
  },
  {
    id: 'saved-threads',
    badge: 'Free',
    badgeColor: 'bg-blue-500',
    icon: BookmarkCheck,
    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
    title: 'Auto-Save Threads',
    tagline: 'Never lose context. Pick up where you left off.',
    description: 'Every conversation with 2+ messages auto-saves in the background. Come back anytime, load a thread, and the AI picks up right where you left off with full context. No manual saving needed.',
    howItWorks: [
      'Start a conversation — it auto-saves after 2 messages',
      'Tap "Recent" to see all your saved conversations',
      'Load any thread and keep generating with full context',
      'Start fresh anytime with the "New" button',
    ],
    example: null,
  },
  {
    id: 'screenshot',
    badge: 'Free',
    badgeColor: 'bg-green-500',
    icon: Camera,
    iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
    title: 'Screenshot Upload',
    tagline: 'Screenshot it. We\'ll read it.',
    description: 'Take a screenshot of any conversation — iMessage, WhatsApp, Instagram, Tinder, Bumble, Hinge, Facebook Dating, Messenger, Snapchat — and upload it. Our AI reads the entire thread, identifies who said what, and fills it in automatically. Works in all modes: Reply, Decode, Opener, and Revive.', 
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
      'Always on for Pro users (no toggle needed)',
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
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-full text-sm font-medium border border-emerald-500/30 mb-6">
          <Sparkles className="h-4 w-4" />
          v{CURRENT_VERSION} — Revive Mode + Screenshot Briefing
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Not just replies.
          <span className="block bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent mt-1">Conversations.</span>
        </h1>
        <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
          Text Wingman tracks the full conversation, coaches you on the right move, and generates replies that fit the flow. Your AI texting companion.
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
