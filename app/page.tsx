'use client';

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Check, ArrowRight, Shield, Camera, Target, TrendingUp, ChevronDown, Brain, Zap, Upload, Loader2, Copy, EyeOff, Send } from "lucide-react";
import { Logo } from "@/components/Logo";
import { captureAttribution, track } from "@/lib/analytics";

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Text Wingman',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  description: 'AI texting coach for dating apps. Upload a screenshot or paste what they sent, then get the best reply with the strategy behind it.',
  url: 'https://gula-agents2.vercel.app',
  offers: [
    { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free — 5 replies/day' },
    { '@type': 'Offer', price: '9.99', priceCurrency: 'USD', description: 'Pro Weekly — Unlimited' },
    { '@type': 'Offer', price: '99.99', priceCurrency: 'USD', description: 'Pro Annual — Best Value' },
  ],
  featureList: [
    'Get the best reply — paste what they said or upload a screenshot, get the reply plus why it works',
    'Multiple reply options, scored so you can choose confidently',
    'Replies ranked for confidence, clarity, and forward momentum',
    'Reads the conversation context and tone before it writes',
    'Screenshot upload — reads the whole conversation for you',
    'Decode mode — understand what their message really means',
    'Revive dead conversations without looking thirsty',
    'Openers — first messages that actually get a reply',
    'Session history — auto-saved, resume anytime',
  ],
  creator: { '@type': 'Organization', name: 'Gula Labs', url: 'https://gula-agents2.vercel.app' },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is Text Wingman free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. 5 replies plus 1 decode, 1 opener, and 1 revive every day — no account, no card. Pro unlocks unlimited replies and more reply options to choose from.' } },
    { '@type': 'Question', name: 'Are my messages private?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. We never send messages for you and we never sell your data or use your conversations to train public AI models. You choose what to paste or upload, and you can delete your history anytime.' } },
    { '@type': 'Question', name: 'What apps does it work with?', acceptedAnswer: { '@type': 'Answer', text: 'Hinge, Tinder, Bumble, Instagram, iMessage, WhatsApp, Snapchat, Facebook Dating, and more — anything with text.' } },
    { '@type': 'Question', name: 'How is this different from ChatGPT?', acceptedAnswer: { '@type': 'Answer', text: 'ChatGPT gives you a generic reply. Wingman reads the conversation context and tone, then gives you short dating-text replies with the reason each one works.' } },
    { '@type': 'Question', name: 'Will people know I\'m using AI?', acceptedAnswer: { '@type': 'Answer', text: 'No. Every reply sounds like a real person — lowercase, casual, no emojis, no formal sentences. The 18-word limit keeps it natural.' } },
  ],
};

const EXAMPLE_CHIPS = [
  { label: 'She said "maybe"', text: "haha maybe, depends who's asking" },
  { label: 'Left on read', text: 'opened 43 minutes ago, no reply' },
  { label: 'Dry "lol"', text: 'lol' },
  { label: '"I\'m busy this week"', text: "i'm kinda busy this week tbh" },
];

export default function HomePage() {
  const router = useRouter();
  const [showSticky, setShowSticky] = useState(false);
  const compRef = useRef<HTMLDivElement>(null);
  const [compVisible, setCompVisible] = useState(false);

  // ── Hero interactive demo ──────────────────────────────
  const [heroMsg, setHeroMsg] = useState('');
  const [source, setSource] = useState('web');
  const [uploading, setUploading] = useState(false);
  const demoStarted = useRef(false);
  const heroInputRef = useRef<HTMLTextAreaElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const attribution = captureAttribution();
    const platform =
      (attribution.utm_source as string | undefined) ||
      (attribution.src as string | undefined) ||
      'web';
    setSource(platform);
    track('landing_view', { source: platform, platform });
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowSticky(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setCompVisible(true); }, { threshold: 0.3 });
    if (compRef.current) obs.observe(compRef.current);
    return () => obs.disconnect();
  }, []);

  const markDemoStarted = (via: string) => {
    if (demoStarted.current) return;
    demoStarted.current = true;
    track('hero_demo_started', { source, platform: source, via });
  };

  const buildParams = (extra: Record<string, string> = {}) => {
    const params: Record<string, string> = { src: source, ...extra };
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'video_id'].forEach(k => {
        const v = url.searchParams.get(k);
        if (v) params[k] = v;
      });
    }
    return new URLSearchParams(params).toString();
  };

  const goToApp = (text: string | null, via: string) => {
    if (text) {
      try { sessionStorage.setItem('tw_prefill_message', text); } catch {}
      router.push(`/app?${buildParams({ prefill: '1', via })}`);
    } else {
      router.push(`/app?${buildParams()}`);
    }
  };

  const handleGetReply = () => {
    const text = heroMsg.trim();
    markDemoStarted('paste');
    if (!text) {
      heroInputRef.current?.focus();
      heroCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    goToApp(text, 'paste');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    markDemoStarted('upload');
    track('screenshot_upload_started', { source, platform: source, size: file.size });
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      const extracted: string | null = data?.extracted_text || data?.full_conversation || data?.last_received || null;
      if (!res.ok || !extracted) {
        setUploading(false);
        goToApp(null, 'upload');
        return;
      }
      goToApp(extracted, 'upload');
    } catch {
      setUploading(false);
      goToApp(null, 'upload');
    }
  };

  const handleChip = (text: string) => {
    setHeroMsg(text);
    markDemoStarted('chip');
    requestAnimationFrame(() => {
      heroCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      heroInputRef.current?.focus();
    });
  };

  const hasText = heroMsg.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ═══ Navbar ═══ */}
      <nav className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="transition-transform hover:scale-105">
            <Logo size="md" showText={true} className="cursor-pointer" />
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link href="/features" className="text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl px-3 py-2 text-sm transition-all hidden sm:block">Features</Link>
            <Link href="/guides" className="text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl px-3 py-2 text-sm transition-all hidden sm:block">Guides</Link>
            <Link href="#pricing" className="text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl px-3 py-2 text-sm transition-all hidden sm:block">Pricing</Link>
            <Link href="/login?mode=signin" className="text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl px-3 py-2 text-sm transition-all">Login</Link>
            <Link href="/app" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-semibold shadow-lg shadow-violet-600/20 px-4 py-2 text-sm transition-all">Try Free</Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="container mx-auto px-4 pt-12 pb-14 md:pt-20 md:pb-24">
        <div className="max-w-2xl mx-auto text-center space-y-5 mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-300 px-4 py-1.5 rounded-full text-xs font-bold border border-violet-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            Built for Hinge, Tinder, Bumble, Instagram &amp; iMessage
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-[1.08]">
            Turn a confusing text into
            <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent mt-1">a confident next move.</span>
          </h1>
          <p className="text-base md:text-xl text-white/55 max-w-xl mx-auto leading-relaxed">
            Paste their message or upload the conversation. Get the read, three natural replies, and why the move works.
          </p>
        </div>

        {/* Interactive demo — input + actions */}
        <div ref={heroCardRef} className="max-w-xl mx-auto">
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.10] rounded-3xl p-4 sm:p-5 shadow-2xl shadow-violet-500/5">
            <textarea
              ref={heroInputRef}
              value={heroMsg}
              onChange={(e) => {
                setHeroMsg(e.target.value);
                if (e.target.value.trim().length > 0) markDemoStarted('type');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleGetReply(); }
              }}
              placeholder="Paste their message…"
              rows={2}
              className="w-full min-h-[64px] max-h-[180px] p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] text-white placeholder-white/30 resize-none focus:outline-none focus:border-fuchsia-400/60 focus:ring-4 focus:ring-fuchsia-500/10 transition-colors text-[15px] leading-relaxed"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleUpload}
              className="hidden"
            />
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleGetReply}
                className="flex-1 h-[52px] rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black text-[15px] flex items-center justify-center gap-2 shadow-xl shadow-violet-600/30 transition-all active:scale-[0.98] ring-1 ring-white/10"
              >
                Try a real text free <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => { markDemoStarted('upload_click'); fileInputRef.current?.click(); }}
                disabled={uploading}
                className="h-[52px] sm:w-auto px-5 rounded-2xl bg-white/[0.05] border border-white/[0.10] hover:bg-white/[0.10] text-white/80 font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Reading…</> : <><Camera className="h-4 w-4" /> Upload a screenshot</>}
              </button>
            </div>
            <p className="mt-3 text-[11px] text-white/35 text-center">No inbox access. No card. First reply in seconds.</p>

            {/* Example chips */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {EXAMPLE_CHIPS.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => handleChip(ex.text)}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12px] font-semibold text-white/60 hover:border-fuchsia-300/30 hover:bg-white/[0.06] hover:text-white/85 transition-all active:scale-[0.97]"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compact reply-result preview — visible immediately below the action (mobile-first proof) */}
          <div className="mt-4 rounded-3xl bg-white/[0.03] border border-white/[0.08] p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30">Live example</span>
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 flex items-center gap-1"><TrendingUp className="h-2.5 w-2.5" />Rising</span>
            </div>
            {/* Their message */}
            <div className="flex justify-start mb-3">
              <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl rounded-bl-md px-3.5 py-2 max-w-[85%]">
                <p className="text-white/70 text-[13px] leading-relaxed">haha maybe, depends who&apos;s asking</p>
              </div>
            </div>
            {/* Best reply */}
            <div className="relative">
              <div className="absolute -top-1.5 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 z-10">
                <Sparkles className="h-2.5 w-2.5 text-violet-300" />
                <span className="text-[9px] font-bold text-violet-200 uppercase tracking-wider">Best reply</span>
              </div>
              <div className="mt-1 px-4 pt-5 pb-3 rounded-xl bg-violet-500/[0.08] border border-violet-500/20">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[14px] text-white font-medium">someone with good taste and a friday plan</p>
                  <button
                    onClick={() => {
                      try { navigator.clipboard?.writeText('someone with good taste and a friday plan'); } catch {}
                      track('copy_clicked', { source, platform: source, location: 'hero_preview' });
                    }}
                    className="shrink-0 text-white/40 hover:text-white transition-colors"
                    aria-label="Copy reply"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[11px] text-violet-300/50 mt-1.5">Why it works: confident, specific, keeps the invite alive.</p>
              </div>
            </div>
            <button
              onClick={handleGetReply}
              className="mt-3 w-full text-center text-[13px] font-bold text-violet-300 hover:text-violet-200 transition-colors"
            >
              Try it with your own text →
            </button>
          </div>
        </div>
      </section>

      {/* ═══ BENEFITS BAR ═══ */}
      <section className="border-y border-white/[0.06] py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-center">
            {[
              { icon: '💬', label: '5 free replies/day' },
              { icon: '🔓', label: 'No card' },
              { icon: '📸', label: 'Screenshot upload' },
              { icon: '✂️', label: 'Replies under 18 words' },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>{b.icon}</span>
                <p className="text-sm font-bold text-white/70">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 3 STEPS — moved up so people see the simple process first ═══ */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Three steps. That&apos;s it.</h2>
          <p className="text-white/40">No learning curve. No setup. Just results.</p>
        </div>
        <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { n: '1', icon: <Upload className="h-5 w-5 text-violet-400" />, title: 'Paste it or screenshot it', desc: 'Drop in what they said, or upload the whole conversation as a screenshot.' },
            { n: '2', icon: <Brain className="h-5 w-5 text-fuchsia-400" />, title: 'It reads the whole vibe', desc: 'Conversation context and tone, momentum, and anything you left unanswered.' },
            { n: '3', icon: <Zap className="h-5 w-5 text-emerald-400" />, title: 'Send with confidence', desc: 'A few reply options under 18 words, each with why it works. Pick and send.' },
          ].map(step => (
            <div key={step.n} className="text-center space-y-4 group">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.05] border border-white/[0.10] flex items-center justify-center group-hover:border-violet-500/30 group-hover:shadow-lg group-hover:shadow-violet-500/10 transition-all duration-300">
                {step.icon}
              </div>
              <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-violet-600/20">{step.n}</div>
              <h3 className="font-bold text-white">{step.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/app" className="text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors">
            See it in action →
          </Link>
        </div>
      </section>

      {/* ═══ COMPARISON — scroll-triggered animation on right card ═══ */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">The difference is embarrassing.</h2>
          <p className="text-white/50">Other tools see one message. Coach reads the full conversation.</p>
        </div>
        <div ref={compRef} className="max-w-4xl mx-auto grid md:grid-cols-2 gap-5">
          {/* Left — Without */}
          <div className="bg-white/[0.03] border border-red-500/15 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
              <span className="text-red-300 font-bold text-xs uppercase tracking-wider">Without Wingman</span>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1.5">They sent</p>
              <p className="text-white/70 text-sm">&ldquo;right? now I got nothing to do&rdquo;</p>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
              <p className="text-white/40 text-[10px] font-bold uppercase mb-1.5">Your brain</p>
              <p className="text-white/50 text-sm italic">&ldquo;Is she hinting? Should I invite her? What if she says no?&rdquo;</p>
            </div>
            <div className="bg-red-500/[0.08] border border-red-500/20 rounded-xl p-3">
              <p className="text-red-300/60 text-[10px] font-bold uppercase mb-1.5">You send</p>
              <p className="text-red-200 text-sm">&ldquo;dang that sucks lol yeah I mean if you want we could maybe link or something idk&rdquo;</p>
              <p className="text-red-400/60 text-[11px] mt-2">37 words. Zero confidence. She left you on read.</p>
            </div>
          </div>
          {/* Right — With (animated on scroll) */}
          <div className={`bg-white/[0.03] border border-emerald-500/20 rounded-3xl p-6 space-y-4 transition-all duration-700 ${compVisible ? 'opacity-100 translate-y-0 shadow-2xl shadow-emerald-500/5 border-emerald-500/30' : 'opacity-40 translate-y-4'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full bg-emerald-400 transition-all duration-500 ${compVisible ? 'scale-100' : 'scale-0'}`} />
              <span className="text-emerald-300 font-bold text-xs uppercase tracking-wider">With Wingman</span>
            </div>
            <div className={`bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 transition-all duration-500 delay-100 ${compVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <p className="text-white/40 text-[10px] font-bold uppercase mb-1.5">Coach reads the thread</p>
              <p className="text-white/50 text-xs">6 messages &bull; Rising momentum &bull; She&apos;s hinting</p>
            </div>
            <div className={`bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl p-3 transition-all duration-500 delay-300 ${compVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Target className="h-3 w-3 text-emerald-400" />
                <p className="text-emerald-300 text-[10px] font-bold uppercase">Coach says</p>
              </div>
              <p className="text-white/90 text-sm font-semibold">&ldquo;She&apos;s hinting. Make a move. Don&apos;t ask — suggest.&rdquo;</p>
            </div>
            <div className={`flex flex-wrap gap-1.5 transition-all duration-500 delay-500 ${compVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 flex items-center gap-1"><TrendingUp className="h-2.5 w-2.5" />Rising</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.06] text-white/40 border border-white/[0.08]">Balanced</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400/60 border border-emerald-500/15">escalate</span>
            </div>
            <div className={`bg-emerald-500/[0.06] border border-emerald-500/15 rounded-xl p-3 transition-all duration-500 delay-700 ${compVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <p className="text-emerald-300/60 text-[10px] font-bold uppercase mb-1.5">You send</p>
              <p className="text-emerald-200 text-sm font-semibold">&ldquo;then let&apos;s fix that. drinks friday?&rdquo;</p>
              <p className="text-emerald-400/60 text-[11px] mt-2">Confident, specific, and easy to answer.</p>
            </div>
          </div>
        </div>
        <div className="text-center mt-10">
          <Link href="/app" className="text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors">
            See it in action →
          </Link>
        </div>
      </section>

      {/* ═══ FEATURES — 5 cards, horizontal scroll mobile, 3-col desktop ═══ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">More than a generic AI reply.</h2>
          <p className="text-white/50">It reads the dating context before it writes the text.</p>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0 max-w-4xl md:mx-auto scrollbar-hide">
          {[
            { icon: '🏆', title: 'Ranked replies', desc: 'Compare a few different vibes and see which reply fits the moment best.' },
            { icon: '🎯', title: 'Reads the context', desc: 'It notices tone, momentum, and what happened earlier in the conversation.' },
            { icon: '📊', title: 'Explains the choice', desc: 'See why a reply works before you decide to send it.' },
            { icon: '🔍', title: 'Decode messages', desc: 'Intent, subtext, red/green flags revealed.' },
            { icon: '🔥', title: 'Revive dead chats', desc: 'Re-engage without looking thirsty.' },
            { icon: '📸', title: 'Screenshot upload', desc: 'Upload the conversation instead of typing every message again.' },
          ].map((f) => (
            <div key={f.title} className="min-w-[220px] snap-center md:min-w-0 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-violet-500/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 group">
              <span className="text-3xl block mb-4 group-hover:scale-110 transition-transform duration-300">{f.icon}</span>
              <h3 className="font-bold text-white text-sm mb-2">{f.title}</h3>
              <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SCENARIOS — dating-first intent matching ═══ */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Built for the texts you overthink.</h2>
          <p className="text-white/50">From the first message to the conversation you thought was dead.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {[
            { emoji: '💘', tag: 'Decode', tagColor: 'bg-pink-500/10 text-pink-300 border-pink-500/20', title: 'The message you can\'t read', desc: 'Figure out whether they are flirting, being polite, or pulling away before you reply.', color: 'border-pink-500/20 hover:border-pink-500/30' },
            { emoji: '🎯', tag: 'Reply', tagColor: 'bg-violet-500/10 text-violet-300 border-violet-500/20', title: 'The reply that needs a move', desc: 'Turn “maybe,” “lol,” or a dry answer into something confident and easy to respond to.', color: 'border-violet-500/20 hover:border-violet-500/30' },
            { emoji: '🧊', tag: 'Revive', tagColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20', title: 'The conversation that died', desc: 'Reopen the chat without double-texting like you have been waiting by the phone.', color: 'border-cyan-500/20 hover:border-cyan-500/30' },
          ].map((s, i) => (
            <div key={i} className={`bg-white/[0.03] border ${s.color} rounded-2xl p-6 transition-all hover:bg-white/[0.05] hover:-translate-y-1 hover:shadow-lg duration-300`}>
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{s.emoji}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.tagColor}`}>{s.tag}</span>
              </div>
              <h3 className="font-bold text-white mb-2">{s.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/app" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-bold shadow-lg shadow-violet-600/20 px-8 py-3.5 transition-all hover:scale-[1.02] active:scale-[0.98]">
            Handle it now — free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ═══ TRUST — accurate to the published privacy policy ═══ */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto rounded-3xl border border-white/[0.09] bg-gradient-to-br from-white/[0.05] to-violet-500/[0.04] p-6 md:p-8">
          <div className="grid md:grid-cols-[1.1fr_1.9fr] gap-7 items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-400 mb-3">Private by design</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white">You choose what to share.</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/45">Text Wingman never connects to your dating or messaging apps.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: <EyeOff className="h-5 w-5" />, title: 'No inbox access', text: 'We cannot read messages you do not paste or upload.' },
                { icon: <Send className="h-5 w-5" />, title: 'You press send', text: 'We suggest replies. We never message anyone for you.' },
                { icon: <Shield className="h-5 w-5" />, title: 'Not sold or trained on', text: 'Your conversations are not sold or used to train public AI models.' },
              ].map(item => (
                <div key={item.title} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                  <div className="text-emerald-400 mb-3">{item.icon}</div>
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/40">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-5 text-center text-[11px] text-white/30">Signed-in users can save and delete conversation history. <Link href="/privacy" className="underline underline-offset-2 hover:text-white/60">Read the privacy policy</Link>.</p>
        </div>
      </section>

      {/* ═══ PRICING — moved up so users see cost early ═══ */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Simple pricing.</h2>
          <p className="text-white/50">Start free. Upgrade when you need the sharp friend always on call.</p>
          <p className="text-xs text-emerald-400/60 mt-3 font-medium">Founder pricing — lock in these rates forever</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 hover:bg-white/[0.05] transition-all duration-300">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">Free</h3>
              <p className="text-white/40 text-sm">Get a real taste</p>
              <div className="mt-4"><span className="text-4xl font-black text-white">$0</span></div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> 5 replies per day</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Full Coach access</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Screenshot upload</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> 1 decode + 1 opener + 1 revive / day</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> No account or card required</li>
            </ul>
            <Link href="/app" className="w-full h-12 text-sm font-bold rounded-xl bg-white/[0.06] border border-white/[0.12] text-white hover:bg-white/[0.10] transition-all flex items-center justify-center">Start Free →</Link>
            <p className="text-xs text-center text-white/25 mt-3">No credit card required</p>
          </div>
          <div className="relative bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-3xl p-6 hover:border-violet-500/40 transition-all duration-300">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-5 py-1.5 rounded-full text-xs font-black shadow-lg shadow-violet-600/30 whitespace-nowrap">MOST POPULAR</div>
            <div className="mb-6 pt-2">
              <h3 className="text-xl font-bold text-white">Pro Weekly</h3>
              <p className="text-white/40 text-sm">Full access. Cancel anytime.</p>
              <div className="mt-4 flex items-end gap-2"><span className="text-4xl font-black text-white">$9.99</span><span className="text-white/40 mb-1">/week</span></div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-white text-sm font-medium"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Unlimited replies + Coach</li>
              <li className="flex items-center gap-3 text-white text-sm font-medium"><Shield className="h-4 w-4 text-emerald-400 shrink-0" /> More ranked reply options + strategy</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Unlimited decodes, openers, revives</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Session history — auto-saved</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Cancel anytime</li>
            </ul>
            <Link href="/pricing" className="w-full h-14 text-base font-black rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-xl shadow-violet-600/20 hover:scale-[1.02] transition-all flex items-center justify-center animate-[gentlePulse_3s_ease-in-out_infinite]">Get Pro →</Link>
            <p className="text-xs text-center text-white/30 mt-3">7-day free trial available</p>
          </div>
          <div className="relative bg-white/[0.03] border border-emerald-500/20 rounded-3xl p-6 hover:bg-white/[0.05] transition-all duration-300">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-5 py-1.5 rounded-full text-xs font-black shadow-lg shadow-emerald-500/30 whitespace-nowrap">SAVE 80%</div>
            <div className="mb-6 pt-2">
              <h3 className="text-xl font-bold text-white">Pro Annual</h3>
              <p className="text-white/40 text-sm">Best value — $1.92/week</p>
              <div className="mt-4 flex items-end gap-2"><span className="text-4xl font-black text-white">$99.99</span><span className="text-white/40 mb-1">/year</span></div>
              <p className="text-emerald-400 text-xs font-bold mt-1">Save $419 vs weekly</p>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-white text-sm font-medium"><Sparkles className="h-4 w-4 text-emerald-400 shrink-0" /> Everything in Pro</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Price locked forever</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> First access to new features</li>
              <li className="flex items-center gap-3 text-white/70 text-sm"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Priority support</li>
            </ul>
            <Link href="/pricing" className="w-full h-12 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:from-emerald-400 hover:to-cyan-400 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all flex items-center justify-center">Get Annual →</Link>
            <p className="text-xs text-center text-white/25 mt-3">Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ═══ FAQ — glass-morph expand ═══ */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Questions?</h2>
          <p className="text-white/50">The stuff everyone asks before they try it.</p>
        </div>
        <div className="max-w-2xl mx-auto space-y-3">
          {[
            { q: 'Is it actually free?', a: 'Yes. You get 5 replies plus 1 decode, 1 opener, and 1 revive every day. You do not need an account or credit card to start.' },
            { q: 'Are my conversations private?', a: 'You choose what to paste or upload. We never connect to your messaging apps, sell your conversations, or use them to train public AI models. Signed-in users can save and delete their history.' },
            { q: 'What apps does it work with?', a: 'Hinge, Tinder, Bumble, Instagram, iMessage, WhatsApp, Snapchat, Facebook Dating, and anything else with text.' },
            { q: 'How is this different from ChatGPT?', a: 'Text Wingman is built specifically for dating conversations. It reads the context and tone, gives you short reply options, and explains why each one fits the moment.' },
            { q: 'Does it work outside of dating?', a: 'Yes. Friend, work, family, and ex modes are available inside the app, while dating remains the main focus.' },
            { q: 'Will people know I\'m using AI?', a: 'No. Every reply sounds like a real person — lowercase, casual, no emojis. The 18-word limit keeps it natural. Plus you can edit any reply.' },
          ].map((faq, i) => (
            <details key={i} className="group bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] rounded-2xl overflow-hidden hover:bg-white/[0.05] hover:border-white/[0.14] transition-all duration-300">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                <span className="font-bold text-white text-sm pr-4">{faq.q}</span>
                <ChevronDown className="h-4 w-4 text-white/30 shrink-0 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5 -mt-1 animate-[fadeSlideUp_0.3s_ease-out]">
                <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Stop staring at that text.</h2>
          <p className="text-white/50 text-lg">Drop the screenshot. Get the move. Send in 10 seconds.</p>
          <Link href="/app" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-bold shadow-xl shadow-violet-600/25 px-10 h-14 text-base transition-all hover:scale-[1.02] active:scale-[0.98]">
            Try it free <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-white/20 text-xs">No sign-up &bull; No credit card &bull; 5 free replies/day</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center space-y-6">
            <Logo size="lg" showText={true} />
            <p className="text-sm text-white/40 text-center max-w-md">
              Your AI texting coach — reads the conversation, gives strategy, and writes the reply you wish you thought of.
            </p>
            <div className="flex gap-6 text-sm text-white/30">
              <Link href="/features" className="hover:text-white/60 transition">Features</Link>
              <Link href="/guides" className="hover:text-white/60 transition">Guides</Link>
              <Link href="/terms" className="hover:text-white/60 transition">Terms</Link>
              <Link href="/privacy" className="hover:text-white/60 transition">Privacy</Link>
              <Link href="/contact" className="hover:text-white/60 transition">Contact</Link>
              <a href="https://www.tiktok.com/@gulatextwingman" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition">TikTok</a>
              <a href="https://www.youtube.com/@gulatextwingman" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition">YouTube</a>
              <a href="https://www.instagram.com/textwingmangula/" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition">Instagram</a>
            </div>
            <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} Text Wingman. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Sticky CTA — appears after scrolling past hero; always routes to app input */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ${showSticky ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="p-4 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent">
          <div className="max-w-lg mx-auto">
            <Link href="/app" className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-2xl shadow-violet-600/30 flex items-center justify-center gap-2 hover:from-violet-500 hover:to-fuchsia-500 transition-all">
              <Sparkles className="h-4 w-4" /> Paste the text
            </Link>
          </div>
        </div>
      </div>

      {/* Custom keyframes */}
      <style jsx>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gentlePulse {
          0%, 100% { box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.2); }
          50% { box-shadow: 0 10px 35px -5px rgba(139, 92, 246, 0.4); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
