'use client';

// app/tiktok/page.tsx
// Stripped-down landing for TikTok bio traffic.
// No long-form sections — hero + input card that drops straight into /app with ?src=tiktok&prefill=... and Fast mode forced.

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ArrowRight, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { captureAttribution, track } from '@/lib/analytics';

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
      <main className="container mx-auto px-4 pt-6 pb-24 max-w-xl">
        <div className="text-center space-y-4 mb-7">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.1]">
            Paste the text. Get the reply.
            <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent mt-1">
              Send it in 10 seconds.
            </span>
          </h1>
          <p className="text-sm text-white/45 leading-relaxed">
            No signup &bull; 5 free replies/day &bull; Works for Hinge, Tinder, Bumble, IG, iMessage.
          </p>
        </div>

        {/* Input card */}
        <div className="rounded-3xl bg-white/[0.04] border border-white/[0.08] p-5 sm:p-6 backdrop-blur-sm">
          <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
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
            className="w-full min-h-[110px] max-h-[220px] p-4 rounded-2xl bg-black/30 border border-white/[0.08] text-white placeholder-white/30 resize-none focus:outline-none focus:border-violet-500/40 transition-colors text-[15px] leading-relaxed"
          />

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
            <button
              onClick={handlePasteSubmit}
              className="h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25 transition-all active:scale-[0.98]"
            >
              Paste her text free <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Benefit chips (real, not fake stats) */}
          <div className="mt-5 flex flex-wrap justify-center gap-1.5">
            {[
              '5 free replies/day',
              'No card',
              'Screenshot upload',
              'Replies under 18 words',
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
              Paste the text
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
