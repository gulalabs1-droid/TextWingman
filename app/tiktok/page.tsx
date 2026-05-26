'use client';

// app/tiktok/page.tsx
// Mobile-optimized social landing for TikTok/YouTube/IG bio traffic.
// Textarea + CTA above the fold. Example chips prefill. UTMs preserved through funnel.

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ArrowRight, Loader2, Zap } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { captureAttribution, track } from '@/lib/analytics';

const exampleChips = [
  { label: 'She said "maybe"', text: "haha maybe, depends who's asking" },
  { label: 'Left on read', text: 'opened 43 minutes ago' },
  { label: 'Dry "lol"', text: 'lol' },
  { label: '"I\'m busy"', text: "i'm kinda busy this week tbh" },
];

export default function TikTokLandingPage() {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const [source, setSource] = useState('shorts');
  const [uploading, setUploading] = useState(false);
  const [exampleClicked, setExampleClicked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const attribution = captureAttribution();
    const channel =
      (attribution.utm_source as string | undefined) ||
      (attribution.src as string | undefined) ||
      'shorts';
    setSource(channel);
    track('social_landing_view', { source: channel });
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [msg]);

  const buildUtmParams = () => {
    const params: Record<string, string> = { src: source, mode: 'fast' };
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'video_id'].forEach(k => {
        const v = url.searchParams.get(k);
        if (v) params[k] = v;
      });
    }
    return params;
  };

  const goToApp = (extra: Record<string, string> = {}) => {
    const params = new URLSearchParams({ ...buildUtmParams(), ...extra });
    router.push(`/app?${params.toString()}`);
  };

  const handlePasteSubmit = () => {
    const text = msg.trim();
    if (!text) {
      textareaRef.current?.focus();
      inputCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    track('decode_clicked', { source, length: text.length });
    try { sessionStorage.setItem('tw_prefill_message', text); } catch {}
    goToApp({ prefill: '1' });
  };

  const handleSample = (text: string, label: string) => {
    setMsg(text);
    setExampleClicked(true);
    track('example_clicked', { source, label });
    requestAnimationFrame(() => {
      inputCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      textareaRef.current?.focus();
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    track('screenshot_upload_clicked', { source, size: file.size });
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
        track('screenshot_upload_failed', { source, status: res.status });
        setUploading(false);
        alert(data?.error || 'Could not read that screenshot. Try pasting the text instead.');
        return;
      }
      track('screenshot_upload_success', { source, length: extracted.length });
      try { sessionStorage.setItem('tw_prefill_message', extracted); } catch {}
      goToApp({ prefill: '1', via: 'upload' });
    } catch {
      track('screenshot_upload_error', { source });
      setUploading(false);
      alert('Upload failed. Try pasting the text instead.');
    }
  };

  const hasFilled = msg.trim().length > 0;
  const stickyLabel = hasFilled ? 'Decode this text now' : 'Paste text or upload screenshot';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Minimal top bar */}
      <header className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Logo size="sm" showText={true} className="cursor-pointer opacity-70" />
        <Link
          href="/login?mode=signin"
          onClick={() => track('signup_started', { source, from: 'tiktok_nav' })}
          className="text-white/40 hover:text-white text-xs font-medium transition-colors"
        >
          Sign in
        </Link>
      </header>

      <main className="container mx-auto px-4 pb-28 max-w-lg">
        {/* Hero — tight, above the fold */}
        <div className="text-center space-y-2.5 mb-5">
          <h1 className="text-[26px] sm:text-3xl font-black tracking-tight leading-[1.15]">
            Paste the text she sent.
            <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
              Get the reply in 10 seconds.
            </span>
          </h1>
          <p className="text-sm text-white/50">
            No signup. No card. Try it before you send the wrong thing.
          </p>
        </div>

        {/* Input card — ABOVE FOLD on mobile */}
        <div ref={inputCardRef} className="rounded-3xl bg-white/[0.04] border border-white/[0.08] p-4 sm:p-5 backdrop-blur-sm mb-5">
          <textarea
            ref={textareaRef}
            value={msg}
            onChange={(e) => {
              setMsg(e.target.value);
              if (e.target.value.trim().length > 0 && !exampleClicked) {
                track('text_pasted', { source, length: e.target.value.length });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handlePasteSubmit();
              }
            }}
            placeholder='Paste what they said…'
            rows={3}
            className="w-full min-h-[88px] max-h-[200px] p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] text-white placeholder-white/30 resize-none focus:outline-none focus:border-fuchsia-400/60 focus:ring-4 focus:ring-fuchsia-500/10 transition-colors text-[15px] leading-relaxed"
          />

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
              className="h-[52px] rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black text-[15px] flex items-center justify-center gap-2 shadow-xl shadow-violet-600/30 transition-all active:scale-[0.98] ring-1 ring-white/10"
            >
              {hasFilled ? <>Decode this text now <ArrowRight className="h-4 w-4" /></> : <>Decode + write reply <Zap className="h-4 w-4" /></>}
            </button>
            <button
              onClick={() => {
                track('screenshot_upload_clicked', { source });
                fileInputRef.current?.click();
              }}
              disabled={uploading}
              className="h-[48px] rounded-2xl bg-white/[0.05] border border-white/[0.10] hover:bg-white/[0.10] text-white/80 font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {uploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Reading…</>
              ) : (
                <><Camera className="h-4 w-4" /> Upload screenshot</>
              )}
            </button>
          </div>

          <p className="mt-2.5 text-[11px] text-white/30 text-center">
            5 free replies/day · Works with Hinge, Tinder, IG, iMessage
          </p>
        </div>

        {/* Example chips — tap to prefill */}
        <div className="mb-6">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.16em] mb-2 px-1">Try an example</p>
          <div className="grid grid-cols-2 gap-2">
            {exampleChips.map((ex) => (
              <button
                key={ex.label}
                onClick={() => handleSample(ex.text, ex.label)}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-left transition-all hover:border-fuchsia-300/30 hover:bg-white/[0.06] active:scale-[0.97]"
              >
                <span className="block text-[13px] font-bold text-white/80">{ex.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Why this works — compact */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 mb-6">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-200/70 mb-2">
            Why this beats random rizz lines
          </div>
          <div className="grid gap-2 text-[13px]">
            <div className="flex items-start gap-2">
              <span className="text-red-400 text-[11px] font-bold mt-0.5">✗</span>
              <span className="text-white/50">Generic pickup lines that ignore the actual conversation.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 text-[11px] font-bold mt-0.5">✓</span>
              <span className="text-white/75">Reads context, flags neediness risk, gives a short reply you can actually send.</span>
            </div>
          </div>
        </div>

        {/* Platform tags */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {['Hinge', 'Tinder', 'Bumble', 'Instagram', 'iMessage'].map((p) => (
            <span
              key={p}
              className="text-[11px] px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-white/35"
            >
              {p}
            </span>
          ))}
        </div>

        {/* Social links — pushed below the fold */}
        <div className="text-center pt-4 border-t border-white/[0.05]">
          <p className="text-[10px] text-white/20 mb-2">Follow for more</p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://www.tiktok.com/@gulatextwingman"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('social_outbound_click', { source, platform: 'tiktok' })}
              className="text-[11px] text-white/30 hover:text-white/70 transition-colors"
            >
              TikTok
            </a>
            <a
              href="https://www.youtube.com/@gulatextwingman"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('social_outbound_click', { source, platform: 'youtube' })}
              className="text-[11px] text-white/30 hover:text-white/70 transition-colors"
            >
              YouTube
            </a>
            <a
              href="https://www.instagram.com/gulatextwingman"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('social_outbound_click', { source, platform: 'instagram' })}
              className="text-[11px] text-white/30 hover:text-white/70 transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>
      </main>

      {/* Sticky mobile CTA — text changes based on textarea state */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
        <div className="p-4 pointer-events-auto bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => {
                track('decode_clicked', { source, from: 'sticky_cta', filled: hasFilled });
                if (hasFilled) {
                  handlePasteSubmit();
                } else {
                  inputCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  textareaRef.current?.focus();
                }
              }}
              className="w-full h-12 text-[15px] font-black rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-2xl shadow-violet-600/30 transition-all active:scale-[0.98]"
            >
              {stickyLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
