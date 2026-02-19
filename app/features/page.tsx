import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { ArrowRight, Brain, Send, BookmarkCheck, Camera, Shield, Sparkles, MessageCircle, Target, RefreshCw, Pencil, Eye, Activity, Zap, Lock } from 'lucide-react';
import { CURRENT_VERSION } from '@/lib/changelog';

const FREE_FEATURES = [
  { icon: MessageCircle, color: 'text-violet-400', bg: 'bg-violet-500/10', title: 'Reply Generator', tagline: 'Paste their message. Get 3 perfect replies.', bullets: ['3 tones: Shorter, Spicier, Softer', 'Thread-aware — reads the full convo', '5 replies/day free'] },
  { icon: Eye, color: 'text-amber-400', bg: 'bg-amber-500/10', title: 'Subtext Intelligence', tagline: 'AI that reads between the lines.', bullets: ['"wateveerr" = coy, not dismissive', 'Stretched words, sarcasm, banter detected', 'Replies match the feeling, not just the words'] },
  { icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Vibe Check', tagline: 'Know how your message reads before you send.', bullets: ['Real-time draft analysis as you type', 'Energy, neediness risk, frame strength', 'Sharp-friend tip: "Cut the question mark"'] },
  { icon: Brain, color: 'text-orange-400', bg: 'bg-orange-500/10', title: 'Message Decoder', tagline: '"What do they actually mean?"', bullets: ['Paste any message or full thread', 'Intent, subtext, sarcasm, power dynamics', '1 decode/day free · unlimited Pro'] },
  { icon: Send, color: 'text-pink-400', bg: 'bg-pink-500/10', title: 'Opener Generator', tagline: 'First messages that actually land.', bullets: ['Dating apps, Instagram, cold texts', 'Personalized to their bio or situation', '1 opener/day free · unlimited Pro'] },
  { icon: RefreshCw, color: 'text-cyan-400', bg: 'bg-cyan-500/10', title: 'Revive Mode', tagline: 'Bring dead conversations back to life.', bullets: ['Analyzes why the convo died', 'Smooth, Bold, or Warm re-engagement', '1 revive/day free · unlimited Pro'] },
  { icon: Camera, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'Screenshot Briefing', tagline: 'Upload. Get strategy + replies. Zero typing.', bullets: ['Works with iMessage, WhatsApp, IG, Tinder, Hinge + more', 'AI reads every message, identifies who said what', 'Instant strategy + 3 replies'] },
  { icon: Pencil, color: 'text-violet-400', bg: 'bg-violet-500/10', title: 'Edit + Polish', tagline: 'Make any reply yours.', bullets: ['Add your own ideas to any reply', 'Polish keeps your words, tightens the rest', 'Works in Thread Mode and Screenshot Briefing'] },
  { icon: RefreshCw, color: 'text-white/40', bg: 'bg-white/[0.06]', title: 'Regenerate', tagline: 'Not feeling it? Get fresh options.', bullets: ['Tap "Generate different replies" anytime', 'Same context, completely different replies', 'No re-uploading or re-entering needed'] },
  { icon: BookmarkCheck, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'Auto-Save Threads', tagline: 'Never lose context.', bullets: ['Conversations auto-save after 2+ messages', 'Load any thread and keep going', 'Full context preserved across sessions'] },
];

const PRO_FEATURES = [
  { icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Strategy Mode', tagline: 'AI coaching before every reply.', bullets: ['Detects sarcasm vs low investment', 'Tracks power dynamics — who\'s chasing', 'Sharp one-liner: "Pull back. Let them come to you."', 'Shapes every reply around the right move'] },
  { icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'V2 Verified Pipeline', tagline: '3-agent pipeline. Every reply verified.', bullets: ['Draft → Rule-Check → Tone-Verify', '≤18 words enforced, no needy language', 'Strategy-aligned tone verification', 'Auto-revises up to 2x if a reply fails'] },
  { icon: Zap, color: 'text-violet-400', bg: 'bg-violet-500/10', title: 'Unlimited Everything', tagline: 'No daily limits. Ever.', bullets: ['Unlimited replies, decodes, openers, revives', 'Full reply history saved', 'Strategy Mode on every generation'] },
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
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 px-4 py-1.5 rounded-full text-xs font-bold border border-cyan-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            v{CURRENT_VERSION} — Sarcasm Detection + Power Dynamics + Style Matching
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white">
            Everything Wingman can do.
          </h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Free features. Pro features. All in one place.
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
