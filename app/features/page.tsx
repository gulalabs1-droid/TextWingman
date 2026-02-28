import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { ArrowRight, Brain, Send, BookmarkCheck, Camera, Shield, Sparkles, MessageCircle, Target, RefreshCw, Pencil, Zap, Lock, Crosshair, Eye, Clock, User, Trophy } from 'lucide-react';
import { CURRENT_VERSION } from '@/lib/changelog';

const FREE_FEATURES = [
  { icon: Crosshair, color: 'text-violet-400', bg: 'bg-violet-500/10', title: 'Coach Mode', tagline: 'Your AI texting coach — one chat for everything.', bullets: ['Ask anything: "read this convo", "what should I say?", "decode this"', 'Gets strategy + 3 reply options (Quick, Spicy, Soft) inline', 'Handles replies, decodes, openers, and revives in one conversation'] },
  { icon: Eye, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', title: 'Smart Preview', tagline: 'Coach remembers before you ask.', bullets: ['Shows your last thread on load: "Last convo with Sarah — pick up where you left off"', 'No history? Rotates smart scenarios by time of day (Friday night dead chat? Monday morning reply?)', 'One tap to instantly load and continue any conversation'] },
  { icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-500/10', title: 'Context-Aware Chips', tagline: 'Buttons that think for you.', bullets: ['Scenario chips change subtitles based on your threads and time of day', 'Evening? "Start a flirty convo 🔥" — Weekend? Revive chip says "Perfect timing"', 'Relevant chips glow violet so you know what matters right now'] },
  { icon: Camera, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'Screenshot Upload', tagline: 'Upload screenshots. Get instant coaching.', bullets: ['Upload multiple screenshots at once in Coach', 'AI reads every message, identifies who said what', 'Works with iMessage, WhatsApp, IG, Tinder, Hinge, Bumble + more'] },
  { icon: Brain, color: 'text-orange-400', bg: 'bg-orange-500/10', title: 'Message Decoder', tagline: '"What do they actually mean?"', bullets: ['Ask Coach to decode any message', 'Intent, subtext, sarcasm, power dynamics, red/green flags', '1 decode/day free · unlimited Pro'] },
  { icon: Send, color: 'text-pink-400', bg: 'bg-pink-500/10', title: 'Opener Generator', tagline: 'First messages that actually land.', bullets: ['Ask Coach: "write me an opener"', 'Personalized to their bio, platform, or situation', '1 opener/day free · unlimited Pro'] },
  { icon: RefreshCw, color: 'text-cyan-400', bg: 'bg-cyan-500/10', title: 'Revive Mode', tagline: 'Bring dead conversations back to life.', bullets: ['Ask Coach: "revive this dead chat"', 'Smooth, Bold, or Warm re-engagement options with analysis', '1 revive/day free · unlimited Pro'] },
  { icon: Pencil, color: 'text-violet-400', bg: 'bg-violet-500/10', title: 'Edit + Polish', tagline: 'Make any reply yours.', bullets: ['Tap Edit on any reply, add your ideas', 'Polish keeps your words, tightens the rest', 'Use As Is option if you prefer your own wording'] },
  { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', title: 'Dynamic Input Bar', tagline: 'A psychic input that suggests what to ask.', bullets: ['Placeholder rotates smart examples every 4 seconds', '"Decode why she sent \'k.\'…", "Am I overthinking this text?"', 'Send button morphs to ✨ Go when you start typing'] },
  { icon: BookmarkCheck, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'Auto-Save Sessions', tagline: 'Never lose context.', bullets: ['Coach sessions and threads auto-save after 2+ messages', 'Load, rename, or delete any saved session', 'Full context preserved — resume anytime from History'] },
  { icon: User, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Personalized Coach', tagline: 'It knows your name. It greets you.', bullets: ['Your initial as a gradient avatar next to Coach', 'Dynamic greeting: "What\'s up [Name]?"', 'Feels like your own personal texting advisor'] },
];

const PRO_FEATURES = [
  { icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10', title: 'Deep Analysis', tagline: '6 candidates scored. One clear winner.', bullets: ['Upload a screenshot — 6 reply options generated and ranked by a critic agent', 'Winner gets a Trophy badge. Backup sits right below. Both one-tap copy.', 'Expand to see every score: Neediness Risk, Clarity, Forward Motion, Tone Match', '6 distinct styles — Hood Charisma, Clean Direct, Playful Tease, Bold Closer, Warm, Chill'] },
  { icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Strategy Mode', tagline: 'AI coaching before every reply.', bullets: ['Detects sarcasm vs low investment, kidding vs serious', 'Tracks power dynamics — who\'s chasing, who\'s pulling back', 'Sharp one-liner: "Pull back. Let them come to you."', 'Shapes every reply around the right strategic move'] },
  { icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Verified Pipeline', tagline: 'Every reply checked before you see it.', bullets: ['Auto-verified — neediness, word count, tone, strategy alignment all checked', '≤12 words enforced. Aim for 4-8. Shorter = better.', 'Violations caught and rewritten automatically', 'Strategy-aligned — if Coach says pull back, replies follow'] },
  { icon: Brain, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Deep Conversation Intelligence', tagline: 'Reads the thread like a human would.', bullets: ['Detects their tone — flirty, cold, playful, stressed, dry', 'Spots open questions and things you MUST acknowledge', 'Energy matching — short message gets a short reply. Always.', 'Context extraction: topic, goal, must-acknowledge items surfaced'] },
  { icon: Zap, color: 'text-violet-400', bg: 'bg-violet-500/10', title: 'Unlimited Everything', tagline: 'No daily limits. Ever.', bullets: ['Unlimited replies, decodes, openers, revives', 'Full session history saved and searchable', 'Deep Analysis on every screenshot upload', 'Intelligent follow-ups with full session memory'] },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#030305]">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full" style={{ background: 'rgba(139,92,246,0.10)', filter: 'blur(120px)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full" style={{ background: 'rgba(236,72,153,0.08)', filter: 'blur(120px)' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="transition-transform hover:scale-105">
            <Logo size="md" showText={true} />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/changelog" className="text-white/50 hover:text-white hover:bg-white/[0.06] rounded-xl px-3 py-2 text-sm transition-all hidden sm:block">Changelog</Link>
            <Link href="/login" className="text-white/50 hover:text-white hover:bg-white/[0.06] rounded-xl px-3 py-2 text-sm transition-all">Login</Link>
            <Link href="/app" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-semibold shadow-lg shadow-violet-600/20 px-4 py-2 text-sm transition-all">Try Free</Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 container mx-auto px-4 pb-20 max-w-5xl">

        {/* Hero */}
        <div className="text-center pt-8 pb-14 space-y-4">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-300 px-4 py-1.5 rounded-full text-xs font-bold border border-violet-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            v{CURRENT_VERSION} — Deep Analysis: 6 Candidates, Scored & Ranked
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white">
            Everything Wingman can do.
          </h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            One AI coach that reads every situation, scores 6 reply options against each other, and gives you the sharpest move.
          </p>
        </div>

        {/* Free features grid */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] font-black text-white/25 uppercase tracking-[0.3em]">Free</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FREE_FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl ${f.bg} flex items-center justify-center shrink-0`}>
                    <f.icon className={`h-4 w-4 ${f.color}`} />
                  </div>
                  <div>
                    <p className="text-white/85 font-bold text-sm">{f.title}</p>
                    <p className="text-white/30 text-[11px]">{f.tagline}</p>
                  </div>
                </div>
                <ul className="space-y-1.5 mt-3">
                  {f.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-white/45 text-xs">
                      <span className="text-white/20 mt-0.5 shrink-0">—</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Pro features grid */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] font-black text-violet-400/60 uppercase tracking-[0.3em]">Pro</span>
            <div className="flex-1 h-px bg-violet-500/20" />
            <Lock className="h-3 w-3 text-violet-400/40" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRO_FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.04] p-5 hover:bg-violet-500/[0.07] hover:border-violet-500/25 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl ${f.bg} flex items-center justify-center shrink-0`}>
                    <f.icon className={`h-4 w-4 ${f.color}`} />
                  </div>
                  <div>
                    <p className="text-white/85 font-bold text-sm">{f.title}</p>
                    <p className="text-white/30 text-[11px]">{f.tagline}</p>
                  </div>
                </div>
                <ul className="space-y-1.5 mt-3">
                  {f.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-white/45 text-xs">
                      <span className="text-violet-400/40 mt-0.5 shrink-0">—</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="rounded-3xl border border-violet-500/20 bg-violet-500/[0.06] p-10 text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-black text-white">Ready to never fumble a text again?</h2>
          <p className="text-white/35 text-sm">All free features. No credit card. Upgrade when you need the edge.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/app" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-bold shadow-lg shadow-violet-600/20 px-8 h-12 transition-all hover:scale-[1.02]">
              Start for Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/#pricing" className="inline-flex items-center justify-center gap-2 bg-white/[0.06] border border-white/[0.12] text-white hover:bg-white/[0.10] rounded-xl font-bold px-8 h-12 transition-all">
              See Pricing
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
