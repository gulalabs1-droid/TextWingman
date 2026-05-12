'use client';

// app/tiktok/page.tsx
// Stripped-down landing for TikTok bio traffic.
// No long-form sections — hero + input card that drops straight into /app with ?src=tiktok&prefill=... and Fast mode forced.

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ArrowRight, Loader2, MessageCircle, ShieldCheck, Zap } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { captureAttribution, track } from '@/lib/analytics';

const sampleTexts = [
  {
    label: 'She said "maybe"',
    text: "haha maybe, depends who's asking",
    intent: 'Turn a soft maybe into a confident plan.',
  },
  {
    label: 'Left on read',
    text: 'opened 43 minutes ago',
    intent: 'Double text without sounding desperate.',
  },
  {
    label: 'Dry lol',
    text: 'lol',
    intent: 'Revive the convo without interrogating her.',
  },
];

const trustChips = [
  'No signup to try',
  'No card',
  'You send it yourself',
  'Not robotic',
];

export default function TikTokLandingPage() {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    captureAttribution();
    track('tiktok_landing_view');
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 220) + 'px';
  }, [msg]);

  const goToApp = (extra: Record<string, string> = {}) => {
    const params = new URLSearchParams({ src: 'tiktok', mode: 'fast', ...extra });
    router.push(`/app?${params.toString()}`);
  };

  const handlePasteSubmit = () => {
    const text = msg.trim();
    if (!text) {
      textareaRef.current?.focus();
      return;
    }
    track('tiktok_paste_submit', { length: text.length });
    // Stash message so /app can read it without exposing in the URL
    try {
      sessionStorage.setItem('tw_prefill_message', text);
    } catch {}
    goToApp({ prefill: '1' });
  };

  const handleSample = (text: string, label: string) => {
    setMsg(text);
    track('tiktok_sample_click', { label });
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    track('tiktok_upload_start', { size: file.size });
    try {
      // Read to data URL, extract text server-side, then prefill the paste field in /app
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
        track('tiktok_upload_failed', { status: res.status });
        setUploading(false);
        alert(data?.error || 'Could not read that screenshot. Try pasting the text instead.');
        return;
      }
      track('tiktok_upload_success', { length: extracted.length });
      try {
        sessionStorage.setItem('tw_prefill_message', extracted);
      } catch {}
      goToApp({ prefill: '1', via: 'upload' });
    } catch (err) {
      track('tiktok_upload_error');
      setUploading(false);
      alert('Upload failed. Try pasting the text instead.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Thin top bar */}
      <header className="container mx-auto px-4 py-5 flex items-center justify-between">
        <Link href="/" className="transition-transform hover:scale-105">
          <Logo size="md" showText={true} className="cursor-pointer" />
        </Link>
        <Link
          href="/login?mode=signin"
          onClick={() => track('tiktok_nav_login_click')}
          className="text-white/50 hover:text-white text-sm transition-colors"
        >
          Sign in
        </Link>
      </header>

      {/* Hero + input card */}
      <main className="container mx-auto px-4 pt-6 pb-28 max-w-xl">
        <div className="text-center space-y-4 mb-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-fuchsia-200 shadow-lg shadow-fuchsia-500/10">
            Saw the TikTok? Use it here
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.1]">
            Stop guessing what she meant.
            <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent mt-1">
              Get the text to send back.
            </span>
          </h1>
          <p className="text-sm text-white/45 leading-relaxed">
            Paste the message or upload the screenshot. Gula reads the vibe, explains the move, and writes a reply that does not sound needy.
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 pt-1">
            {trustChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-white/50"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-2">
          {sampleTexts.map((sample) => (
            <button
              key={sample.label}
              onClick={() => handleSample(sample.text, sample.label)}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-left transition-all hover:border-fuchsia-300/30 hover:bg-white/[0.06] active:scale-[0.99]"
            >
              <span>
                <span className="block text-sm font-black text-white/85">{sample.label}</span>
                <span className="block text-xs text-white/38">{sample.intent}</span>
              </span>
              <span className="rounded-full bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-fuchsia-200 group-hover:bg-fuchsia-500/15">
                Try
              </span>
            </button>
          ))}
        </div>

        {/* Input card */}
        <div className="rounded-3xl bg-white/[0.04] border border-white/[0.08] p-5 sm:p-6 backdrop-blur-sm">
          <label className="block text-xs font-black text-fuchsia-200 uppercase tracking-[0.18em] mb-2">
            What did they say?
          </label>
          <textarea
            ref={textareaRef}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handlePasteSubmit();
              }
            }}
            placeholder={`e.g. "haha maybe, depends who's asking"`}
            rows={4}
            className="w-full min-h-[110px] max-h-[220px] p-4 rounded-2xl bg-black/30 border border-white/[0.08] text-white placeholder-white/30 resize-none focus:outline-none focus:border-fuchsia-400/60 focus:ring-4 focus:ring-fuchsia-500/10 transition-colors text-[15px] leading-relaxed"
          />
          <p className="mt-2 text-[11px] text-white/35">
            Paste the exact message. Gula gives you options. You choose what to send.
          </p>

          {/* Actions */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={handlePasteSubmit}
              className="h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-violet-600/30 transition-all active:scale-[0.98] ring-1 ring-white/10"
            >
              Decode + write reply <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                track('tiktok_upload_click');
                fileInputRef.current?.click();
              }}
              disabled={uploading}
              className="h-12 rounded-2xl bg-white/[0.05] border border-white/[0.12] hover:bg-white/[0.10] text-white/80 font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Reading...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" /> Upload screenshot
                </>
              )}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { icon: MessageCircle, label: 'Reads the vibe' },
              { icon: Zap, label: 'Fast reply' },
              { icon: ShieldCheck, label: 'No auto-send' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/[0.06] bg-black/20 px-2 py-3 text-center"
              >
                <item.icon className="mx-auto mb-1 h-4 w-4 text-fuchsia-200/80" />
                <div className="text-[10px] font-bold text-white/48">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Benefit chips (real, not fake stats) */}
          <div className="mt-5 flex flex-wrap justify-center gap-1.5">
            {[
              '5 free replies/day',
              'Screenshot upload',
              'Replies under 18 words',
              'Hinge, Tinder, IG, iMessage',
            ].map((b) => (
              <span
                key={b}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/55"
              >
                {b}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-white/[0.07] bg-white/[0.035] p-5">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-fuchsia-200/80">
            Why this beats random rizz lines
          </div>
          <div className="mt-3 grid gap-3 text-sm">
            <div className="rounded-2xl bg-black/20 p-3">
              <div className="text-white/40 text-xs font-bold uppercase tracking-[0.12em]">Bad</div>
              <div className="mt-1 text-white/72">Generic pickup lines that ignore the actual conversation.</div>
            </div>
            <div className="rounded-2xl bg-fuchsia-500/10 p-3 ring-1 ring-fuchsia-300/10">
              <div className="text-fuchsia-200 text-xs font-bold uppercase tracking-[0.12em]">Gula</div>
              <div className="mt-1 text-white/82">Reads context, flags neediness risk, then gives a short reply you can actually send.</div>
            </div>
          </div>
        </div>

        {/* TikTok handle — social proof, opens in new tab */}
        <div className="mt-5 text-center">
          <a
            href="https://www.tiktok.com/@gulatextwingman"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('tiktok_handle_click', { from: 'landing' })}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/40 hover:text-white/80 transition-colors"
          >
            <span aria-hidden>🎵</span> Follow @gulatextwingman on TikTok
          </a>
        </div>

        {/* Tiny context tap-throughs to add keyword intent into the funnel */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            { label: 'Hinge', key: 'hinge' },
            { label: 'Tinder', key: 'tinder' },
            { label: 'Bumble', key: 'bumble' },
            { label: 'Instagram', key: 'ig' },
            { label: 'iMessage', key: 'imessage' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => {
                track('tiktok_platform_tag_click', { platform: p.key });
                textareaRef.current?.focus();
              }}
              className="text-[11px] px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>
      </main>

      {/* Sticky mobile CTA — always present, always goes to input */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
        <div className="p-4 pointer-events-auto bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => {
                track('tiktok_sticky_cta_click');
                textareaRef.current?.focus();
                textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="w-full h-12 text-base font-bold rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-2xl shadow-violet-600/30 transition-all active:scale-[0.98]"
            >
              Paste text or upload screenshot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
