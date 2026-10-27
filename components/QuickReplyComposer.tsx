'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ArrowRight, Loader2, Zap, Copy, Check, BookmarkPlus } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { captureAttribution, getAnalyticsContext, track } from '@/lib/analytics';
import { createReplyGenerationId, deriveStyleSignals, recordLocalStyleSignal, replyIdFor, sendReplyLearningEvent } from '@/lib/reply-learning';
import { SOCIAL_LINKS } from '@/lib/site';
import { useToast } from '@/components/ui/use-toast';
import { validateMessage, validateScreenshot, validateQuickReplies } from '@/lib/quick-reply';

const exampleChips = [
  { label: 'She said "maybe"', text: "haha maybe, depends who's asking" },
  { label: '"We need to talk"', text: 'we need to talk' },
  { label: 'Dry "lol"', text: 'lol' },
  { label: '"I\'m busy"', text: "i'm kinda busy this week tbh" },
];

type QuickReply = {
  tone: 'shorter' | 'spicier' | 'softer';
  text: string;
  generationId: string;
  replyId: string;
};

const replyLabels = { shorter: 'Keep it short', spicier: 'Another angle', softer: 'Keep it warm' };

export default function QuickReplyComposer({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const [source, setSource] = useState(embedded ? 'web' : 'shorts');
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [lastMessage, setLastMessage] = useState('');
  const [replyError, setReplyError] = useState('');
  const [limitReached, setLimitReached] = useState(false);
  const [copiedReply, setCopiedReply] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sentReply, setSentReply] = useState<string | null>(null);
  const copiedTexts = useRef<Record<string, string>>({});
  const generationInFlight = useRef(false);
  const resultsRef = useRef<HTMLElement>(null);
  const textPastedTracked = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputCardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    captureAttribution();
    const url = new URL(window.location.href);
    const explicitSource = url.searchParams.get('utm_source') || url.searchParams.get('src');
    const referrer = document.referrer.toLowerCase();
    const referredPlatform = referrer.includes('tiktok')
      ? 'tiktok'
      : referrer.includes('youtube') || referrer.includes('youtu.be')
        ? 'youtube'
        : referrer.includes('instagram')
          ? 'instagram'
          : null;
    const channel = explicitSource || referredPlatform || (embedded ? 'web' : 'shorts');
    setSource(channel);
    track(embedded ? 'landing_view' : 'social_landing_view', { source: channel, referrerPlatform: referredPlatform || 'direct' });
  }, [embedded]);

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

  const savePendingThread = () => {
    const pending = JSON.stringify({
      savedAt: Date.now(),
      thread: [{ role: 'them', text: lastMessage, timestamp: Date.now() }],
      replies: replies.map(reply => ({ ...reply, text: drafts[reply.replyId] ?? reply.text })),
      selectedContext: 'crush',
      lastGeneratedMessage: lastMessage,
    });
    try {
      sessionStorage.setItem('tw_pending_thread', pending);
      localStorage.setItem('tw_pending_thread', pending);
    } catch {}
  };

  const generateReply = async (text: string, via: string) => {
    if (generationInFlight.current) return;
    const validation = validateMessage(text);
    if (validation.error) {
      setReplyError(validation.error);
      textareaRef.current?.focus();
      return;
    }
    text = validation.message;
    generationInFlight.current = true;
    setGenerating(true);
    setReplyError('');
    setLimitReached(false);
    setReplies([]);
    setCopiedReply(null);
    setEditingReply(null);
    setDrafts({});
    setSentReply(null);
    copiedTexts.current = {};
    track('composer_submit', { source, via, length: text.length, from: 'social_inline' });
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25_000);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context: 'crush', analytics: getAnalyticsContext() }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) {
        setLimitReached(response.status === 429);
        throw new Error(data.message || data.error || 'Could not generate replies. Please try again.');
      }
      const generationId = createReplyGenerationId();
      const validReplies: QuickReply[] = validateQuickReplies(data.replies)
        .map(reply => ({ ...reply, generationId, replyId: replyIdFor(generationId, reply.tone) }));
      setLastMessage(text);
      setReplies(validReplies);
      track('reply_displayed', { source, count: validReplies.length, from: 'social_inline' });
      requestAnimationFrame(() => {
        resultsRef.current?.focus({ preventScroll: true });
        textareaRef.current?.blur();
        resultsRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      });
    } catch (error) {
      const message = error instanceof Error && error.name === 'AbortError'
        ? 'That took too long. Your text is still here; try again.'
        : error instanceof Error ? error.message : 'Connection interrupted. Please try again.';
      setReplyError(message);
      track('reply_error', { source, reason: message.slice(0, 120), from: 'social_inline' });
    } finally {
      window.clearTimeout(timeout);
      generationInFlight.current = false;
      setGenerating(false);
    }
  };

  const handleCopy = async (reply: QuickReply) => {
    const text = (drafts[reply.replyId] ?? reply.text).trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedReply(reply.replyId);
      setEditingReply(null);
      if (copiedTexts.current[reply.replyId] !== text) {
        const styleSignals = deriveStyleSignals(text);
        const edited = text !== reply.text.trim();
        recordLocalStyleSignal(styleSignals, reply.tone, edited ? 'edited' : 'copied');
        for (const event of ['selected', ...(edited ? ['edited' as const] : []), 'copied'] as const) {
          sendReplyLearningEvent({ event, generationId: reply.generationId, replyId: reply.replyId, tone: reply.tone, context: 'crush', styleSignals, props: { source, from: embedded ? 'home_inline' : 'social_inline' } });
        }
        copiedTexts.current[reply.replyId] = text;
      }
    } catch {
      toast({ title: 'Select and copy the reply', description: 'Your browser did not allow clipboard access.' });
    }
  };

  const handleSent = (reply: QuickReply) => {
    if (sentReply === reply.replyId || !copiedTexts.current[reply.replyId]) return;
    setSentReply(reply.replyId);
    sendReplyLearningEvent({ event: 'sent_confirmed', generationId: reply.generationId, replyId: reply.replyId, tone: reply.tone, context: 'crush', styleSignals: deriveStyleSignals(copiedTexts.current[reply.replyId]), props: { source, from: embedded ? 'home_inline' : 'social_inline', self_reported: true } });
  };

  const handlePasteSubmit = () => {
    const text = msg.trim();
    if (!text) {
      textareaRef.current?.focus();
      inputCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    void generateReply(text, 'paste');
  };

  const handleSample = (text: string, label: string) => {
    setMsg(text);
    textPastedTracked.current = true;
    track('example_clicked', { source, label });
    void generateReply(text, 'example');
  };

  const handleInstantDemo = () => {
    const example = exampleChips[0];
    track('example_clicked', { source, label: example.label, mode: 'instant_demo' });
    setMsg(example.text);
    void generateReply(example.text, 'example');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const validationError = validateScreenshot(file);
    if (validationError) {
      setReplyError(validationError);
      return;
    }
    setReplyError('');
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
        body: JSON.stringify({ image: dataUrl, analytics: getAnalyticsContext() }),
      });
      const data = await res.json();
      const extracted: string | null = data?.extracted_text || data?.full_conversation || data?.last_received || null;
      if (!res.ok || !extracted) {
        track('screenshot_upload_failed', {
          source,
          reason: !res.ok ? `http_${res.status}` : 'no_text_found',
        });
        setUploading(false);
        toast({
          title: 'Could not read that screenshot',
          description: data?.error || 'Try a clearer crop or paste the text instead.',
          variant: 'destructive',
        });
        return;
      }
      track('screenshot_upload_succeeded', { source, textLength: extracted.length });
      setMsg(extracted);
      setUploading(false);
      void generateReply(extracted, 'upload');
    } catch {
      track('screenshot_upload_failed', { source, reason: 'network_or_reader_error' });
      setUploading(false);
      toast({
        title: 'Upload failed',
        description: 'Try again or paste the text instead.',
        variant: 'destructive',
      });
    }
  };

  const hasFilled = msg.trim().length > 0;
  const stickyLabel = generating ? 'Writing your replies...' : hasFilled ? 'Get 3 free replies' : 'Paste a text to get started';
  const Content = embedded ? 'div' : 'main';

  return (
    <div className={embedded ? 'text-white' : 'min-h-screen bg-[#0a0a0f] text-white'}>
      {/* Minimal top bar */}
      {!embedded && <header className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Logo size="sm" showText={true} className="cursor-pointer opacity-70" />
        <Link
          href="/login?mode=signin"
          onClick={() => track('sign_in_started', { source, from: 'tiktok_nav' })}
          className="text-white/40 hover:text-white text-xs font-medium transition-colors"
        >
          Sign in
        </Link>
      </header>}

      <Content className={embedded ? 'mx-auto max-w-xl' : 'container mx-auto px-4 pb-28 max-w-lg'}>
        {/* Hero — tight, above the fold */}
        {!embedded && <div className="text-center space-y-2.5 mb-5">
          <h1 className="text-[26px] sm:text-3xl font-black tracking-tight leading-[1.15]">
            Paste the text they sent.
            <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
              Get 3 replies that sound like you.
            </span>
          </h1>
          <p className="text-sm text-white/50">
            Short, playful or warm. Choose what you would actually send.
          </p>
        </div>}

        {/* Input card — ABOVE FOLD on mobile */}
        <div ref={inputCardRef} className="rounded-3xl bg-white/[0.04] border border-white/[0.08] p-4 sm:p-5 backdrop-blur-sm mb-5">
          <label htmlFor={embedded ? 'home-message' : 'social-message'} className="mb-2 block text-sm font-semibold text-white/80">What did they say?</label>
          <textarea
            id={embedded ? 'home-message' : 'social-message'}
            ref={textareaRef}
            value={msg}
            onChange={(e) => {
              setMsg(e.target.value);
              if (e.target.value.trim().length > 0 && !textPastedTracked.current) {
                textPastedTracked.current = true;
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
            maxLength={6000}
            aria-label="Their message or conversation"
            aria-describedby="message-privacy"
            disabled={generating || uploading}
            className="w-full min-h-[88px] max-h-[200px] p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] text-white placeholder-white/40 resize-none focus:outline-none focus:border-fuchsia-400/60 focus:ring-4 focus:ring-fuchsia-500/10 transition-colors text-base leading-relaxed disabled:opacity-70"
          />
          <p id="message-privacy" className="mt-2 text-xs text-white/50">Remove names and numbers. We never connect to your inbox or send messages for you.</p>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              ref={fileInputRef}
              type="file"
              aria-label="Upload a conversation screenshot"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={handlePasteSubmit}
              disabled={generating || uploading}
              className="h-[52px] rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black text-[15px] flex items-center justify-center gap-2 shadow-xl shadow-violet-600/30 transition-all active:scale-[0.98] ring-1 ring-white/10 disabled:opacity-60"
            >
              {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Writing your replies...</> : <>Get 3 free replies <Zap className="h-4 w-4" /></>}
            </button>
            <button
              onClick={() => {
                track('screenshot_upload_clicked', { source });
                fileInputRef.current?.click();
              }}
              disabled={uploading || generating}
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
            No account or card needed · 5 free replies/day · You choose what to send
          </p>

          {replyError && (
            <div role="alert" className="mt-3 rounded-xl border border-red-300/20 bg-red-300/5 p-3 text-sm text-red-100">
              <p>{replyError}</p>
              {limitReached && <Link href="/pricing" className="mt-2 inline-block font-bold underline">See Pro plans</Link>}
            </div>
          )}

          {replies.length === 0 && !generating && (
          <button
            onClick={handleInstantDemo}
            aria-label="Try the example reply for free"
            className="mt-3 w-full rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/[0.06] p-3 text-left text-[12px] text-fuchsia-100/80 transition-colors hover:border-fuchsia-300/35 hover:bg-fuchsia-300/[0.10]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-fuchsia-200/70">Example, before you try</p>
                <p className="truncate text-white/55">Them: &quot;haha maybe, depends who&apos;s asking&quot;</p>
                <p className="truncate text-red-200/70">Don&apos;t send: &quot;so... maybe?&quot;</p>
                <p className="font-bold text-emerald-200/90">Try: &quot;someone with good taste and a friday plan&quot;</p>
              </div>
              <ArrowRight className="mt-6 h-4 w-4 shrink-0 text-fuchsia-200" />
            </div>
            <p className="mt-2 text-[11px] font-black text-fuchsia-100">Try this exact text free</p>
          </button>
          )}
        </div>

        {generating && <p role="status" className="mb-4 text-center text-sm text-white/65">Reading the context and writing three options. Your message stays here.</p>}

        {replies.length > 0 && (
          <section ref={resultsRef} tabIndex={-1} aria-label="Your reply options" className="mb-6 scroll-mt-4 outline-none">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-300">Your replies are ready</p>
            <h2 className="mb-3 text-xl font-bold">Which one sounds like you?</h2>
            <div className="space-y-2">
              {replies.map(reply => (
                <div key={reply.replyId} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-white/50">{replyLabels[reply.tone]}</p>
                    <button onClick={() => void handleCopy(reply)} disabled={!(drafts[reply.replyId] ?? reply.text).trim()} aria-label={`Copy ${replyLabels[reply.tone].toLowerCase()} reply`} className="flex min-h-11 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-40">
                      {copiedReply === reply.replyId ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                    </button>
                  </div>
                  {editingReply === reply.replyId ? (
                    <textarea aria-label={`Edit ${replyLabels[reply.tone].toLowerCase()} reply`} value={drafts[reply.replyId] ?? reply.text} onChange={event => { setDrafts(previous => ({ ...previous, [reply.replyId]: event.target.value })); setCopiedReply(null); }} maxLength={1000} rows={3} className="w-full rounded-xl border border-violet-300/40 bg-black/30 p-3 text-base leading-relaxed text-white focus:outline-none focus:ring-2 focus:ring-violet-300/40" />
                  ) : <p className="select-text break-words text-base leading-relaxed text-white">{drafts[reply.replyId] ?? reply.text}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button onClick={() => setEditingReply(editingReply === reply.replyId ? null : reply.replyId)} className="min-h-11 text-xs font-semibold text-violet-200 hover:text-white">{editingReply === reply.replyId ? 'Done editing' : 'Make it sound like you'}</button>
                    {copiedReply === reply.replyId && <button onClick={() => handleSent(reply)} disabled={sentReply === reply.replyId} className="min-h-10 text-xs font-semibold text-emerald-200 disabled:opacity-60">{sentReply === reply.replyId ? 'Marked as sent by you' : 'I sent this (optional)'}</button>}
                  </div>
                </div>
              ))}
            </div>
            <p role="status" className="mt-2 text-xs text-white/45">{copiedReply ? 'Copied. Edit it if you want, then send it in your chat.' : 'You are in control. Copy a reply, edit it, and send it yourself.'}</p>
            <div className="mt-4 rounded-2xl border border-violet-300/25 bg-violet-400/10 p-4">
              <h3 className="font-bold">Save this reply and keep the thread free.</h3>
              <p className="mb-3 mt-1 text-xs leading-relaxed text-white/55">Create a free account to save the thread and return when they answer.</p>
              <Link href={`/login?mode=signup&redirect=${encodeURIComponent('/app?restore=1')}`} onClick={() => { savePendingThread(); track('signup_cta_click', { source, from: 'social_inline_result', handoff: 'restore_thread' }); }} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-500 font-bold text-white hover:bg-violet-400">
                <BookmarkPlus className="h-4 w-4" /> Save this conversation free
              </Link>
              <button onClick={() => { savePendingThread(); const params = new URLSearchParams({ ...buildUtmParams(), restore: '1' }); router.push(`/app?${params.toString()}`); }} className="mt-3 w-full text-xs font-semibold text-white/50 hover:text-white">Continue in the full coach</button>
              <p className="mt-2 text-center text-[11px] text-white/35">Free account. No card.</p>
            </div>
          </section>
        )}

        {/* Example chips — tap to prefill */}
        <div className="mb-6">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.16em] mb-2 px-1">Try an example</p>
          <div className="grid grid-cols-2 gap-2">
            {exampleChips.map((ex) => (
              <button
                key={ex.label}
                onClick={() => handleSample(ex.text, ex.label)}
                disabled={generating || uploading}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-left transition-all hover:border-fuchsia-300/30 hover:bg-white/[0.06] active:scale-[0.97] disabled:opacity-50"
              >
                <span className="block text-[13px] font-bold text-white/80">{ex.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Why this works — compact */}
        {!embedded && <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 mb-6">
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
              <span className="text-white/75">Uses the text you paste to suggest three reply options. You choose, edit, and send.</span>
            </div>
          </div>
        </div>}

        {/* Platform tags */}
        {!embedded && <div className="flex flex-wrap justify-center gap-2 mb-8">
          {['Hinge', 'Tinder', 'Bumble', 'Instagram', 'iMessage'].map((p) => (
            <span
              key={p}
              className="text-[11px] px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-white/35"
            >
              {p}
            </span>
          ))}
        </div>}

        {/* Social links — pushed below the fold */}
        {!embedded && <div className="text-center pt-4 border-t border-white/[0.05]">
          <p className="text-[10px] text-white/20 mb-2">Follow for more</p>
          <div className="flex items-center justify-center gap-4">
            <a
              href={SOCIAL_LINKS.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('social_outbound_click', { source, platform: 'tiktok' })}
              className="text-[11px] text-white/30 hover:text-white/70 transition-colors"
            >
              TikTok
            </a>
            <a
              href={SOCIAL_LINKS.youtube}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('social_outbound_click', { source, platform: 'youtube' })}
              className="text-[11px] text-white/30 hover:text-white/70 transition-colors"
            >
              YouTube
            </a>
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('social_outbound_click', { source, platform: 'instagram' })}
              className="text-[11px] text-white/30 hover:text-white/70 transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>}
      </Content>

      {/* Sticky mobile CTA — text changes based on textarea state */}
      {!embedded && replies.length === 0 && <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-auto bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => {
                if (hasFilled) {
                  handlePasteSubmit();
                } else {
                  inputCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  textareaRef.current?.focus();
                }
              }}
              disabled={generating || uploading}
              className="w-full h-12 text-[15px] font-black rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-2xl shadow-violet-600/30 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {stickyLabel}
            </button>
          </div>
        </div>
      </div>}
    </div>
  );
}
