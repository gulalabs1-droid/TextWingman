'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft, Copy, Sparkles, Loader2, Zap, Heart, MessageCircle,
  Shield, CheckCircle, Camera, X, Brain, Send, ChevronDown, ChevronUp,
  RotateCcw, Trash2, Check,
} from 'lucide-react';
import { Logo } from '@/components/Logo';

// ── Types ──────────────────────────────────────────────────
type Reply = { tone: 'shorter' | 'spicier' | 'softer'; text: string };

type ThreadMessage = {
  role: 'them' | 'you';
  text: string;
  timestamp: number;
};

type DecodeResult = {
  intent: string;
  subtext: string;
  energy: string;
  flags: { type: 'green' | 'red' | 'yellow'; text: string }[];
  coach_tip: string;
} | null;

// ── Constants ──────────────────────────────────────────────
const TONE_CONFIG = {
  shorter: { label: 'Shorter', description: 'Brief & casual', gradient: 'from-blue-500 to-cyan-500', lightBg: 'bg-blue-50', emoji: '⚡' },
  spicier: { label: 'Spicier', description: 'Playful & flirty', gradient: 'from-rose-500 to-pink-500', lightBg: 'bg-rose-50', emoji: '🔥' },
  softer:  { label: 'Softer', description: 'Warm & genuine', gradient: 'from-green-500 to-emerald-500', lightBg: 'bg-green-50', emoji: '💚' },
};

const CONTEXT_OPTIONS = [
  { value: 'crush', label: 'Crush', emoji: '💕' },
  { value: 'friend', label: 'Friend', emoji: '🤝' },
  { value: 'work', label: 'Work', emoji: '💼' },
  { value: 'ex', label: 'Ex', emoji: '💔' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { value: 'new-match', label: 'New Match', emoji: '💘' },
];

const ENERGY_CONFIG: Record<string, { emoji: string; bg: string; color: string }> = {
  interested:       { emoji: '💚', bg: 'bg-green-100', color: 'text-green-700' },
  testing:          { emoji: '🧪', bg: 'bg-yellow-100', color: 'text-yellow-700' },
  neutral:          { emoji: '😐', bg: 'bg-gray-100', color: 'text-gray-700' },
  'pulling-away':   { emoji: '🚪', bg: 'bg-red-100', color: 'text-red-700' },
  flirty:           { emoji: '😏', bg: 'bg-pink-100', color: 'text-pink-700' },
  confrontational:  { emoji: '⚔️', bg: 'bg-orange-100', color: 'text-orange-700' },
  anxious:          { emoji: '😰', bg: 'bg-purple-100', color: 'text-purple-700' },
  playful:          { emoji: '😄', bg: 'bg-cyan-100', color: 'text-cyan-700' },
  cold:             { emoji: '🧊', bg: 'bg-blue-100', color: 'text-blue-700' },
  warm:             { emoji: '☀️', bg: 'bg-amber-100', color: 'text-amber-700' },
};

export default function ExperimentalThreadPage() {
  // ── State ──────────────────────────────────────────────
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [input, setInput] = useState('');
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<string>('crush');
  const [showThread, setShowThread] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [pendingSent, setPendingSent] = useState<Reply | null>(null);
  const [decoding, setDecoding] = useState(false);
  const [decodeResult, setDecodeResult] = useState<DecodeResult>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // ── Load Pro status ────────────────────────────────────
  useEffect(() => {
    fetch('/api/usage').then(r => r.json()).then(d => {
      if (d.isPro) setIsPro(true);
    }).catch(() => {});
  }, []);

  // ── Auto-scroll thread ────────────────────────────────
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  // ── Build thread context string for API ────────────────
  const buildThreadContext = (extraMessage?: string) => {
    const lines = thread.map(m => `${m.role === 'them' ? 'Them' : 'You'}: ${m.text}`);
    if (extraMessage) lines.push(`Them: ${extraMessage}`);
    return lines.join('\n');
  };

  // ── Add message to thread ──────────────────────────────
  const addToThread = (role: 'them' | 'you', text: string) => {
    setThread(prev => [...prev, { role, text, timestamp: Date.now() }]);
  };

  // ── Handle "I sent this" ───────────────────────────────
  const handleMarkSent = (reply: Reply) => {
    addToThread('you', reply.text);
    setPendingSent(null);
    setReplies([]);
    setDecodeResult(null);
    setInput('');
    toast({ title: '✓ Marked as sent', description: 'Paste their next reply to keep going' });
  };

  // ── Generate replies ───────────────────────────────────
  const handleGenerate = async () => {
    if (!input.trim()) return;

    // Add their message to thread
    addToThread('them', input.trim());

    setLoading(true);
    setReplies([]);
    setDecodeResult(null);
    setPendingSent(null);

    try {
      const fullContext = buildThreadContext(input.trim());
      const endpoint = isPro ? '/api/generate-v2' : '/api/generate';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fullContext,
          context: selectedContext,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          toast({ title: '🔒 Limit reached', description: 'Upgrade to Pro for unlimited replies', variant: 'destructive' });
        } else {
          throw new Error(data.error || 'Failed to generate');
        }
        return;
      }

      // Handle V2 format
      if (isPro && data.shorter && data.spicier && data.softer) {
        setReplies([
          { tone: 'shorter', text: data.shorter },
          { tone: 'spicier', text: data.spicier },
          { tone: 'softer', text: data.softer },
        ]);
      } else if (Array.isArray(data.replies)) {
        setReplies(data.replies.filter((r: any) => r?.tone && r?.text));
      }

      setInput('');
      toast({ title: isPro ? '✅ Verified replies ready' : '✨ Replies generated', description: 'Pick one and mark it as sent to continue' });
    } catch (err) {
      toast({ title: 'Failed', description: err instanceof Error ? err.message : 'Try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Copy + prompt "I sent this" ────────────────────────
  const handleCopy = async (reply: Reply) => {
    await navigator.clipboard.writeText(reply.text);
    setCopied(reply.tone);
    setPendingSent(reply);
    toast({ title: '✓ Copied!', description: 'Tap "I sent this" to add it to the thread' });
    setTimeout(() => setCopied(null), 3000);
  };

  // ── Decode latest message ──────────────────────────────
  const handleDecode = async () => {
    const lastThem = [...thread].reverse().find(m => m.role === 'them');
    const textToDecode = input.trim() || lastThem?.text;
    if (!textToDecode) {
      toast({ title: 'Nothing to decode', description: 'Paste a message first', variant: 'destructive' });
      return;
    }

    setDecoding(true);
    setDecodeResult(null);
    try {
      const fullContext = thread.length > 0 ? buildThreadContext(input.trim() || undefined) : textToDecode;
      const res = await fetch('/api/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: fullContext, context: selectedContext }),
      });
      const data = await res.json();
      if (res.status === 429) {
        toast({ title: '🔒 Decode limit reached', description: 'Upgrade to Pro for unlimited', variant: 'destructive' });
        return;
      }
      if (data.error && !data.intent) {
        toast({ title: 'Decode failed', description: data.error, variant: 'destructive' });
        return;
      }
      setDecodeResult(data);
    } catch {
      toast({ title: 'Decode failed', variant: 'destructive' });
    } finally {
      setDecoding(false);
    }
  };

  // ── Screenshot upload ──────────────────────────────────
  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotPreview(URL.createObjectURL(file));
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/extract-screenshot', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.text) {
        setInput(data.text);
        toast({ title: '📸 Screenshot read!', description: 'Text extracted — hit Generate or Decode' });
      }
    } catch {
      toast({ title: 'Failed to read screenshot', variant: 'destructive' });
    } finally {
      setExtracting(false);
      setScreenshotPreview(null);
      e.target.value = '';
    }
  };

  // ── Reset thread ───────────────────────────────────────
  const handleReset = () => {
    setThread([]);
    setReplies([]);
    setInput('');
    setDecodeResult(null);
    setPendingSent(null);
    toast({ title: 'Thread cleared', description: 'Starting fresh' });
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="container mx-auto px-4 py-6 pb-12 max-w-md md:max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button asChild variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/10 rounded-xl">
            <Link href="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Logo size="sm" showText={false} />
            <span className="text-white font-bold text-sm">Thread Mode</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">EXPERIMENTAL</span>
          </div>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Context Selector — compact */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {CONTEXT_OPTIONS.map(ctx => (
            <button
              key={ctx.value}
              onClick={() => setSelectedContext(ctx.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedContext === ctx.value
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
              }`}
            >
              {ctx.emoji} {ctx.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/* THREAD VIEW                                    */}
        {/* ═══════════════════════════════════════════════ */}
        {thread.length > 0 && (
          <Card className="mb-4 bg-white/95 backdrop-blur border-0 shadow-xl rounded-3xl overflow-hidden">
            <button
              onClick={() => setShowThread(!showThread)}
              className="w-full px-5 py-3 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-bold text-purple-800">
                  Thread ({thread.length} message{thread.length !== 1 ? 's' : ''})
                </span>
              </div>
              {showThread ? <ChevronUp className="h-4 w-4 text-purple-400" /> : <ChevronDown className="h-4 w-4 text-purple-400" />}
            </button>

            {showThread && (
              <CardContent className="p-4 pt-2 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {thread.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'you' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                        msg.role === 'them'
                          ? 'bg-gray-100 text-gray-900 rounded-bl-md'
                          : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-br-md'
                      }`}>
                        <p className="font-medium">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={threadEndRef} />
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* "I SENT THIS" bar — shows after copying a reply */}
        {pendingSent && (
          <div className="mb-4 animate-in slide-in-from-bottom-3 duration-300">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4 shadow-xl">
              <p className="text-white/80 text-xs font-medium mb-2">Did you send this?</p>
              <p className="text-white font-bold text-sm mb-3">&ldquo;{pendingSent.text}&rdquo;</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleMarkSent(pendingSent)}
                  size="sm"
                  className="flex-1 bg-white text-green-700 hover:bg-green-50 font-bold rounded-xl"
                >
                  <Check className="h-4 w-4 mr-1" /> I sent this
                </Button>
                <Button
                  onClick={() => setPendingSent(null)}
                  size="sm"
                  variant="ghost"
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
                >
                  Not yet
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* INPUT CARD                                     */}
        {/* ═══════════════════════════════════════════════ */}
        <Card className="mb-4 bg-white/95 backdrop-blur border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-5 bg-gradient-to-r from-purple-50 to-white">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              {thread.length === 0 ? (
                <><MessageCircle className="h-4 w-4 text-purple-600" /> Paste their first message</>
              ) : (
                <><MessageCircle className="h-4 w-4 text-purple-600" /> What did they say next?</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            <div className="relative">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={thread.length === 0
                  ? 'Drop their message here...'
                  : 'Paste their reply...'
                }
                className="w-full min-h-[100px] p-4 pb-7 rounded-2xl border-2 border-gray-200 bg-white/50 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 transition-all text-sm"
                maxLength={2000}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
                }}
              />
              <div className={`absolute bottom-2 right-3 text-xs ${input.length > 1800 ? 'text-red-500' : 'text-gray-400'}`}>
                {input.length}/2000
              </div>
            </div>

            {/* Screenshot */}
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleScreenshot} className="hidden" />
            {screenshotPreview && (
              <div className="relative rounded-2xl overflow-hidden border-2 border-purple-300">
                <img src={screenshotPreview} alt="Screenshot" className="w-full max-h-32 object-cover opacity-80" />
                {extracting && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="flex items-center gap-2 bg-white/90 rounded-xl px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                      <span className="text-xs font-bold text-purple-800">Reading...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/50 hover:bg-purple-50 transition-all text-purple-600"
              >
                <Camera className="h-4 w-4" />
              </button>

              {/* Action buttons */}
              <Button
                onClick={handleGenerate}
                disabled={loading || !input.trim()}
                className={`flex-1 h-11 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 ${
                  isPro
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                }`}
              >
                {loading ? (
                  <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <>{isPro ? <Shield className="mr-1.5 h-4 w-4" /> : <Sparkles className="mr-1.5 h-4 w-4" />} {thread.length === 0 ? 'Generate' : 'Reply'}</>
                )}
              </Button>

              <Button
                onClick={handleDecode}
                disabled={decoding || (!input.trim() && thread.length === 0)}
                className="h-11 px-4 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all active:scale-95 disabled:opacity-50"
              >
                {decoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              </Button>
            </div>

            <p className="text-center text-[11px] text-gray-400">
              {thread.length === 0 ? 'Paste a message to start the thread' : `⌘+Enter to generate · ${thread.length} messages in thread`}
            </p>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════ */}
        {/* DECODE RESULTS                                 */}
        {/* ═══════════════════════════════════════════════ */}
        {decodeResult && (
          <Card className="mb-4 bg-white/95 backdrop-blur border-0 shadow-xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                  <Brain className="h-4 w-4 text-amber-600" /> Decoded
                </h3>
                <button onClick={() => setDecodeResult(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${(ENERGY_CONFIG[decodeResult.energy] || ENERGY_CONFIG.neutral).bg} ${(ENERGY_CONFIG[decodeResult.energy] || ENERGY_CONFIG.neutral).color} border`}>
                  {(ENERGY_CONFIG[decodeResult.energy] || ENERGY_CONFIG.neutral).emoji} {decodeResult.energy.replace('-', ' ')}
                </span>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                <p className="text-xs font-bold text-amber-700 mb-1">What they mean:</p>
                <p className="text-gray-900 text-sm font-medium">{decodeResult.intent}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-xs font-bold text-gray-500 mb-1">Between the lines:</p>
                <p className="text-gray-700 text-xs">{decodeResult.subtext}</p>
              </div>
              {decodeResult.flags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {decodeResult.flags.map((flag, i) => (
                    <span key={i} className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      flag.type === 'green' ? 'bg-green-100 text-green-700' :
                      flag.type === 'red' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {flag.type === 'green' ? '🟢' : flag.type === 'red' ? '🔴' : '🟡'} {flag.text}
                    </span>
                  ))}
                </div>
              )}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-3 border border-purple-200">
                <p className="text-xs font-bold text-purple-600 mb-1 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Coach Tip</p>
                <p className="text-gray-800 text-xs font-medium">{decodeResult.coach_tip}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* REPLY CARDS                                    */}
        {/* ═══════════════════════════════════════════════ */}
        {replies.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="text-center">
              <h2 className="text-lg font-bold text-white">Pick a reply</h2>
              <p className="text-xs text-purple-200">Copy one → mark it as sent → keep going</p>
            </div>
            {replies.map((reply, idx) => {
              const config = TONE_CONFIG[reply.tone];
              const isCopied = copied === reply.tone;
              const label = ['A', 'B', 'C'][idx];
              return (
                <Card
                  key={reply.tone}
                  style={{ animationDelay: `${idx * 100}ms` }}
                  className={`relative overflow-hidden bg-white border-2 shadow-xl rounded-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 group active:scale-[0.98] ${
                    isPro ? 'border-green-200 hover:border-green-300' : 'hover:shadow-purple-500/30'
                  }`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${config.gradient}`} />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white font-bold text-xs`}>
                          {label}
                        </span>
                        <span className="text-xs font-bold text-gray-500">{config.emoji} {config.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold bg-gradient-to-r ${config.gradient} text-white px-2 py-0.5 rounded-full`}>
                          {reply.text.split(' ').length}w
                        </span>
                        {isPro && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">
                            <CheckCircle className="h-2.5 w-2.5" /> V2
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`${config.lightBg} rounded-xl p-3 mb-3`}>
                      <p className="text-gray-900 text-sm font-medium leading-relaxed">{reply.text}</p>
                    </div>
                    <Button
                      onClick={() => handleCopy(reply)}
                      className={`w-full h-10 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                        isCopied
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : `bg-gradient-to-r ${config.gradient} text-white hover:opacity-90`
                      }`}
                    >
                      {isCopied ? <><Check className="mr-1.5 h-3.5 w-3.5" /> Copied — Tap &ldquo;I sent this&rdquo; above</> : <><Copy className="mr-1.5 h-3.5 w-3.5" /> Copy</>}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {thread.length === 0 && replies.length === 0 && !decodeResult && (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-white/10 flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-purple-300" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Start a conversation thread</h3>
              <p className="text-white/50 text-sm mt-1 max-w-sm mx-auto">
                Paste their message, get replies, mark what you sent — the AI remembers the full conversation for better replies every turn.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" /> They say</div>
              <span>→</span>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> You reply</div>
              <span>→</span>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" /> They respond</div>
              <span>→</span>
              <div className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Repeat</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
