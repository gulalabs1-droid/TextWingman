'use client';

import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft, Copy, Sparkles, Loader2, Zap, Heart, MessageCircle,
  Shield, CheckCircle, Camera, X, Brain, Send, ChevronDown, ChevronUp,
  RotateCcw, Trash2, Check, Clock, List, Plus, Sun, Moon, Target, Gauge, TrendingUp, TrendingDown, Wand2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────
type Reply = { tone: 'shorter' | 'spicier' | 'softer'; text: string };

type ThreadMessage = {
  role: 'them' | 'you';
  text: string;
  timestamp: number;
};

type SavedThread = {
  id: string;
  name: string;
  context: string | null;
  updated_at: string;
  message_count: number;
  last_message: { role: string; text: string } | null;
};

type DecodeResult = {
  intent: string;
  subtext: string;
  energy: string;
  flags: { type: 'green' | 'red' | 'yellow'; text: string }[];
  coach_tip: string;
} | null;

type StrategyData = {
  momentum: string;
  balance: string;
  move: {
    energy: string;
    one_liner: string;
    constraints: {
      no_questions: boolean;
      keep_short: boolean;
      add_tease: boolean;
      push_meetup: boolean;
    };
    risk: string;
  };
  latencyMs?: number;
} | null;

// ── Constants ──────────────────────────────────────────────
const TONE_CONFIG = {
  shorter: { label: 'Quick', description: 'Brief & casual', gradient: 'from-cyan-400 to-blue-500', glow: 'shadow-cyan-500/20', darkBg: 'bg-cyan-500/10 border-cyan-500/20', emoji: '⚡' },
  spicier: { label: 'Spicy', description: 'Playful & flirty', gradient: 'from-rose-400 to-pink-500', glow: 'shadow-rose-500/20', darkBg: 'bg-rose-500/10 border-rose-500/20', emoji: '🔥' },
  softer:  { label: 'Soft', description: 'Warm & genuine', gradient: 'from-emerald-400 to-green-500', glow: 'shadow-emerald-500/20', darkBg: 'bg-emerald-500/10 border-emerald-500/20', emoji: '💚' },
};

const CONTEXT_OPTIONS = [
  { value: 'crush', label: 'Crush', emoji: '💕' },
  { value: 'friend', label: 'Friend', emoji: '🤝' },
  { value: 'work', label: 'Work', emoji: '💼' },
  { value: 'ex', label: 'Ex', emoji: '💔' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { value: 'new-match', label: 'New Match', emoji: '💘' },
];

const GOAL_OPTIONS = [
  { value: 'reignite', label: 'Reignite Spark', emoji: '✨' },
  { value: 'meetup', label: 'Set Plans', emoji: '📍' },
  { value: 'defuse', label: 'Defuse Tension', emoji: '🕊️' },
  { value: 'clarify', label: 'Get Clarity', emoji: '🧭' },
  { value: 'keep-light', label: 'Keep It Light', emoji: '🎈' },
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

const PowerPulse = lazy(() => import('@/components/PowerPulse'));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function ExperimentalThreadPage() {
  // ── State ──────────────────────────────────────────────
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [input, setInput] = useState('');
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<string>('crush');
  const [selectedGoal, setSelectedGoal] = useState<string>('reignite');
  const [showThread, setShowThread] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [strategyData, setStrategyData] = useState<StrategyData>(null);
  const [pendingSent, setPendingSent] = useState<Reply | null>(null);
  const [decoding, setDecoding] = useState(false);
  const [decodeResult, setDecodeResult] = useState<DecodeResult>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThreadName, setActiveThreadName] = useState<string | null>(null);
  const [savedThreads, setSavedThreads] = useState<SavedThread[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const isLight = theme === 'light';

  const tactical = useMemo(() => {
    const themCount = thread.filter(m => m.role === 'them').length;
    const youCount = thread.filter(m => m.role === 'you').length;
    const recentSlice = thread.slice(-4);
    const recentThem = recentSlice.filter(m => m.role === 'them').length;
    const recentYou = recentSlice.filter(m => m.role === 'you').length;

    const momentum = recentThem > recentYou ? 'theirs' : recentYou > recentThem ? 'yours' : 'balanced';
    const reciprocityDenominator = Math.max(themCount, youCount, 1);
    const reciprocity = Math.round((Math.min(themCount, youCount) / reciprocityDenominator) * 100);
    const chasePenalty = youCount > themCount ? Math.min((youCount - themCount) * 9, 24) : 0;
    const questionPenalty = (input.match(/\?/g)?.length ?? 0) * 6;
    const longMessagePenalty = input.trim().length > 180 ? 12 : 0;

    const healthScore = clamp(68 + Math.round(reciprocity * 0.22) + (momentum === 'balanced' ? 8 : 0) - chasePenalty, 24, 96);
    const riskScore = clamp(30 + chasePenalty + questionPenalty + longMessagePenalty + (momentum === 'yours' ? 8 : 0), 8, 95);
    const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 46 ? 'medium' : 'low';
    const waitWindow = riskLevel === 'high' ? '45–90 min' : riskLevel === 'medium' ? '20–45 min' : '10–20 min';

    return {
      themCount,
      youCount,
      momentum,
      reciprocity,
      healthScore,
      riskScore,
      riskLevel,
      waitWindow,
    };
  }, [thread, input]);

  const simulatedOutcomes = useMemo(() => {
    return replies.reduce((acc, reply) => {
      let confidence = tactical.healthScore - 12;

      if (reply.tone === 'shorter') confidence += 6;
      if (reply.tone === 'spicier') confidence += selectedGoal === 'meetup' || selectedGoal === 'reignite' ? 8 : -2;
      if (reply.tone === 'softer') confidence += selectedGoal === 'defuse' ? 10 : 2;
      if (tactical.riskLevel === 'high' && reply.tone === 'spicier') confidence -= 12;

      confidence = clamp(confidence, 28, 95);
      const branch = confidence > 78 ? 'High chance they engage' : confidence > 60 ? 'Likely neutral response' : 'Could stall thread';

      acc[reply.tone] = { confidence, branch };
      return acc;
    }, {} as Record<Reply['tone'], { confidence: number; branch: string }>);
  }, [replies, tactical.healthScore, tactical.riskLevel, selectedGoal]);

  const bestOutcomeConfidence = useMemo(() => {
    return Object.values(simulatedOutcomes).reduce((max, item) => Math.max(max, item.confidence), 0);
  }, [simulatedOutcomes]);

  // ── Load Pro status + recent threads ──────────────────
  useEffect(() => {
    fetch('/api/usage').then(r => r.json()).then(d => {
      if (d.isPro) setIsPro(true);
    }).catch(() => {});
    fetchRecentThreads();

    const storedTheme = typeof window !== 'undefined' ? localStorage.getItem('x-theme') : null;
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('x-theme', theme);
    }
  }, [theme]);

  // ── Auto-save after 2+ messages ────────────────────────
  useEffect(() => {
    if (thread.length < 2) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      autoSaveThread();
    }, 1500);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [thread]);

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
    setStrategyData(null);
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
    setStrategyData(null);
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
          goal: selectedGoal,
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

      if (data.strategy && typeof data.strategy === 'object') {
        setStrategyData(data.strategy as StrategyData);
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

  // ── Fetch recent threads ────────────────────────────────
  const fetchRecentThreads = async () => {
    try {
      const res = await fetch('/api/threads');
      if (res.ok) {
        const data = await res.json();
        setSavedThreads(data.threads || []);
      }
    } catch {}
  };

  // ── Auto-save thread to DB ──────────────────────────────
  const autoSaveThread = async () => {
    if (thread.length < 2) return;
    setSaving(true);
    try {
      const firstThem = thread.find(m => m.role === 'them');
      const autoName = activeThreadName || (firstThem ? firstThem.text.slice(0, 40) + (firstThem.text.length > 40 ? '...' : '') : 'Conversation');

      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeThreadId || undefined,
          name: autoName,
          messages: thread.map(m => ({ role: m.role, text: m.text, timestamp: new Date(m.timestamp).toISOString() })),
          context: selectedContext,
        }),
      });
      const data = await res.json();
      if (data.thread) {
        if (!activeThreadId) {
          setActiveThreadId(data.thread.id);
          setActiveThreadName(autoName);
        }
        fetchRecentThreads();
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  // ── Load a saved thread ─────────────────────────────────
  const handleLoadThread = async (saved: SavedThread) => {
    try {
      const res = await fetch(`/api/threads?id=${saved.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const fullThread = data.thread;

      if (!fullThread?.messages) throw new Error();

      // Reconstruct structured ThreadMessage array
      const messages: ThreadMessage[] = (fullThread.messages as any[]).map((m: any) => ({
        role: m.role === 'you' ? 'you' as const : 'them' as const,
        text: m.text || '',
        timestamp: m.timestamp ? new Date(m.timestamp).getTime() : Date.now(),
      }));

      setThread(messages);
      setActiveThreadId(saved.id);
      setActiveThreadName(saved.name);
      if (saved.context) setSelectedContext(saved.context);
      setReplies([]);
      setStrategyData(null);
      setDecodeResult(null);
      setPendingSent(null);
      setInput('');
      setShowRecent(false);
      toast({ title: 'Thread loaded', description: saved.name });
    } catch {
      toast({ title: 'Failed to load thread', variant: 'destructive' });
    }
  };

  // ── Delete a thread ─────────────────────────────────────
  const handleDeleteThread = async (id: string) => {
    try {
      await fetch(`/api/threads?id=${id}`, { method: 'DELETE' });
      setSavedThreads(prev => prev.filter(t => t.id !== id));
      if (activeThreadId === id) {
        setActiveThreadId(null);
        setActiveThreadName(null);
      }
      toast({ title: 'Thread deleted' });
    } catch {}
  };

  // ── Start new thread ────────────────────────────────────
  const handleNewThread = () => {
    setThread([]);
    setReplies([]);
    setStrategyData(null);
    setInput('');
    setDecodeResult(null);
    setPendingSent(null);
    setActiveThreadId(null);
    setActiveThreadName(null);
    setShowRecent(false);
  };

  // ── Reset thread ───────────────────────────────────────
  const handleReset = () => {
    setThread([]);
    setReplies([]);
    setStrategyData(null);
    setInput('');
    setDecodeResult(null);
    setPendingSent(null);
    setActiveThreadId(null);
    setActiveThreadName(null);
    toast({ title: 'Thread cleared', description: 'Starting fresh' });
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <div className={`min-h-screen relative overflow-hidden ${isLight ? 'x-v4-light' : 'x-v4-dark'} ${isLight ? 'bg-[#eef4ff]' : 'bg-black'}`}>
      {/* Ambient background mesh */}
      <div className="fixed inset-0 pointer-events-none hidden md:block">
        <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] ${isLight ? 'bg-blue-400/25' : 'bg-violet-600/8'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] ${isLight ? 'bg-cyan-300/25' : 'bg-fuchsia-600/8'}`} />
        <div className={`absolute top-[40%] left-[50%] w-[40%] h-[40%] rounded-full blur-[100px] ${isLight ? 'bg-violet-300/20' : 'bg-cyan-600/5'}`} />
      </div>
      <div className="fixed inset-0 pointer-events-none md:hidden">
        <div className={`absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full blur-[80px] ${isLight ? 'bg-blue-400/30' : 'bg-violet-600/6'}`} />
        <div className={`absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full blur-[80px] ${isLight ? 'bg-cyan-300/30' : 'bg-fuchsia-600/6'}`} />
      </div>

      <div className="relative z-10 mx-auto px-5 py-6 pb-10 w-full max-w-lg md:max-w-2xl">

        {/* ══════════ HEADER ══════════ */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="w-10 h-10 rounded-2xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center hover:bg-white/15 transition-all active:scale-90">
            <ArrowLeft className="h-5 w-5 text-white/70" />
          </Link>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg ${isLight ? 'from-blue-500 to-cyan-500 shadow-blue-500/25' : 'from-violet-500 to-fuchsia-500 shadow-violet-500/25'}`}>
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-base tracking-tight leading-none">wingman v4</h1>
              <p className="text-white/50 text-[11px] font-medium tracking-widest uppercase">x-lab thread engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-2xl bg-white/[0.08] border border-white/[0.12] flex items-center gap-1">
              <button
                onClick={() => setTheme('dark')}
                className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${!isLight ? 'bg-violet-500 text-white shadow-md shadow-violet-500/30' : 'text-white/50 hover:text-white/80'}`}
                aria-label="Use dark theme"
              >
                <Moon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${isLight ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30' : 'text-white/50 hover:text-white/80'}`}
                aria-label="Use light theme"
              >
                <Sun className="h-4 w-4" />
              </button>
            </div>
            <button onClick={handleReset} className="w-10 h-10 rounded-2xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center hover:bg-white/15 transition-all active:scale-90">
              <RotateCcw className="h-4 w-4 text-white/60" />
            </button>
          </div>
        </div>

        {/* ══════════ V4 COMMAND CENTER ══════════ */}
        <div className="mb-5 rounded-[28px] bg-white/[0.05] border border-white/[0.10] p-4 backdrop-blur-sm shadow-[0_20px_60px_-30px_rgba(14,165,233,0.35)]">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.22em]">Command center</p>
              <h2 className="text-white text-sm font-extrabold tracking-tight mt-1">Future-grade thread intelligence + instant tactical reads</h2>
            </div>
            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${isPro ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-violet-500/15 text-violet-300 border-violet-500/25'}`}>
              {isPro ? 'PRO · V2 VERIFIED' : 'FREE · V1'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3">
              <p className="text-white/35 text-[9px] font-bold uppercase tracking-wider">Mode</p>
              <p className="text-white/85 text-xs font-semibold mt-1">{thread.length > 0 ? 'Live thread' : 'Ready'}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3">
              <p className="text-white/35 text-[9px] font-bold uppercase tracking-wider">Momentum</p>
              <p className="text-white/85 text-xs font-semibold mt-1 flex items-center gap-1.5">
                {tactical.momentum === 'theirs' ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> : tactical.momentum === 'yours' ? <TrendingDown className="h-3.5 w-3.5 text-rose-400" /> : <Gauge className="h-3.5 w-3.5 text-amber-400" />}
                {tactical.momentum === 'theirs' ? 'Theirs' : tactical.momentum === 'yours' ? 'Yours' : 'Balanced'}
              </p>
            </div>
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3">
              <p className="text-white/35 text-[9px] font-bold uppercase tracking-wider">Health</p>
              <p className="text-white/85 text-xs font-semibold mt-1">{tactical.healthScore}/100</p>
            </div>
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3">
              <p className="text-white/35 text-[9px] font-bold uppercase tracking-wider">Risk</p>
              <p className={`text-xs font-semibold mt-1 ${tactical.riskLevel === 'high' ? 'text-rose-400' : tactical.riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {tactical.riskLevel.toUpperCase()} · {tactical.riskScore}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-wide">
              <Clock className="h-3 w-3" /> wait window {tactical.waitWindow}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/20 text-[10px] font-bold uppercase tracking-wide">
              <Target className="h-3 w-3" /> goal {GOAL_OPTIONS.find(g => g.value === selectedGoal)?.label || 'Reignite Spark'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.05] text-white/50 border border-white/[0.10] text-[10px] font-bold uppercase tracking-wide">
              <Wand2 className="h-3 w-3" /> theme {isLight ? 'Light' : 'Dark'}
            </span>
          </div>
        </div>

        {/* ══════════ TOP BAR: Recent / New / Active ══════════ */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => setShowRecent(!showRecent)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
              showRecent
                ? 'bg-violet-500/25 text-violet-300 border border-violet-500/30'
                : 'bg-white/[0.08] text-white/60 border border-white/[0.12] hover:bg-white/[0.14] hover:text-white/80'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Recent{savedThreads.length > 0 ? ` (${savedThreads.length})` : ''}
          </button>
          <button
            onClick={handleNewThread}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/[0.08] border border-white/[0.12] text-white/60 hover:bg-white/[0.14] hover:text-white/80 text-xs font-bold transition-all active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </button>
          {activeThreadName && (
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 min-w-0">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
              <span className="text-violet-300 text-xs font-semibold truncate">{activeThreadName}</span>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 ml-auto text-violet-400" />}
            </div>
          )}
          {!activeThreadName && saving && (
            <div className="flex items-center gap-1.5 px-3 py-2.5 text-violet-400 text-[11px] font-medium">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" /> syncing
            </div>
          )}
        </div>

        {/* ══════════ RECENT DRAWER ══════════ */}
        {showRecent && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="rounded-3xl bg-white/[0.04] border border-white/[0.08] p-4 space-y-2">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-white/50 text-[11px] font-bold uppercase tracking-widest">Conversations</span>
                <button onClick={() => setShowRecent(false)} className="text-white/20 hover:text-white/50 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {savedThreads.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 mx-auto rounded-2xl bg-white/[0.05] flex items-center justify-center mb-3">
                    <MessageCircle className="h-5 w-5 text-white/20" />
                  </div>
                  <p className="text-white/25 text-xs">Start a thread and it&apos;ll appear here</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {savedThreads.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleLoadThread(t)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group text-left active:scale-[0.98] ${
                        activeThreadId === t.id
                          ? 'bg-violet-500/15 border border-violet-500/20'
                          : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.05] hover:border-white/[0.06]'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        activeThreadId === t.id ? 'bg-violet-500/20' : 'bg-white/[0.05]'
                      }`}>
                        <MessageCircle className={`h-3.5 w-3.5 ${activeThreadId === t.id ? 'text-violet-400' : 'text-white/30'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm font-semibold truncate">{t.name}</p>
                        <p className="text-white/25 text-[10px] mt-0.5">
                          {t.message_count} msgs · {new Date(t.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteThread(t.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ CONTEXT SELECTOR ══════════ */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {CONTEXT_OPTIONS.map(ctx => (
            <button
              key={ctx.value}
              onClick={() => setSelectedContext(ctx.value)}
              className={`px-5 py-2.5 rounded-2xl text-[13px] font-semibold transition-all active:scale-95 ${
                selectedContext === ctx.value
                  ? 'bg-white/[0.16] text-white border border-white/[0.22] shadow-lg shadow-white/5'
                  : 'bg-white/[0.07] text-white/60 border border-white/[0.12] hover:bg-white/[0.12] hover:text-white/80'
              }`}
            >
              <span className="mr-1.5">{ctx.emoji}</span>{ctx.label}
            </button>
          ))}
        </div>

        {/* ══════════ GOAL SELECTOR ══════════ */}
        <div className="flex flex-wrap gap-2 mb-5 justify-center">
          {GOAL_OPTIONS.map(goal => (
            <button
              key={goal.value}
              onClick={() => setSelectedGoal(goal.value)}
              className={`px-4 py-2 rounded-2xl text-[12px] font-semibold transition-all active:scale-95 ${
                selectedGoal === goal.value
                  ? 'bg-violet-500/20 text-violet-200 border border-violet-400/35 shadow-lg shadow-violet-500/15'
                  : 'bg-white/[0.06] text-white/55 border border-white/[0.10] hover:bg-white/[0.10] hover:text-white/80'
              }`}
            >
              <span className="mr-1.5">{goal.emoji}</span>{goal.label}
            </button>
          ))}
        </div>

        {/* ══════════ TACTICAL INTELLIGENCE BAR ══════════ */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3">
            <p className="text-white/35 text-[9px] font-bold uppercase tracking-wider mb-1.5">Reciprocity</p>
            <p className="text-white/85 text-sm font-semibold">{tactical.reciprocity}% balanced</p>
            <p className="text-white/45 text-[11px] mt-1">Them {tactical.themCount} • You {tactical.youCount}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3">
            <p className="text-white/35 text-[9px] font-bold uppercase tracking-wider mb-1.5">Timing Guidance</p>
            <p className="text-cyan-300 text-sm font-semibold">Wait {tactical.waitWindow}</p>
            <p className="text-white/45 text-[11px] mt-1">Reduces chase pressure & keeps frame</p>
          </div>
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3">
            <p className="text-white/35 text-[9px] font-bold uppercase tracking-wider mb-1.5">Guardrail</p>
            <p className={`text-sm font-semibold ${tactical.riskLevel === 'high' ? 'text-rose-400' : tactical.riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {tactical.riskLevel === 'high' ? 'Do not double-text' : tactical.riskLevel === 'medium' ? 'Keep it short + no pressure' : 'Safe to advance'}
            </p>
            <p className="text-white/45 text-[11px] mt-1">Risk score {tactical.riskScore}/100</p>
          </div>
        </div>

        {/* ══════════ STRATEGY INSIGHT ══════════ */}
        {strategyData && (
          <div className="mb-4 rounded-3xl bg-emerald-500/[0.08] border border-emerald-500/20 p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-emerald-300 text-[10px] font-bold uppercase tracking-widest">
                <Target className="h-3.5 w-3.5" /> Strategy pulse
              </span>
              <span className="text-[10px] font-bold text-emerald-300/70 bg-emerald-500/15 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                {strategyData.move.energy}
              </span>
            </div>
            <p className="text-white/90 text-sm font-semibold">“{strategyData.move.one_liner}”</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/[0.08] text-white/60">Momentum: {strategyData.momentum}</span>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/[0.08] text-white/60">Balance: {strategyData.balance}</span>
              {strategyData.move.constraints.keep_short && <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/[0.08] text-white/60">keep short</span>}
              {strategyData.move.constraints.no_questions && <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/[0.08] text-white/60">no questions</span>}
              {strategyData.move.constraints.add_tease && <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/[0.08] text-white/60">add tease</span>}
              {strategyData.move.constraints.push_meetup && <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/[0.08] text-white/60">push meetup</span>}
            </div>
          </div>
        )}

        {/* ══════════ POWER PULSE ══════════ */}
        {thread.length > 0 && (
          <Suspense fallback={null}>
            <PowerPulse
              momentum={tactical.momentum as 'theirs' | 'yours' | 'balanced'}
              healthScore={tactical.healthScore}
              riskScore={tactical.riskScore}
              themCount={tactical.themCount}
              youCount={tactical.youCount}
              threadLength={thread.length}
              strategyMomentum={strategyData?.momentum}
              strategyEnergy={strategyData?.move?.energy}
              isLight={isLight}
            />
          </Suspense>
        )}

        {/* ══════════ THREAD VIEW ══════════ */}
        {thread.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowThread(!showThread)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-t-3xl bg-white/[0.04] border border-white/[0.08] border-b-0 transition-colors hover:bg-white/[0.06]"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <MessageCircle className="h-3 w-3 text-violet-400" />
                </div>
                <span className="text-white/60 text-xs font-bold">
                  {thread.length} message{thread.length !== 1 ? 's' : ''}
                </span>
              </div>
              {showThread ? <ChevronUp className="h-3.5 w-3.5 text-white/25" /> : <ChevronDown className="h-3.5 w-3.5 text-white/25" />}
            </button>

            {showThread && (
              <div className="rounded-b-3xl bg-white/[0.03] border border-white/[0.08] border-t-0 p-4 max-h-72 overflow-y-auto">
                <div className="space-y-2.5">
                  {thread.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'you' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-2.5 text-[13px] leading-relaxed ${
                        msg.role === 'them'
                          ? 'bg-white/[0.07] text-white/80 rounded-2xl rounded-bl-lg border border-white/[0.06]'
                          : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl rounded-br-lg shadow-lg shadow-violet-500/10'
                      }`}>
                        <p className="font-medium">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={threadEndRef} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ "I SENT THIS" CONFIRMATION ══════════ */}
        {pendingSent && (
          <div className="mb-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-widest">Confirm send</span>
              </div>
              <p className="text-white/80 text-sm font-medium leading-relaxed pl-4 border-l-2 border-emerald-500/30">
                {pendingSent.text}
              </p>
              <div className="rounded-2xl bg-black/20 border border-white/[0.08] px-3 py-2">
                <p className="text-[11px] text-white/60 font-medium">
                  Timing tip: wait <span className="text-cyan-300 font-bold">{tactical.waitWindow}</span> before your next follow-up if they go quiet.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMarkSent(pendingSent)}
                  className="flex-1 h-10 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  <Check className="h-3.5 w-3.5" /> I sent this
                </button>
                <button
                  onClick={() => setPendingSent(null)}
                  className="h-10 px-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white/60 font-bold text-xs transition-all active:scale-95"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ INPUT AREA ══════════ */}
        <div className="mb-5">
          <div className="rounded-2xl bg-white/[0.06] border border-white/[0.12] p-4 focus-within:border-violet-500/30 transition-colors">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={thread.length === 0 ? 'What did they say...' : 'Their reply...'}
              className="w-full min-h-[100px] bg-transparent text-white placeholder-white/50 resize-none focus:outline-none text-base font-medium leading-relaxed"
              maxLength={2000}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
              }}
            />

            {/* Screenshot preview */}
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleScreenshot} className="hidden" />
            {screenshotPreview && (
              <div className="mt-3 relative rounded-xl overflow-hidden border border-white/10">
                <img src={screenshotPreview} alt="Screenshot" className="w-full max-h-32 object-cover opacity-70" />
                {extracting && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2.5 mt-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-xl bg-white/[0.08] border border-white/[0.14] flex items-center justify-center hover:bg-white/[0.14] transition-all active:scale-90 text-white/60 hover:text-white/80"
            >
              <Camera className="h-5 w-5" />
            </button>
            <button
              onClick={handleDecode}
              disabled={decoding || (!input.trim() && thread.length === 0)}
              className="w-12 h-12 rounded-xl bg-amber-500/25 border border-amber-400/35 flex items-center justify-center hover:bg-amber-500/35 transition-all active:scale-90 disabled:opacity-25 text-amber-300 shadow-md shadow-amber-500/15"
            >
              {decoding ? <Loader2 className="h-5 w-5 animate-spin" /> : <Brain className="h-5 w-5" />}
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || !input.trim()}
              className={`flex-1 h-12 rounded-xl font-extrabold text-[15px] flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] disabled:opacity-25 ${
                isPro
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black shadow-lg shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 text-white shadow-xl shadow-violet-600/50'
              }`}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>{isPro ? <Shield className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />} {thread.length === 0 ? 'Generate' : 'Reply'}</>
              )}
            </button>
          </div>
        </div>

        {/* ══════════ DECODE RESULTS ══════════ */}
        {decodeResult && (
          <div className="mb-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-3xl bg-white/[0.04] border border-amber-500/15 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/15 flex items-center justify-center">
                    <Brain className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <span className="text-white/60 text-[11px] font-bold uppercase tracking-widest">decoded</span>
                </div>
                <button onClick={() => setDecodeResult(null)} className="w-7 h-7 rounded-xl bg-white/[0.05] flex items-center justify-center hover:bg-white/10 transition-all">
                  <X className="h-3 w-3 text-white/30" />
                </button>
              </div>

              <div className="inline-flex">
                <span className={`px-3 py-1.5 rounded-xl text-[11px] font-bold ${
                  (ENERGY_CONFIG[decodeResult.energy] || ENERGY_CONFIG.neutral).bg.replace('bg-', 'bg-').replace('-100', '-500/15')
                } ${(ENERGY_CONFIG[decodeResult.energy] || ENERGY_CONFIG.neutral).color.replace('text-', 'text-').replace('-700', '-400')} border border-white/[0.06]`}>
                  {(ENERGY_CONFIG[decodeResult.energy] || ENERGY_CONFIG.neutral).emoji} {decodeResult.energy.replace('-', ' ')}
                </span>
              </div>

              <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-4">
                <p className="text-amber-400/60 text-[10px] font-bold uppercase tracking-widest mb-1.5">what they mean</p>
                <p className="text-white/80 text-sm font-medium leading-relaxed">{decodeResult.intent}</p>
              </div>

              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1.5">between the lines</p>
                <p className="text-white/60 text-xs leading-relaxed">{decodeResult.subtext}</p>
              </div>

              {decodeResult.flags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {decodeResult.flags.map((flag, i) => (
                    <span key={i} className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                      flag.type === 'green' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      flag.type === 'red' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {flag.text}
                    </span>
                  ))}
                </div>
              )}

              <div className="rounded-2xl bg-violet-500/5 border border-violet-500/10 p-4">
                <p className="text-violet-400/60 text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> coach tip
                </p>
                <p className="text-white/70 text-xs font-medium leading-relaxed">{decodeResult.coach_tip}</p>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ REPLY CARDS — modern ══════════ */}
        {replies.length > 0 && (
          <div className="animate-in fade-in duration-400">
            <p className="text-white/35 text-xs font-bold uppercase tracking-[0.15em] mb-3">Pick your reply</p>
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
              {replies.map((reply, idx) => {
                const config = TONE_CONFIG[reply.tone];
                const isCopied = copied === reply.tone;
                const outcome = simulatedOutcomes[reply.tone];
                const isBest = !!outcome && outcome.confidence === bestOutcomeConfidence;
                return (
                  <button
                    key={reply.tone}
                    onClick={() => handleCopy(reply)}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    className={`animate-in fade-in slide-in-from-bottom-2 w-full text-left group relative transition-all duration-200 active:scale-[0.99] ${
                      isCopied
                        ? 'bg-emerald-500/[0.08]'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex gap-4 px-5 py-5">
                      <div className={`w-1 shrink-0 self-stretch rounded-full bg-gradient-to-b ${config.gradient} ${
                        isCopied ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                      } transition-opacity`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <span className="text-[13px] font-bold text-white/60">{config.emoji} {config.label}</span>
                          <span className="text-white/25 text-[11px]">{reply.text.split(' ').length}w</span>
                          {outcome && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${outcome.confidence >= 75 ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : outcome.confidence >= 60 ? 'text-amber-300 bg-amber-500/10 border-amber-500/20' : 'text-rose-300 bg-rose-500/10 border-rose-500/20'}`}>
                              {outcome.confidence}%
                            </span>
                          )}
                          {isBest && (
                            <span className="text-[10px] font-black text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                              BEST BRANCH
                            </span>
                          )}
                          {isPro && (
                            <span className="text-[10px] font-bold text-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 rounded">
                              v2
                            </span>
                          )}
                          <span className={`ml-auto text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                            isCopied ? 'text-emerald-400' : 'text-white/0 group-hover:text-white/40'
                          }`}>
                            {isCopied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                          </span>
                        </div>
                        <p className="text-white/90 text-[15px] font-medium leading-relaxed">{reply.text}</p>
                        {outcome && (
                          <p className="mt-2 text-[11px] text-white/45 font-medium">{outcome.branch}</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════ EMPTY STATE — inline ══════════ */}
        {thread.length === 0 && replies.length === 0 && !decodeResult && (
          <div className="text-center pt-10 pb-6 space-y-4">
            <p className="text-white/40 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
              Paste what they said, set your goal, get strategy-shaped replies, then run the thread like a tactician.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs font-bold text-white/25">
              <span>them</span>
              <span>→</span>
              <span className="text-violet-400/40">you</span>
              <span>→</span>
              <span>them</span>
              <span>→</span>
              <span className="text-fuchsia-400/40">repeat</span>
            </div>
          </div>
        )}

      </div>

      {/* /x-only theme overrides for rapid dark/light experimentation */}
      <style jsx global>{`
        .x-v4-light {
          color-scheme: light;
          color: #0f172a;
        }

        .x-v4-light [class*='text-white'] {
          color: rgba(15, 23, 42, 0.92) !important;
        }

        .x-v4-light [class*='placeholder-white'] {
          color: rgba(30, 41, 59, 0.45) !important;
        }

        .x-v4-light [class*='text-violet-300'] {
          color: rgba(67, 56, 202, 0.92) !important;
        }

        .x-v4-light [class*='text-violet-400'] {
          color: rgba(79, 70, 229, 0.95) !important;
        }

        .x-v4-light [class*='text-emerald-400'] {
          color: rgba(5, 150, 105, 0.95) !important;
        }

        .x-v4-light [class*='bg-white/[0.0'],
        .x-v4-light [class*='bg-white/[0.1'],
        .x-v4-light [class*='bg-white/[0.2'] {
          background-color: rgba(255, 255, 255, 0.62) !important;
          backdrop-filter: blur(12px);
        }

        .x-v4-light [class*='border-white'] {
          border-color: rgba(148, 163, 184, 0.34) !important;
        }

        .x-v4-light [class*='bg-black/20'] {
          background-color: rgba(15, 23, 42, 0.08) !important;
        }

        .x-v4-light [class*='from-violet-600'][class*='to-fuchsia-600'] {
          box-shadow: 0 14px 34px rgba(79, 70, 229, 0.22);
        }

        .x-v4-light [class*='from-emerald-500'][class*='to-cyan-500'] {
          box-shadow: 0 14px 34px rgba(6, 182, 212, 0.2);
        }
      `}</style>
    </div>
  );
}
