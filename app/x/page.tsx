'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Copy, Sparkles, Loader2, MessageCircle,
  Shield, Camera, X, Brain, Send, ChevronUp,
  RotateCcw, Trash2, Check, Clock, Plus, Sun, Moon, Target, Gauge, TrendingUp, TrendingDown,
  Activity, PanelRightOpen, PanelRightClose, Crosshair, Radio,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────
type Reply = { tone: 'shorter' | 'spicier' | 'softer'; text: string };
type ThreadMessage = { role: 'them' | 'you'; text: string; timestamp: number };
type CoachMessage = {
  role: 'user' | 'coach';
  content: string;
  replies?: { shorter?: string; spicier?: string; softer?: string } | null;
  strategy?: { momentum?: string; balance?: string; one_liner?: string; energy?: string; no_questions?: boolean; keep_short?: boolean } | null;
};
type SavedThread = { id: string; name: string; context: string | null; updated_at: string; message_count: number; last_message: { role: string; text: string } | null };
type DecodeResult = { intent: string; subtext: string; energy: string; flags: { type: 'green' | 'red' | 'yellow'; text: string }[]; coach_tip: string } | null;
type StrategyData = { momentum: string; balance: string; move: { energy: string; one_liner: string; constraints: { no_questions: boolean; keep_short: boolean; add_tease: boolean; push_meetup: boolean }; risk: string }; latencyMs?: number } | null;

// ── Constants ──────────────────────────────────────────────
const TONE_CONFIG: Record<string, { label: string; gradient: string; glow: string; emoji: string; neon: string }> = {
  shorter: { label: 'QUICK', gradient: 'from-cyan-400 to-blue-500', glow: '0 0 20px rgba(34,211,238,0.4), 0 0 60px rgba(34,211,238,0.1)', emoji: '\u26A1', neon: 'cyan' },
  spicier: { label: 'SPICY', gradient: 'from-rose-400 to-pink-500', glow: '0 0 20px rgba(251,113,133,0.4), 0 0 60px rgba(251,113,133,0.1)', emoji: '\uD83D\uDD25', neon: 'rose' },
  softer:  { label: 'SOFT',  gradient: 'from-emerald-400 to-green-500', glow: '0 0 20px rgba(52,211,153,0.4), 0 0 60px rgba(52,211,153,0.1)', emoji: '\uD83D\uDC9A', neon: 'emerald' },
};

const CONTEXT_OPTIONS = [
  { value: 'crush', label: 'Crush', emoji: '\uD83D\uDC95' },
  { value: 'friend', label: 'Friend', emoji: '\uD83E\uDD1D' },
  { value: 'work', label: 'Work', emoji: '\uD83D\uDCBC' },
  { value: 'ex', label: 'Ex', emoji: '\uD83D\uDC94' },
  { value: 'family', label: 'Family', emoji: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67' },
  { value: 'new-match', label: 'Match', emoji: '\uD83D\uDC98' },
];

const GOAL_OPTIONS = [
  { value: 'reignite', label: 'Reignite', emoji: '\u2728' },
  { value: 'meetup', label: 'Plans', emoji: '\uD83D\uDCCD' },
  { value: 'defuse', label: 'Defuse', emoji: '\uD83D\uDD4A\uFE0F' },
  { value: 'clarify', label: 'Clarity', emoji: '\uD83E\uDDED' },
  { value: 'keep-light', label: 'Light', emoji: '\uD83C\uDF88' },
];

const ENERGY_CONFIG: Record<string, { emoji: string }> = {
  interested: { emoji: '\uD83D\uDC9A' }, testing: { emoji: '\uD83E\uDDEA' }, neutral: { emoji: '\uD83D\uDE10' },
  'pulling-away': { emoji: '\uD83D\uDEAA' }, flirty: { emoji: '\uD83D\uDE0F' }, confrontational: { emoji: '\u2694\uFE0F' },
  anxious: { emoji: '\uD83D\uDE30' }, playful: { emoji: '\uD83D\uDE04' }, cold: { emoji: '\uD83E\uDDCA' }, warm: { emoji: '\u2600\uFE0F' },
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// ── Glass panel component ──────────────────────────────────
function Glass({ children, className = '', glow = false, neonColor = 'violet' }: { children: React.ReactNode; className?: string; glow?: boolean; neonColor?: string }) {
  const glowMap: Record<string, string> = {
    violet: '0 0 30px rgba(139,92,246,0.35), 0 0 60px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
    cyan: '0 0 30px rgba(34,211,238,0.35), 0 0 60px rgba(34,211,238,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
    emerald: '0 0 30px rgba(52,211,153,0.35), 0 0 60px rgba(52,211,153,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
    rose: '0 0 30px rgba(251,113,133,0.35), 0 0 60px rgba(251,113,133,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
    amber: '0 0 30px rgba(251,191,36,0.3), 0 0 60px rgba(251,191,36,0.08), inset 0 1px 0 rgba(255,255,255,0.08)',
  };
  return (
    <div
      className={`relative rounded-2xl border border-white/[0.12] backdrop-blur-2xl ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
        boxShadow: glow ? glowMap[neonColor] || glowMap.violet : '0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {children}
    </div>
  );
}

export default function ExperimentalThreadPage() {
  // ── State ──────────────────────────────────────────────
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [input, setInput] = useState('');
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<string>('crush');
  const [selectedGoal, setSelectedGoal] = useState<string>('reignite');
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
  const [intelOpen, setIntelOpen] = useState(true);
  const [mobileSheet, setMobileSheet] = useState(false);
  const [decodingIdx, setDecodingIdx] = useState<number | null>(null);
  const [inlineDecodes, setInlineDecodes] = useState<Record<number, DecodeResult>>({});
  const [xMode, setXMode] = useState<'thread' | 'coach'>('coach');
  const [coachHistory, setCoachHistory] = useState<CoachMessage[]>([]);
  const [coachInput, setCoachInput] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachExtracting, setCoachExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coachFileInputRef = useRef<HTMLInputElement>(null);
  const coachEndRef = useRef<HTMLDivElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const isLight = theme === 'light';

  // ── Tactical computed ─────────────────────────────────
  const tactical = useMemo(() => {
    const themCount = thread.filter(m => m.role === 'them').length;
    const youCount = thread.filter(m => m.role === 'you').length;
    const recentSlice = thread.slice(-4);
    const recentThem = recentSlice.filter(m => m.role === 'them').length;
    const recentYou = recentSlice.filter(m => m.role === 'you').length;
    const momentum = recentThem > recentYou ? 'theirs' : recentYou > recentThem ? 'yours' : 'balanced';
    const reciprocity = Math.round((Math.min(themCount, youCount) / Math.max(themCount, youCount, 1)) * 100);
    const chasePenalty = youCount > themCount ? Math.min((youCount - themCount) * 9, 24) : 0;
    const questionPenalty = (input.match(/\?/g)?.length ?? 0) * 6;
    const longPenalty = input.trim().length > 180 ? 12 : 0;
    const healthScore = clamp(68 + Math.round(reciprocity * 0.22) + (momentum === 'balanced' ? 8 : 0) - chasePenalty, 24, 96);
    const riskScore = clamp(30 + chasePenalty + questionPenalty + longPenalty + (momentum === 'yours' ? 8 : 0), 8, 95);
    const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 46 ? 'medium' : 'low';
    const waitWindow = riskLevel === 'high' ? '45\u201390 min' : riskLevel === 'medium' ? '20\u201345 min' : '10\u201320 min';
    return { themCount, youCount, momentum, reciprocity, healthScore, riskScore, riskLevel, waitWindow };
  }, [thread, input]);

  const simulatedOutcomes = useMemo(() => {
    return replies.reduce((acc, reply) => {
      let c = tactical.healthScore - 12;
      if (reply.tone === 'shorter') c += 6;
      if (reply.tone === 'spicier') c += selectedGoal === 'meetup' || selectedGoal === 'reignite' ? 8 : -2;
      if (reply.tone === 'softer') c += selectedGoal === 'defuse' ? 10 : 2;
      if (tactical.riskLevel === 'high' && reply.tone === 'spicier') c -= 12;
      c = clamp(c, 28, 95);
      acc[reply.tone] = { confidence: c, branch: c > 78 ? 'High chance they engage' : c > 60 ? 'Likely neutral response' : 'Could stall thread' };
      return acc;
    }, {} as Record<string, { confidence: number; branch: string }>);
  }, [replies, tactical.healthScore, tactical.riskLevel, selectedGoal]);

  const bestOutcome = useMemo(() => Object.values(simulatedOutcomes).reduce((max, i) => Math.max(max, i.confidence), 0), [simulatedOutcomes]);

  // ── Effects ───────────────────────────────────────────
  useEffect(() => {
    fetch('/api/usage').then(r => r.json()).then(d => { if (d.isPro) setIsPro(true); }).catch(() => {});
    fetchRecentThreads();
    const t = typeof window !== 'undefined' ? localStorage.getItem('x-theme') : null;
    if (t === 'light' || t === 'dark') setTheme(t);
  }, []);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('x-theme', theme); }, [theme]);
  useEffect(() => {
    if (thread.length < 2) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => autoSaveThread(), 1500);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [thread]);
  useEffect(() => { threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread]);

  // ── Handlers ──────────────────────────────────────────
  const buildThreadContext = (extra?: string) => { const l = thread.map(m => `${m.role === 'them' ? 'Them' : 'You'}: ${m.text}`); if (extra) l.push(`Them: ${extra}`); return l.join('\n'); };
  const addToThread = (role: 'them' | 'you', text: string) => setThread(prev => [...prev, { role, text, timestamp: Date.now() }]);

  const handleMarkSent = (reply: Reply) => { addToThread('you', reply.text); setPendingSent(null); setReplies([]); setStrategyData(null); setDecodeResult(null); setInput(''); toast({ title: '\u2713 Marked as sent', description: 'Paste their next reply to keep going' }); };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    addToThread('them', input.trim());
    setLoading(true); setReplies([]); setStrategyData(null); setDecodeResult(null); setPendingSent(null);
    try {
      const res = await fetch(isPro ? '/api/generate-v2' : '/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: buildThreadContext(input.trim()), context: selectedContext, goal: selectedGoal }) });
      const data = await res.json();
      if (!res.ok) { if (res.status === 429) toast({ title: '\uD83D\uDD12 Limit reached', description: 'Upgrade to Pro', variant: 'destructive' }); else throw new Error(data.error || 'Failed'); return; }
      if (isPro && data.shorter && data.spicier && data.softer) setReplies([{ tone: 'shorter', text: data.shorter }, { tone: 'spicier', text: data.spicier }, { tone: 'softer', text: data.softer }]);
      else if (Array.isArray(data.replies)) setReplies(data.replies.filter((r: any) => r?.tone && r?.text));
      if (data.strategy && typeof data.strategy === 'object') setStrategyData(data.strategy as StrategyData);
      setInput('');
    } catch (err) { toast({ title: 'Failed', description: err instanceof Error ? err.message : 'Try again', variant: 'destructive' }); } finally { setLoading(false); }
  };

  const handleCopy = async (reply: Reply) => { await navigator.clipboard.writeText(reply.text); setCopied(reply.tone); setPendingSent(reply); toast({ title: '\u2713 Copied!' }); setTimeout(() => setCopied(null), 3000); };

  const handleDecode = async () => {
    const lastThem = [...thread].reverse().find(m => m.role === 'them');
    const text = input.trim() || lastThem?.text;
    if (!text) { toast({ title: 'Nothing to decode', variant: 'destructive' }); return; }
    setDecoding(true); setDecodeResult(null);
    try {
      const ctx = thread.length > 0 ? buildThreadContext(input.trim() || undefined) : text;
      const res = await fetch('/api/decode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: ctx, context: selectedContext }) });
      const data = await res.json();
      if (res.status === 429) { toast({ title: '\uD83D\uDD12 Limit', variant: 'destructive' }); return; }
      if (data.error && !data.intent) { toast({ title: 'Decode failed', variant: 'destructive' }); return; }
      setDecodeResult(data);
    } catch { toast({ title: 'Decode failed', variant: 'destructive' }); } finally { setDecoding(false); }
  };

  const handleInlineDecode = useCallback(async (idx: number) => {
    if (decodingIdx !== null) return;
    const msg = thread[idx]; if (!msg || msg.role !== 'them') return;
    if (inlineDecodes[idx]) { setInlineDecodes(prev => { const n = { ...prev }; delete n[idx]; return n; }); return; }
    setDecodingIdx(idx);
    try {
      const ctx = thread.slice(0, idx + 1).map(m => `${m.role === 'them' ? 'Them' : 'You'}: ${m.text}`).join('\n');
      const res = await fetch('/api/decode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: ctx, context: selectedContext }) });
      const data = await res.json();
      if (data.intent) setInlineDecodes(prev => ({ ...prev, [idx]: data }));
    } catch {} finally { setDecodingIdx(null); }
  }, [thread, decodingIdx, inlineDecodes, selectedContext]);

  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setScreenshotPreview(URL.createObjectURL(file)); setExtracting(true);
    try { const fd = new FormData(); fd.append('image', file); const res = await fetch('/api/extract-screenshot', { method: 'POST', body: fd }); const data = await res.json(); if (data.text) { setInput(data.text); toast({ title: '\uD83D\uDCF8 Extracted!' }); }
    } catch { toast({ title: 'Failed', variant: 'destructive' }); } finally { setExtracting(false); setScreenshotPreview(null); e.target.value = ''; }
  };

  const fetchRecentThreads = async () => { try { const res = await fetch('/api/threads'); if (res.ok) { const d = await res.json(); setSavedThreads(d.threads || []); } } catch {} };

  const autoSaveThread = async () => {
    if (thread.length < 2) return; setSaving(true);
    try {
      const first = thread.find(m => m.role === 'them');
      const name = activeThreadName || (first ? first.text.slice(0, 40) + (first.text.length > 40 ? '...' : '') : 'Conversation');
      const res = await fetch('/api/threads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: activeThreadId || undefined, name, messages: thread.map(m => ({ role: m.role, text: m.text, timestamp: new Date(m.timestamp).toISOString() })), context: selectedContext }) });
      const d = await res.json();
      if (d.thread) { if (!activeThreadId) { setActiveThreadId(d.thread.id); setActiveThreadName(name); } fetchRecentThreads(); }
    } catch {} finally { setSaving(false); }
  };

  const handleLoadThread = async (saved: SavedThread) => {
    try {
      const res = await fetch(`/api/threads?id=${saved.id}`); if (!res.ok) throw 0; const d = await res.json(); if (!d.thread?.messages) throw 0;
      setThread((d.thread.messages as any[]).map((m: any) => ({ role: m.role === 'you' ? 'you' as const : 'them' as const, text: m.text || '', timestamp: m.timestamp ? new Date(m.timestamp).getTime() : Date.now() })));
      setActiveThreadId(saved.id); setActiveThreadName(saved.name); if (saved.context) setSelectedContext(saved.context);
      setReplies([]); setStrategyData(null); setDecodeResult(null); setPendingSent(null); setInput(''); setShowRecent(false);
    } catch { toast({ title: 'Failed to load', variant: 'destructive' }); }
  };

  const handleDeleteThread = async (id: string) => { try { await fetch(`/api/threads?id=${id}`, { method: 'DELETE' }); setSavedThreads(prev => prev.filter(t => t.id !== id)); if (activeThreadId === id) { setActiveThreadId(null); setActiveThreadName(null); } } catch {} };
  const handleNewThread = () => { setThread([]); setReplies([]); setStrategyData(null); setInput(''); setDecodeResult(null); setPendingSent(null); setActiveThreadId(null); setActiveThreadName(null); setShowRecent(false); };
  const handleReset = () => { setThread([]); setReplies([]); setStrategyData(null); setInput(''); setDecodeResult(null); setPendingSent(null); setActiveThreadId(null); setActiveThreadName(null); toast({ title: 'Cleared' }); };

  const handleCoachSend = async (overrideMsg?: string) => {
    const msg = (overrideMsg ?? coachInput).trim();
    if (!msg || coachLoading) return;
    setCoachInput('');
    const userMsg: CoachMessage = { role: 'user', content: msg };
    const newHistory = [...coachHistory, userMsg];
    setCoachHistory(newHistory);
    setCoachLoading(true);
    setTimeout(() => coachEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatHistory: newHistory.slice(0, -1).map(m => ({ role: m.role === 'coach' ? 'assistant' : 'user', content: m.content })),
          userMessage: msg,
          context: selectedContext,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      const coachMsg: CoachMessage = { role: 'coach', content: data.reply, replies: data.replies, strategy: data.strategy };
      setCoachHistory(prev => [...prev, coachMsg]);
      setTimeout(() => coachEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {
      setCoachHistory(prev => [...prev, { role: 'coach', content: "Couldn't connect. Try again." }]);
    } finally {
      setCoachLoading(false);
    }
  };

  const handleCoachScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setCoachExtracting(true);
    try {
      const results = await Promise.all(files.map(async (file) => {
        const fd = new FormData(); fd.append('image', file);
        const res = await fetch('/api/extract-text', { method: 'POST', body: fd });
        const data = await res.json();
        return data.fullConversation || null;
      }));
      const extracted = results.filter(Boolean);
      if (extracted.length > 0) {
        const contextMsg = extracted.length === 1
          ? `Here's the conversation from a screenshot:\n${extracted[0]}`
          : `Here are ${extracted.length} screenshots:\n${extracted.map((t, i) => `[Screenshot ${i + 1}]\n${t}`).join('\n\n')}`;
        await handleCoachSend(contextMsg);
      } else {
        toast({ title: 'Could not read screenshot', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setCoachExtracting(false);
      if (coachFileInputRef.current) coachFileInputRef.current.value = '';
    }
  };

  // ── Derived visuals ───────────────────────────────────
  const pulseColor = tactical.riskLevel === 'high' ? '#f43f5e' : tactical.momentum === 'theirs' ? '#10b981' : tactical.momentum === 'yours' ? '#f59e0b' : '#8b5cf6';
  const riskNeon = tactical.riskLevel === 'high' ? 'rose' : tactical.riskLevel === 'medium' ? 'amber' : 'emerald';
  const healthPct = tactical.healthScore / 100;
  const recipPct = tactical.reciprocity / 100;

  // ══════════════════════════════════════════════════════
  //  R E N D E R
  // ══════════════════════════════════════════════════════
  return (
    <div className={`h-screen relative overflow-hidden ${isLight ? 'bg-[#f0f4ff]' : 'bg-[#030305]'}`}>

      {/* ══ ANIMATED BACKGROUND ══ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Animated gradient orbs */}
        <motion.div className="absolute w-[600px] h-[600px] rounded-full" style={{ filter: 'blur(160px)', top: '-15%', left: '-10%' }}
          animate={{ backgroundColor: [isLight ? 'rgba(99,102,241,0.25)' : 'rgba(139,92,246,0.22)', isLight ? 'rgba(34,211,238,0.25)' : 'rgba(217,70,239,0.18)', isLight ? 'rgba(99,102,241,0.25)' : 'rgba(139,92,246,0.22)'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute w-[500px] h-[500px] rounded-full" style={{ filter: 'blur(160px)', bottom: '-10%', right: '-10%' }}
          animate={{ backgroundColor: [isLight ? 'rgba(167,139,250,0.2)' : 'rgba(236,72,153,0.18)', isLight ? 'rgba(52,211,153,0.2)' : 'rgba(34,211,238,0.14)', isLight ? 'rgba(167,139,250,0.2)' : 'rgba(236,72,153,0.18)'] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Grid overlay */}
        {!isLight && (
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        )}
        {/* Scanline */}
        {!isLight && thread.length > 0 && (
          <motion.div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"
            animate={{ top: ['0%', '100%'] }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} />
        )}
      </div>

      {/* ══ MAIN SPLIT LAYOUT ══ */}
      <div className="relative z-10 h-full flex flex-col md:flex-row">

        {/* ═══════════════════════════════════════════════
            LEFT: Thread + Input
            ═══════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col h-full min-w-0">

          {/* ── NAV BAR ── */}
          <div className="shrink-0 px-4 md:px-6 py-3 flex items-center justify-between border-b border-white/[0.06]" style={{ background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.04)', backdropFilter: 'blur(40px) saturate(180%)' }}>
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="group w-9 h-9 rounded-2xl border border-white/[0.08] flex items-center justify-center transition-all hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] active:scale-90" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <ArrowLeft className="h-4 w-4 text-white/40 group-hover:text-violet-400 transition-colors" />
              </Link>
              <div className="flex items-center gap-2.5">
                <motion.div
                  animate={{ boxShadow: ['0 0 20px rgba(139,92,246,0.3)', '0 0 40px rgba(139,92,246,0.5)', '0 0 20px rgba(139,92,246,0.3)'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-8 h-8 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center"
                >
                  <Crosshair className="h-4 w-4 text-white" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-white font-black text-[15px] tracking-tight">WINGMAN</h1>
                    <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-[0.15em] bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-violet-300 border border-violet-500/20">V4</span>
                  </div>
                  <p className="text-white/25 text-[9px] font-mono tracking-[0.3em] uppercase">thread command</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Mode toggle */}
              <div className="h-8 p-0.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-0.5">
                <button onClick={() => setXMode('coach')} className={`h-7 px-3 rounded-lg text-[10px] font-black tracking-wider transition-all ${xMode === 'coach' ? 'bg-violet-500/80 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]' : 'text-white/25 hover:text-white/50'}`}>COACH</button>
                <button onClick={() => setXMode('thread')} className={`h-7 px-3 rounded-lg text-[10px] font-black tracking-wider transition-all ${xMode === 'thread' ? 'bg-violet-500/80 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]' : 'text-white/25 hover:text-white/50'}`}>THREAD</button>
              </div>
              {/* Recent */}
              <button onClick={() => setShowRecent(!showRecent)} className={`h-8 px-2.5 rounded-xl text-[10px] font-bold tracking-wider flex items-center gap-1.5 transition-all border ${showRecent ? 'bg-violet-500/15 text-violet-300 border-violet-500/25 shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'bg-white/[0.03] text-white/35 border-white/[0.06] hover:border-white/[0.12]'}`}>
                <Radio className="h-3 w-3" />{savedThreads.length || ''}
              </button>
              {/* New */}
              <button onClick={handleNewThread} className="h-8 w-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/60 hover:border-white/[0.12] transition-all active:scale-90"><Plus className="h-3.5 w-3.5" /></button>
              {/* Theme */}
              <div className="h-8 p-0.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center">
                <button onClick={() => setTheme('dark')} className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${!isLight ? 'bg-violet-500/80 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]' : 'text-white/25'}`}><Moon className="h-3 w-3" /></button>
                <button onClick={() => setTheme('light')} className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${isLight ? 'bg-cyan-500/80 text-white shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'text-white/25'}`}><Sun className="h-3 w-3" /></button>
              </div>
              {/* Intel toggle */}
              <button onClick={() => setIntelOpen(!intelOpen)} className="hidden md:flex h-8 w-8 rounded-xl bg-white/[0.03] border border-white/[0.06] items-center justify-center text-white/30 hover:text-white/60 hover:border-white/[0.12] transition-all active:scale-90">
                {intelOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
              </button>
              {/* Reset */}
              <button onClick={handleReset} className="h-8 w-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/20 hover:text-white/50 transition-all active:scale-90"><RotateCcw className="h-3 w-3" /></button>
            </div>
          </div>

          {/* ══ COACH MODE ══ */}
          {xMode === 'coach' && (
            <div className="flex-1 flex flex-col min-h-0">
              <input ref={coachFileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple onChange={handleCoachScreenshot} className="hidden" />

              {/* Chat area */}
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-4">
                {coachHistory.length === 0 && !coachLoading ? (
                  /* Empty state */
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-sm mx-auto">
                    <motion.div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center"
                      animate={{ boxShadow: ['0 0 40px rgba(139,92,246,0.3)', '0 0 70px rgba(139,92,246,0.5)', '0 0 40px rgba(139,92,246,0.3)'] }}
                      transition={{ duration: 3, repeat: Infinity }}>
                      <MessageCircle className="h-9 w-9 text-white" />
                    </motion.div>
                    <div className="space-y-2">
                      <h2 className="text-white/90 font-black text-xl tracking-tight">Your Coach</h2>
                      <p className="text-white/30 text-sm leading-relaxed">Tell me what&apos;s going on. Drop a screenshot. Ask me anything.</p>
                    </div>
                    {/* Suggestion chips */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        { label: '📸 Drop a screenshot', msg: '' },
                        { label: 'She said this...', msg: 'She said: "' },
                        { label: 'Should I text first?', msg: 'Should I text first?' },
                        { label: 'What does this mean?', msg: 'What does this mean: "' },
                        { label: 'How do I bring up plans?', msg: 'How do I bring up plans?' },
                        { label: 'Am I chasing?', msg: 'Am I chasing? Here\'s the thread: ' },
                      ].map((chip) => (
                        chip.label === '📸 Drop a screenshot'
                          ? <button key={chip.label} onClick={() => coachFileInputRef.current?.click()} className="px-3 py-2 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-300 text-[12px] font-bold hover:bg-violet-500/25 transition-all active:scale-95">{chip.label}</button>
                          : <button key={chip.label} onClick={() => setCoachInput(chip.msg)} className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/40 text-[12px] font-medium hover:bg-white/[0.08] hover:text-white/60 transition-all active:scale-95">{chip.label}</button>
                      ))}
                    </div>
                    {/* Context selector */}
                    <div className="space-y-2">
                      <p className="text-white/15 text-[9px] font-mono font-bold tracking-[0.4em]">WHO IS THIS?</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {CONTEXT_OPTIONS.map(ctx => (
                          <motion.button key={ctx.value} whileTap={{ scale: 0.92 }} onClick={() => setSelectedContext(ctx.value)} title={ctx.label}
                            className={`w-10 h-10 rounded-2xl text-base flex items-center justify-center transition-all border ${selectedContext === ctx.value ? 'bg-white/[0.10] border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]'}`}
                          >{ctx.emoji}</motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {coachHistory.map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          {/* Bubble */}
                          {msg.content && (
                            <div className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed font-medium ${
                              msg.role === 'user'
                                ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-br-md shadow-[0_4px_20px_rgba(139,92,246,0.3)]'
                                : 'bg-white/[0.07] border border-white/[0.10] text-white/90 rounded-bl-md backdrop-blur-sm'
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          )}
                          {/* Strategy badge */}
                          {msg.strategy && msg.strategy.one_liner && (
                            <Glass className="w-full p-3 space-y-1.5" glow neonColor="emerald">
                              <div className="flex items-center gap-1.5">
                                <Target className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-400/60 text-[9px] font-mono font-bold tracking-[0.3em]">STRATEGY</span>
                                {msg.strategy.momentum && <span className="ml-auto text-[9px] font-bold text-white/30 bg-white/[0.06] px-1.5 py-0.5 rounded-md">{msg.strategy.momentum}</span>}
                              </div>
                              <p className="text-white/85 text-sm font-semibold">&ldquo;{msg.strategy.one_liner}&rdquo;</p>
                              <div className="flex flex-wrap gap-1">
                                {msg.strategy.balance && <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/[0.05] text-white/35 border border-white/[0.08]">{msg.strategy.balance}</span>}
                                {msg.strategy.energy && <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-violet-500/10 text-violet-300/60 border border-violet-500/15">{msg.strategy.energy.replace('_', ' ')}</span>}
                                {msg.strategy.no_questions && <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/[0.05] text-white/35 border border-white/[0.08]">NO Q&apos;S</span>}
                                {msg.strategy.keep_short && <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/[0.05] text-white/35 border border-white/[0.08]">KEEP SHORT</span>}
                              </div>
                            </Glass>
                          )}
                          {/* Reply options */}
                          {msg.replies && (msg.replies.shorter || msg.replies.spicier || msg.replies.softer) && (
                            <div className="w-full space-y-2">
                              <p className="text-white/20 text-[9px] font-mono font-bold tracking-[0.4em] px-1">SEND ONE OF THESE</p>
                              {(['shorter', 'spicier', 'softer'] as const).map(tone => {
                                const text = msg.replies![tone];
                                if (!text) return null;
                                const cfg = TONE_CONFIG[tone];
                                return (
                                  <motion.button key={tone} whileTap={{ scale: 0.97 }}
                                    onClick={() => { navigator.clipboard.writeText(text); toast({ title: '✓ Copied!' }); }}
                                    className="w-full text-left group active:scale-[0.98]">
                                    <Glass className="p-3.5 transition-all hover:border-white/20" glow={false} neonColor={cfg.neon}>
                                      <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shrink-0 text-sm`} style={{ boxShadow: cfg.glow }}>{cfg.emoji}</div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] font-black tracking-[0.2em] text-white/40">{cfg.label}</span>
                                            <span className="text-white/15 text-[9px] font-mono">{text.split(' ').length}W</span>
                                            <span className="ml-auto text-[10px] text-white/20 group-hover:text-white/40 transition-colors flex items-center gap-1"><Copy className="h-2.5 w-2.5" /> tap to copy</span>
                                          </div>
                                          <p className="text-white/90 text-[14px] font-medium leading-relaxed">{text}</p>
                                        </div>
                                      </div>
                                    </Glass>
                                  </motion.button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {/* Loading bubble */}
                    {coachLoading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white/[0.07] border border-white/[0.10] flex items-center gap-2.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
                          <span className="text-white/30 text-[12px] font-medium font-mono tracking-wider">THINKING...</span>
                        </div>
                      </motion.div>
                    )}
                    <div ref={coachEndRef} />
                  </>
                )}
              </div>

              {/* Input bar */}
              <div className="shrink-0 px-4 md:px-6 py-3 border-t border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(40px) saturate(180%)' }}>
                <div className="flex items-end gap-2">
                  <button onClick={() => coachFileInputRef.current?.click()} disabled={coachExtracting || coachLoading}
                    className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/25 hover:text-white/50 hover:border-white/[0.12] transition-all active:scale-90 disabled:opacity-20 shrink-0">
                    {coachExtracting ? <Loader2 className="h-4 w-4 animate-spin text-violet-400" /> : <Camera className="h-4 w-4" />}
                  </button>
                  <div className="flex-1 rounded-2xl border border-white/[0.08] focus-within:border-violet-500/30 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.1)] transition-all overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <textarea value={coachInput} onChange={e => setCoachInput(e.target.value)} placeholder="Tell me what's going on..." rows={1} maxLength={1000}
                      disabled={coachLoading || coachExtracting}
                      className="w-full bg-transparent text-white placeholder-white/20 resize-none focus:outline-none text-sm font-medium leading-relaxed px-4 py-3 max-h-32 disabled:opacity-50"
                      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCoachSend(); }}
                      onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 128) + 'px'; }} />
                  </div>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={() => handleCoachSend()} disabled={coachLoading || coachExtracting || !coachInput.trim()}
                    className="h-10 px-5 rounded-xl font-black text-xs tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 text-white shadow-[0_4px_25px_rgba(139,92,246,0.35)] disabled:opacity-20 transition-all shrink-0">
                    {coachLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-3.5 w-3.5" />SEND</>}
                  </motion.button>
                </div>
                {/* Context chips when chat is active */}
                {coachHistory.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5">
                    {CONTEXT_OPTIONS.map(ctx => (
                      <button key={ctx.value} onClick={() => setSelectedContext(ctx.value)}
                        className={`shrink-0 w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all border ${selectedContext === ctx.value ? 'bg-white/[0.08] border-violet-500/30' : 'bg-white/[0.02] border-white/[0.05] opacity-50'}`}
                      >{ctx.emoji}</button>
                    ))}
                    <button onClick={() => { setCoachHistory([]); setCoachInput(''); }} className="shrink-0 h-7 px-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-white/20 hover:text-white/40 text-[9px] font-mono font-bold tracking-wider transition-all ml-auto">CLEAR</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── THREAD MODE ── */}
          {xMode === 'thread' && (<>

          {/* ── PULSE STRIP ── */}
          {thread.length > 0 && (
            <div className="shrink-0 h-[2px] relative overflow-hidden">
              <motion.div className="absolute inset-0" animate={{ background: `linear-gradient(90deg, transparent 0%, ${pulseColor}50 30%, ${pulseColor} 50%, ${pulseColor}50 70%, transparent 100%)` }} transition={{ duration: 1 }} />
              <motion.div className="absolute top-0 bottom-0 w-32" style={{ background: `linear-gradient(90deg, transparent, ${pulseColor}, transparent)`, filter: `blur(4px)` }} animate={{ left: ['-15%', '115%'] }} transition={{ duration: 1.8 + (1 - tactical.riskScore / 100) * 2, repeat: Infinity, ease: 'linear' }} />
            </div>
          )}

          {/* ── ACTIVE THREAD ── */}
          {activeThreadName && (
            <div className="shrink-0 px-5 py-2 flex items-center gap-2.5 border-b border-white/[0.04]" style={{ background: 'rgba(139,92,246,0.03)' }}>
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
              <span className="text-violet-300/60 text-[11px] font-semibold font-mono truncate">{activeThreadName}</span>
              {saving && <Loader2 className="h-3 w-3 animate-spin text-violet-400/40 ml-auto" />}
            </div>
          )}

          {/* ── RECENT DRAWER ── */}
          <AnimatePresence>
            {showRecent && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="shrink-0 overflow-hidden border-b border-white/[0.06]">
                <div className="p-3 max-h-52 overflow-y-auto" style={{ background: 'rgba(255,255,255,0.01)' }}>
                  {savedThreads.length === 0 ? <p className="text-center text-white/15 text-xs py-8 font-mono">NO THREADS YET</p> : (
                    <div className="space-y-1">
                      {savedThreads.map(t => (
                        <button key={t.id} onClick={() => handleLoadThread(t)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group active:scale-[0.98] border ${activeThreadId === t.id ? 'bg-violet-500/10 border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.08)]' : 'border-transparent hover:bg-white/[0.03] hover:border-white/[0.05]'}`}>
                          <div className={`w-2 h-2 rounded-full ${activeThreadId === t.id ? 'bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.6)]' : 'bg-white/10'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-white/60 text-xs font-semibold truncate">{t.name}</p>
                            <p className="text-white/15 text-[9px] font-mono">{t.message_count} MSG</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteThread(t.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/15 transition-all"><Trash2 className="h-2.5 w-2.5 text-red-400/60" /></button>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══ THREAD AREA ══ */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5">
            {thread.length === 0 && replies.length === 0 && !decodeResult ? (
              /* ── EMPTY STATE ── */
              <div className="h-full flex flex-col items-center justify-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="text-center space-y-8 max-w-sm">
                  {/* Animated logo orb */}
                  <div className="relative w-32 h-32 mx-auto">
                    {/* Outer pulsing ring */}
                    <motion.div className="absolute inset-0 rounded-full border border-violet-500/20" animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 3, repeat: Infinity }} />
                    <motion.div className="absolute inset-2 rounded-full border border-fuchsia-500/15" animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0, 0.2] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} />
                    {/* Core orb */}
                    <motion.div
                      className="absolute inset-6 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center"
                      animate={{ boxShadow: ['0 0 40px rgba(139,92,246,0.3), 0 0 80px rgba(139,92,246,0.1)', '0 0 60px rgba(139,92,246,0.5), 0 0 120px rgba(139,92,246,0.15)', '0 0 40px rgba(139,92,246,0.3), 0 0 80px rgba(139,92,246,0.1)'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Crosshair className="h-8 w-8 text-white/90" />
                    </motion.div>
                    {/* Orbiting dot */}
                    <motion.div className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                      animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                      style={{ top: '50%', left: '50%', transformOrigin: '-32px 0px' }} />
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-white/90 font-black text-2xl tracking-tight">Command Thread</h2>
                    <p className="text-white/30 text-sm leading-relaxed font-medium">Paste their message. Set the mission. Deploy your reply.</p>
                  </div>

                  {/* Flow visualization */}
                  <div className="flex items-center justify-center gap-3">
                    {[
                      { label: 'THEM', color: 'border-white/10 text-white/25' },
                      { label: 'INTEL', color: 'border-violet-500/25 text-violet-400/40' },
                      { label: 'YOU', color: 'border-fuchsia-500/25 text-fuchsia-400/40' },
                      { label: '\u221E', color: 'border-cyan-500/25 text-cyan-400/40' },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-black tracking-wider ${s.color}`}>{s.label}</motion.span>
                        {i < 3 && <span className="text-white/10 text-xs">\u2192</span>}
                      </div>
                    ))}
                  </div>

                  {/* Context + Goal selectors */}
                  <div className="space-y-4 pt-2">
                    <div>
                      <p className="text-white/15 text-[9px] font-mono font-bold tracking-[0.4em] mb-2.5">CONTEXT</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {CONTEXT_OPTIONS.map(ctx => (
                          <motion.button key={ctx.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedContext(ctx.value)} title={ctx.label}
                            className={`w-11 h-11 rounded-2xl text-lg flex items-center justify-center transition-all border ${selectedContext === ctx.value ? 'bg-white/[0.08] border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.2)]' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'}`}
                          >{ctx.emoji}</motion.button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-white/15 text-[9px] font-mono font-bold tracking-[0.4em] mb-2.5">MISSION</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {GOAL_OPTIONS.map(goal => (
                          <motion.button key={goal.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setSelectedGoal(goal.value)}
                            className={`h-8 px-3 rounded-xl text-[10px] font-bold tracking-wider flex items-center gap-1.5 transition-all border ${selectedGoal === goal.value ? 'bg-violet-500/15 text-violet-300 border-violet-500/25 shadow-[0_0_15px_rgba(139,92,246,0.12)]' : 'bg-white/[0.02] text-white/30 border-white/[0.06] hover:border-white/[0.12]'}`}
                          ><span>{goal.emoji}</span>{goal.label}</motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              /* ── LIVE THREAD ── */
              <div className="space-y-1">
                {thread.map((msg, i) => {
                  const isThem = msg.role === 'them';
                  const decode = inlineDecodes[i];
                  const isDecodingThis = decodingIdx === i;
                  return (
                    <div key={i}>
                      <motion.div initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className={`flex ${isThem ? 'justify-start' : 'justify-end'} mb-1.5`}>
                        <div onClick={() => isThem && handleInlineDecode(i)} className={`max-w-[80%] relative group ${isThem ? 'cursor-pointer' : ''}`}>
                          <div className={`px-4 py-3 text-[14px] leading-relaxed font-medium ${
                            isThem
                              ? `rounded-2xl rounded-bl-md border transition-all ${decode ? 'border-amber-500/30 bg-amber-500/[0.08]' : 'border-white/[0.10] bg-white/[0.06]'} text-white/90 hover:border-amber-500/25 backdrop-blur-sm`
                              : 'rounded-2xl rounded-br-md text-white bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 shadow-[0_4px_30px_rgba(139,92,246,0.4)]'
                          }`}>
                            {msg.text}
                          </div>
                          {/* Decode hint */}
                          {isThem && !decode && !isDecodingThis && (
                            <div className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all group-hover:scale-100 scale-75">
                              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(251,191,36,0.2)]"><Brain className="h-3 w-3 text-amber-400" /></div>
                            </div>
                          )}
                          {isDecodingThis && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 flex items-center gap-2 px-2">
                              <Loader2 className="h-3 w-3 animate-spin text-amber-400/60" /><span className="text-[10px] text-amber-400/40 font-mono tracking-wider">DECODING</span>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                      {/* Inline decode result */}
                      <AnimatePresence>
                        {decode && (
                          <motion.div initial={{ opacity: 0, height: 0, scale: 0.95 }} animate={{ opacity: 1, height: 'auto', scale: 1 }} exit={{ opacity: 0, height: 0 }} className="ml-2 mr-[18%] mb-2 overflow-hidden">
                            <Glass className="p-3 space-y-2" glow neonColor="amber">
                              <div className="flex items-center justify-between">
                                <span className="text-amber-400/60 text-[9px] font-mono font-bold tracking-[0.3em]">DECODED</span>
                                <button onClick={() => handleInlineDecode(i)} className="text-white/15 hover:text-white/40"><X className="h-2.5 w-2.5" /></button>
                              </div>
                              <p className="text-white/80 text-xs font-semibold leading-relaxed">{decode.intent}</p>
                              <p className="text-white/35 text-[11px] leading-relaxed">{decode.subtext}</p>
                              {decode.flags.length > 0 && (<div className="flex flex-wrap gap-1">{decode.flags.map((f, fi) => (<span key={fi} className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${f.type === 'green' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15' : f.type === 'red' ? 'text-red-400 bg-red-500/10 border-red-500/15' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/15'}`}>{f.text}</span>))}</div>)}
                              <p className="text-violet-300/50 text-[10px] font-medium flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" /> {decode.coach_tip}</p>
                            </Glass>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
                <div ref={threadEndRef} />

                {/* Standalone decode */}
                {decodeResult && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                    <Glass className="p-4 space-y-2.5" glow neonColor="amber">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Brain className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-white/40 text-[9px] font-mono font-bold tracking-[0.3em]">DECODED</span>
                          <span className="text-[9px] font-bold text-amber-300/60 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/15">{(ENERGY_CONFIG[decodeResult.energy] || ENERGY_CONFIG.neutral).emoji} {decodeResult.energy}</span>
                        </div>
                        <button onClick={() => setDecodeResult(null)} className="text-white/15 hover:text-white/40"><X className="h-3 w-3" /></button>
                      </div>
                      <p className="text-white/85 text-sm font-semibold">{decodeResult.intent}</p>
                      <p className="text-white/40 text-xs">{decodeResult.subtext}</p>
                      {decodeResult.flags.length > 0 && (<div className="flex flex-wrap gap-1">{decodeResult.flags.map((f, idx) => (<span key={idx} className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${f.type === 'green' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15' : f.type === 'red' ? 'text-red-400 bg-red-500/10 border-red-500/15' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/15'}`}>{f.text}</span>))}</div>)}
                      <p className="text-violet-300/50 text-[11px] font-medium flex items-center gap-1"><Sparkles className="h-3 w-3" /> {decodeResult.coach_tip}</p>
                    </Glass>
                  </motion.div>
                )}

                {/* ── REPLY DECK ── */}
                <AnimatePresence>
                  {replies.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="mt-5 space-y-2.5">
                      <p className="text-white/20 text-[9px] font-mono font-bold tracking-[0.4em]">SELECT REPLY</p>
                      {replies.map((reply, idx) => {
                        const config = TONE_CONFIG[reply.tone];
                        const isCopied = copied === reply.tone;
                        const outcome = simulatedOutcomes[reply.tone];
                        const isBest = !!outcome && outcome.confidence === bestOutcome;
                        return (
                          <motion.button key={reply.tone} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                            onClick={() => handleCopy(reply)} className="w-full text-left group active:scale-[0.98] transition-transform">
                            <Glass className={`p-4 transition-all ${isCopied ? 'border-emerald-500/25' : isBest ? 'border-violet-500/20' : ''}`} glow={isBest || isCopied} neonColor={isCopied ? 'emerald' : config.neon}>
                              <div className="flex items-start gap-3.5">
                                <motion.div whileHover={{ scale: 1.1, rotate: 5 }}
                                  className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shrink-0`}
                                  style={{ boxShadow: config.glow }}>
                                  <span className="text-base">{config.emoji}</span>
                                </motion.div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black tracking-[0.2em] text-white/50">{config.label}</span>
                                    <span className="text-white/15 text-[9px] font-mono">{reply.text.split(' ').length}W</span>
                                    {outcome && (<span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${outcome.confidence >= 75 ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/15' : outcome.confidence >= 60 ? 'text-amber-300 bg-amber-500/10 border-amber-500/15' : 'text-rose-300 bg-rose-500/10 border-rose-500/15'}`}>{outcome.confidence}%</span>)}
                                    {isBest && <span className="text-[8px] font-black tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/15 px-1.5 py-0.5 rounded-md shadow-[0_0_10px_rgba(34,211,238,0.15)]">BEST MOVE</span>}
                                    <span className={`ml-auto text-[10px] font-bold flex items-center gap-1 transition-all ${isCopied ? 'text-emerald-400' : 'text-transparent group-hover:text-white/25'}`}>{isCopied ? <><Check className="h-3 w-3" /> COPIED</> : <Copy className="h-3 w-3" />}</span>
                                  </div>
                                  <p className="text-white/90 text-[15px] font-medium leading-relaxed">{reply.text}</p>
                                  {outcome && <p className="mt-2 text-[10px] text-white/25 font-mono">{outcome.branch}</p>}
                                </div>
                              </div>
                            </Glass>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── CONFIRM SEND ── */}
                <AnimatePresence>
                  {pendingSent && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3">
                      <Glass className="p-4 space-y-3" glow neonColor="emerald">
                        <div className="flex items-center gap-2">
                          <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                          <span className="text-emerald-400/80 text-[9px] font-mono font-bold tracking-[0.3em]">CONFIRM SEND</span>
                          <span className="text-white/20 text-[9px] font-mono ml-auto">WAIT {tactical.waitWindow}</span>
                        </div>
                        <p className="text-white/80 text-sm font-medium pl-3 border-l-2 border-emerald-500/30">{pendingSent.text}</p>
                        <div className="flex gap-2">
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleMarkSent(pendingSent)}
                            className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(52,211,153,0.3)]">
                            <Check className="h-4 w-4" /> I SENT THIS
                          </motion.button>
                          <button onClick={() => setPendingSent(null)} className="h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/30 font-bold text-xs transition-all hover:text-white/50">SKIP</button>
                        </div>
                      </Glass>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ══ FLOATING INPUT ══ */}
          <div className="shrink-0 px-4 md:px-6 py-3 border-t border-white/[0.06]" style={{ background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.04)', backdropFilter: 'blur(40px) saturate(180%)' }}>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleScreenshot} className="hidden" />
            {screenshotPreview && (
              <div className="mb-2 relative rounded-xl overflow-hidden border border-white/10 max-h-20">
                <img src={screenshotPreview} alt="" className="w-full max-h-20 object-cover opacity-50" />
                {extracting && <div className="absolute inset-0 bg-black/70 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-violet-400" /></div>}
              </div>
            )}
            <div className="flex items-end gap-2.5">
              <div className="flex-1 rounded-2xl border border-white/[0.08] focus-within:border-violet-500/30 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.1)] transition-all overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={thread.length === 0 ? 'Paste what they said...' : 'Their reply...'} rows={1}
                  className="w-full bg-transparent text-white placeholder-white/20 resize-none focus:outline-none text-sm font-medium leading-relaxed px-4 py-3 max-h-32" maxLength={2000}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                  onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 128) + 'px'; }} />
              </div>
              <div className="flex items-center gap-1.5 pb-0.5">
                <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/25 hover:text-white/50 hover:border-white/[0.12] transition-all active:scale-90"><Camera className="h-4 w-4" /></button>
                <button onClick={handleDecode} disabled={decoding || (!input.trim() && thread.length === 0)} className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300/80 hover:bg-amber-500/20 hover:shadow-[0_0_15px_rgba(251,191,36,0.15)] transition-all active:scale-90 disabled:opacity-15">
                  {decoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                </button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={handleGenerate} disabled={loading || !input.trim()}
                  className={`h-10 px-6 rounded-xl font-black text-xs tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-15 ${isPro ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 text-black shadow-[0_4px_25px_rgba(52,211,153,0.3)]' : 'bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 text-white shadow-[0_4px_25px_rgba(139,92,246,0.35)]'}`}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-3.5 w-3.5" />{thread.length === 0 ? 'GO' : 'REPLY'}</>}
                </motion.button>
              </div>
            </div>
            {/* Mobile intel peek */}
            <button onClick={() => setMobileSheet(!mobileSheet)} className="md:hidden w-full mt-2.5 flex items-center justify-center gap-2 py-1.5 text-[9px] font-mono font-bold tracking-[0.3em] text-white/20 hover:text-white/35 transition-colors">
              <Activity className="h-3 w-3" />
              {mobileSheet ? 'HIDE INTEL' : `HP ${tactical.healthScore} \u00B7 RISK ${tactical.riskLevel.toUpperCase()}`}
              <ChevronUp className={`h-3 w-3 transition-transform ${mobileSheet ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* ── MOBILE SHEET ── */}
          <AnimatePresence>
            {mobileSheet && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="md:hidden overflow-hidden shrink-0 border-t border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(40px)' }}>
                <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
                  {/* Health ring + stats */}
                  <div className="flex items-center gap-5">
                    <div className="relative w-20 h-20 shrink-0">
                      <svg viewBox="0 0 80 80" className="w-full h-full"><circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" /><circle cx="40" cy="40" r="34" fill="none" strokeWidth="3" strokeLinecap="round" stroke={pulseColor} strokeDasharray={`${healthPct * 213.6} 213.6`} transform="rotate(-90 40 40)" style={{ filter: `drop-shadow(0 0 6px ${pulseColor}50)` }} /></svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-white/85 text-lg font-black">{tactical.healthScore}</span><span className="text-white/20 text-[7px] font-mono font-bold tracking-[0.3em]">HP</span></div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">{tactical.momentum === 'theirs' ? <TrendingUp className="h-3 w-3 text-emerald-400" /> : tactical.momentum === 'yours' ? <TrendingDown className="h-3 w-3 text-rose-400" /> : <Gauge className="h-3 w-3 text-violet-400" />}<span className="text-white/50 text-xs font-semibold">{tactical.momentum === 'theirs' ? 'Their lead' : tactical.momentum === 'yours' ? 'Chasing' : 'Balanced'}</span></div>
                      <div className="flex items-center gap-2"><Clock className="h-3 w-3 text-cyan-400/50" /><span className="text-cyan-300/60 text-xs font-semibold">Wait {tactical.waitWindow}</span></div>
                      <div className="flex items-center gap-2"><Shield className="h-3 w-3 text-white/20" /><span className={`text-xs font-semibold ${tactical.riskLevel === 'high' ? 'text-rose-400' : tactical.riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>Risk {tactical.riskScore}</span></div>
                    </div>
                  </div>
                  {strategyData && (
                    <Glass className="p-3 space-y-1.5" glow neonColor="emerald">
                      <span className="text-emerald-400/50 text-[8px] font-mono font-bold tracking-[0.3em] flex items-center gap-1"><Target className="h-2.5 w-2.5" />STRATEGY</span>
                      <p className="text-white/80 text-xs font-semibold">&ldquo;{strategyData.move.one_liner}&rdquo;</p>
                    </Glass>
                  )}
                  <div className="flex flex-wrap gap-1.5">{CONTEXT_OPTIONS.map(ctx => (<button key={ctx.value} onClick={() => setSelectedContext(ctx.value)} className={`w-9 h-9 rounded-xl text-sm flex items-center justify-center transition-all border ${selectedContext === ctx.value ? 'bg-white/[0.08] border-violet-500/25 shadow-[0_0_12px_rgba(139,92,246,0.15)]' : 'bg-white/[0.02] border-white/[0.05]'}`}>{ctx.emoji}</button>))}</div>
                  <div className="flex flex-wrap gap-1.5">{GOAL_OPTIONS.map(g => (<button key={g.value} onClick={() => setSelectedGoal(g.value)} className={`h-7 px-2.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all border ${selectedGoal === g.value ? 'bg-violet-500/12 text-violet-300 border-violet-500/20' : 'bg-white/[0.02] text-white/25 border-white/[0.04]'}`}><span>{g.emoji}</span>{g.label}</button>))}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </>)}
        </div>

        {/* ═══════════════════════════════════════════════
            RIGHT: Intel Sidebar (desktop)
            ═══════════════════════════════════════════════ */}
        <AnimatePresence>
          {intelOpen && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 360, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="hidden md:block h-full overflow-hidden border-l border-white/[0.06]">
              <div className="w-[360px] h-full overflow-y-auto p-6 space-y-6" style={{ background: isLight ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.04)', backdropFilter: 'blur(40px) saturate(180%)' }}>

                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-[0.15em] border ${isPro ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(52,211,153,0.1)]' : 'bg-violet-500/10 text-violet-300 border-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.1)]'}`}>{isPro ? 'PRO \u00B7 V2' : 'FREE \u00B7 V1'}</span>
                  <span className="text-white/20 text-[8px] font-mono font-bold tracking-[0.5em]">INTEL</span>
                </div>

                {/* Health Ring */}
                <div className="flex flex-col items-center py-2">
                  <div className="relative w-36 h-36">
                    <svg viewBox="0 0 144 144" className="w-full h-full">
                      {/* Track */}
                      <circle cx="72" cy="72" r="62" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                      <circle cx="72" cy="72" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                      {/* Health arc */}
                      <motion.circle cx="72" cy="72" r="62" fill="none" strokeWidth="4" strokeLinecap="round" stroke={pulseColor}
                        initial={{ strokeDasharray: '0 389.6' }}
                        animate={{ strokeDasharray: `${healthPct * 389.6} 389.6` }}
                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                        transform="rotate(-90 72 72)" style={{ filter: `drop-shadow(0 0 12px ${pulseColor}90)` }} />
                      {/* Reciprocity arc */}
                      <motion.circle cx="72" cy="72" r="52" fill="none" strokeWidth="3" strokeLinecap="round" stroke="rgba(139,92,246,0.4)"
                        initial={{ strokeDasharray: '0 326.7' }}
                        animate={{ strokeDasharray: `${recipPct * 326.7} 326.7` }}
                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                        transform="rotate(-90 72 72)" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-white/90 text-4xl font-black">{tactical.healthScore}</span>
                      <span className="text-white/20 text-[8px] font-mono font-bold tracking-[0.4em]">HEALTH</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {tactical.momentum === 'theirs' ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> : tactical.momentum === 'yours' ? <TrendingDown className="h-3.5 w-3.5 text-rose-400" /> : <Gauge className="h-3.5 w-3.5 text-violet-400" />}
                    <span className="text-white/45 text-xs font-semibold">{tactical.momentum === 'theirs' ? 'Their lead' : tactical.momentum === 'yours' ? 'You\u2019re chasing' : 'Balanced'}</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'RISK', value: tactical.riskScore, color: tactical.riskLevel === 'high' ? 'text-rose-400' : tactical.riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400' },
                    { label: 'BALANCE', value: `${tactical.reciprocity}%`, color: 'text-violet-300' },
                    { label: 'THEM', value: tactical.themCount, color: 'text-white/60' },
                    { label: 'YOU', value: tactical.youCount, color: 'text-white/60' },
                  ].map(s => (
                    <Glass key={s.label} className="p-3 text-center">
                      <p className="text-white/30 text-[7px] font-mono font-bold tracking-[0.4em]">{s.label}</p>
                      <p className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</p>
                    </Glass>
                  ))}
                </div>

                {/* Timing */}
                <Glass className="p-3.5 flex items-center gap-3" glow neonColor="cyan">
                  <Clock className="h-4 w-4 text-cyan-400/50 shrink-0" />
                  <div><p className="text-cyan-300/70 text-xs font-bold">Wait {tactical.waitWindow}</p><p className="text-white/20 text-[10px] mt-0.5 font-mono">REDUCES CHASE</p></div>
                </Glass>

                {/* Guardrail */}
                <Glass className="p-3.5" glow neonColor={riskNeon}>
                  <p className={`text-xs font-bold ${tactical.riskLevel === 'high' ? 'text-rose-400' : tactical.riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {tactical.riskLevel === 'high' ? '\u26D4 DO NOT DOUBLE-TEXT' : tactical.riskLevel === 'medium' ? '\u26A0\uFE0F KEEP SHORT, NO PRESSURE' : '\u2705 SAFE TO ADVANCE'}
                  </p>
                </Glass>

                {/* Strategy */}
                {strategyData && (
                  <Glass className="p-4 space-y-2.5" glow neonColor="emerald">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400/50 text-[8px] font-mono font-bold tracking-[0.4em] flex items-center gap-1.5"><Target className="h-3 w-3" />STRATEGY</span>
                      <span className="text-[8px] font-bold text-emerald-300/40 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/15">{strategyData.move.energy}</span>
                    </div>
                    <p className="text-white/85 text-sm font-semibold leading-relaxed">&ldquo;{strategyData.move.one_liner}&rdquo;</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/[0.06] text-white/40 border border-white/[0.08]">{strategyData.momentum}</span>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/[0.06] text-white/40 border border-white/[0.08]">{strategyData.balance}</span>
                      {strategyData.move.constraints.keep_short && <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/[0.06] text-white/40 border border-white/[0.08]">KEEP SHORT</span>}
                      {strategyData.move.constraints.no_questions && <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/[0.06] text-white/40 border border-white/[0.08]">NO Q&apos;S</span>}
                      {strategyData.move.constraints.add_tease && <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/[0.06] text-white/40 border border-white/[0.08]">TEASE</span>}
                      {strategyData.move.constraints.push_meetup && <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/[0.06] text-white/40 border border-white/[0.08]">MEETUP</span>}
                    </div>
                  </Glass>
                )}

                {/* Context */}
                <div>
                  <p className="text-white/25 text-[8px] font-mono font-bold tracking-[0.5em] mb-3">CONTEXT</p>
                  <div className="flex flex-wrap gap-2">
                    {CONTEXT_OPTIONS.map(ctx => (
                      <motion.button key={ctx.value} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => setSelectedContext(ctx.value)} title={ctx.label}
                        className={`w-11 h-11 rounded-2xl text-lg flex items-center justify-center transition-all border ${selectedContext === ctx.value ? 'bg-white/[0.10] border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.25)]' : 'bg-white/[0.04] border-white/[0.08] hover:border-white/[0.15]'}`}
                      >{ctx.emoji}</motion.button>
                    ))}
                  </div>
                </div>

                {/* Goal */}
                <div>
                  <p className="text-white/25 text-[8px] font-mono font-bold tracking-[0.5em] mb-3">MISSION</p>
                  <div className="flex flex-wrap gap-2">
                    {GOAL_OPTIONS.map(g => (
                      <motion.button key={g.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setSelectedGoal(g.value)}
                        className={`h-8 px-3 rounded-xl text-[10px] font-bold tracking-wider flex items-center gap-1.5 transition-all border ${selectedGoal === g.value ? 'bg-violet-500/20 text-violet-300 border-violet-500/35 shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'bg-white/[0.04] text-white/35 border-white/[0.08] hover:border-white/[0.15]'}`}
                      ><span>{g.emoji}</span>{g.label}</motion.button>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Theme overrides ── */}
      <style jsx global>{`
        .x-v4-light [class*='text-white'] { color: rgba(15,23,42,0.92) !important; }
      `}</style>
    </div>
  );
}
