'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Copy, Sparkles, Loader2, MessageCircle, Shield, Camera, X, Brain, Send,
  ChevronUp, RotateCcw, Trash2, Check, Clock, Plus, Target, Gauge, TrendingUp, TrendingDown,
  Activity, PanelRightOpen, PanelRightClose, Crosshair, Radio, Crown, Lock, Pencil, RefreshCw,
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
  shorter: { label: 'QUICK', gradient: 'from-cyan-400 to-blue-500', glow: '0 0 20px rgba(34,211,238,0.4), 0 0 60px rgba(34,211,238,0.1)', emoji: '⚡', neon: 'cyan' },
  spicier: { label: 'SPICY', gradient: 'from-rose-400 to-pink-500', glow: '0 0 20px rgba(251,113,133,0.4), 0 0 60px rgba(251,113,133,0.1)', emoji: '🔥', neon: 'rose' },
  softer:  { label: 'SOFT',  gradient: 'from-emerald-400 to-green-500', glow: '0 0 20px rgba(52,211,153,0.4), 0 0 60px rgba(52,211,153,0.1)', emoji: '💚', neon: 'emerald' },
};

const CONTEXT_OPTIONS = [
  { value: 'crush', label: 'Crush', emoji: '💕' },
  { value: 'friend', label: 'Friend', emoji: '🤝' },
  { value: 'work', label: 'Work', emoji: '💼' },
  { value: 'ex', label: 'Ex', emoji: '💔' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { value: 'new-match', label: 'Match', emoji: '💘' },
];

const GOAL_OPTIONS = [
  { value: 'reignite', label: 'Reignite', emoji: '✨' },
  { value: 'meetup', label: 'Plans', emoji: '📍' },
  { value: 'defuse', label: 'Defuse', emoji: '🕊️' },
  { value: 'clarify', label: 'Clarity', emoji: '🧭' },
  { value: 'keep-light', label: 'Light', emoji: '🎈' },
];

const ENERGY_CONFIG: Record<string, { emoji: string }> = {
  interested: { emoji: '💚' }, testing: { emoji: '🧪' }, neutral: { emoji: '😐' },
  'pulling-away': { emoji: '🚪' }, flirty: { emoji: '😏' }, confrontational: { emoji: '⚔️' },
  anxious: { emoji: '😰' }, playful: { emoji: '😄' }, cold: { emoji: '🧊' }, warm: { emoji: '☀️' },
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
    <div className={`relative rounded-2xl border border-white/[0.12] backdrop-blur-2xl ${className}`}
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)', boxShadow: glow ? glowMap[neonColor] || glowMap.violet : '0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
      {children}
    </div>
  );
}

export default function AppPage() {
  // ── Coach state ─────────────────────────────────────────
  const [coachHistory, setCoachHistory] = useState<CoachMessage[]>([]);
  const [coachInput, setCoachInput] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachExtracting, setCoachExtracting] = useState(false);

  // ── Thread state ────────────────────────────────────────
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [input, setInput] = useState('');
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [pendingSent, setPendingSent] = useState<Reply | null>(null);
  const [strategyData, setStrategyData] = useState<StrategyData>(null);
  const [decodeResult, setDecodeResult] = useState<DecodeResult>(null);
  const [decoding, setDecoding] = useState(false);
  const [decodingIdx, setDecodingIdx] = useState<number | null>(null);
  const [inlineDecodes, setInlineDecodes] = useState<Record<number, DecodeResult>>({});

  // ── Screenshot state ────────────────────────────────────
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);

  // ── Thread management ───────────────────────────────────
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThreadName, setActiveThreadName] = useState<string | null>(null);
  const [savedThreads, setSavedThreads] = useState<SavedThread[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── App state ───────────────────────────────────────────
  const [selectedContext, setSelectedContext] = useState<string>('crush');
  const [selectedGoal, setSelectedGoal] = useState<string>('reignite');
  const [isPro, setIsPro] = useState(false);
  const [useV2, setUseV2] = useState(true);
  const [usageCount, setUsageCount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(5);
  const [showPaywall, setShowPaywall] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  // ── UI state ────────────────────────────────────────────
  const [appView, setAppView] = useState<'coach' | 'thread'>('coach');
  const [intelOpen, setIntelOpen] = useState(true);
  const [mobileSheet, setMobileSheet] = useState(false);

  // ── Edit + Polish state ─────────────────────────────────
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [refining, setRefining] = useState(false);

  // ── Refs ────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coachFileInputRef = useRef<HTMLInputElement>(null);
  const coachEndRef = useRef<HTMLDivElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // ── Init: auth + usage ────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/usage');
        if (!res.ok) return;
        const d = await res.json();
        setUsageCount(d.usageCount ?? 0);
        setUsageLimit(d.usageLimit ?? 5);
        setIsPro(!!d.isPro);
        setUseV2(!!d.isPro);
        setUserId(d.userId ?? null);
        setUserEmail(d.userEmail ?? null);
        if (d.trialDaysLeft != null) setTrialDaysLeft(d.trialDaysLeft);
      } catch {}
    })();
  }, []);

  // Fetch saved threads on mount
  const fetchThreads = useCallback(async () => {
    try { const r = await fetch('/api/threads'); if (r.ok) { const d = await r.json(); setSavedThreads(d.threads || []); } } catch {}
  }, []);
  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  // Auto-save thread
  useEffect(() => {
    if (thread.length < 2) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        const firstName = thread.find(m => m.role === 'them');
        const name = activeThreadName || (firstName ? firstName.text.slice(0, 40) : 'Conversation');
        const res = await fetch('/api/threads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: activeThreadId || undefined, name, messages: thread.map(m => ({ role: m.role, text: m.text, timestamp: new Date(m.timestamp).toISOString() })), context: selectedContext }) });
        const d = await res.json();
        if (d.thread && !activeThreadId) { setActiveThreadId(d.thread.id); setActiveThreadName(name); }
        fetchThreads();
      } catch {} finally { setSaving(false); }
    }, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [thread, activeThreadId, activeThreadName, selectedContext, fetchThreads]);

  // Scroll coach chat
  useEffect(() => { coachEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [coachHistory, coachLoading]);
  useEffect(() => { threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread, replies]);

  // ── Tactical computed ───────────────────────────────────
  const tactical = useMemo(() => {
    const youMsgs = thread.filter(m => m.role === 'you');
    const themMsgs = thread.filter(m => m.role === 'them');
    const total = thread.length;
    const youCount = youMsgs.length;
    const themCount = themMsgs.length;
    const reciprocity = total > 0 ? Math.round((themCount / total) * 100) : 50;
    const lastSender = total > 0 ? thread[total - 1].role : null;

    let momentum: 'yours' | 'theirs' | 'balanced' = 'balanced';
    if (total >= 3) {
      const last3 = thread.slice(-3);
      const youLast3 = last3.filter(m => m.role === 'you').length;
      if (youLast3 >= 2) momentum = 'yours';
      else if (youLast3 <= 1 && last3.filter(m => m.role === 'them').length >= 2) momentum = 'theirs';
    }

    const youAvgLen = youMsgs.length > 0 ? youMsgs.reduce((s, m) => s + m.text.length, 0) / youMsgs.length : 0;
    const themAvgLen = themMsgs.length > 0 ? themMsgs.reduce((s, m) => s + m.text.length, 0) / themMsgs.length : 0;
    const effortRatio = youAvgLen > 0 && themAvgLen > 0 ? youAvgLen / themAvgLen : 1;

    let healthScore = 70;
    if (reciprocity >= 40 && reciprocity <= 60) healthScore += 15;
    else if (reciprocity < 30 || reciprocity > 70) healthScore -= 20;
    if (momentum === 'yours') healthScore -= 15;
    if (effortRatio > 2) healthScore -= 10;
    if (lastSender === 'you' && total > 2) healthScore -= 5;
    healthScore = clamp(healthScore, 10, 100);

    let riskScore = 0;
    if (lastSender === 'you') riskScore += 25;
    if (momentum === 'yours') riskScore += 20;
    if (effortRatio > 1.5) riskScore += 15;
    if (reciprocity < 35) riskScore += 15;
    riskScore = clamp(riskScore, 0, 100);
    const riskLevel: 'low' | 'medium' | 'high' = riskScore >= 60 ? 'high' : riskScore >= 35 ? 'medium' : 'low';

    let waitWindow = '15-30min';
    if (riskLevel === 'high') waitWindow = '2-4hr';
    else if (riskLevel === 'medium') waitWindow = '1-2hr';
    else if (momentum === 'theirs') waitWindow = '5-15min';

    return { youCount, themCount, reciprocity, momentum, healthScore, riskScore, riskLevel, waitWindow };
  }, [thread]);

  const healthPct = tactical.healthScore / 100;
  const recipPct = tactical.reciprocity / 100;
  const pulseColor = tactical.healthScore >= 70 ? '#10b981' : tactical.healthScore >= 45 ? '#f59e0b' : '#ef4444';
  const riskNeon = tactical.riskLevel === 'high' ? 'rose' : tactical.riskLevel === 'medium' ? 'amber' : 'emerald';

  // Simulated outcomes
  const simulatedOutcomes = useMemo(() => {
    if (replies.length === 0 || !strategyData) return {} as Record<string, { confidence: number; branch: string }>;
    const m = strategyData.momentum;
    const base = m === 'Rising' ? 72 : m === 'Flat' ? 58 : m === 'Declining' ? 42 : 35;
    return {
      shorter: { confidence: clamp(base + 8, 20, 95), branch: 'Safe play — keeps door open' },
      spicier: { confidence: clamp(base + (m === 'Rising' ? 12 : -5), 20, 95), branch: m === 'Rising' ? 'High upside — they\'re engaged' : 'Bold move — risky if they\'re cold' },
      softer: { confidence: clamp(base + 3, 20, 95), branch: 'Warm approach — builds trust' },
    };
  }, [replies, strategyData]);

  const bestOutcome = useMemo(() => {
    const entries = Object.values(simulatedOutcomes);
    if (entries.length === 0) return 0;
    return Math.max(...entries.map(e => e.confidence));
  }, [simulatedOutcomes]);

  // ── Coach handlers ──────────────────────────────────────
  const handleCoachSend = async () => {
    if (!coachInput.trim() || coachLoading) return;
    const msg = coachInput.trim();
    setCoachInput('');
    const newHistory: CoachMessage[] = [...coachHistory, { role: 'user', content: msg }];
    setCoachHistory(newHistory);
    setCoachLoading(true);
    try {
      const threadContext = thread.length > 0 ? thread.map(m => `${m.role === 'you' ? 'You' : 'Them'}: ${m.text}`).join('\n') : undefined;
      const chatHist = newHistory.filter(m => m.role === 'user' || m.role === 'coach').map(m => ({ role: m.role === 'coach' ? 'assistant' : 'user', content: m.content }));
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory: chatHist.slice(0, -1), userMessage: msg, context: selectedContext, threadContext }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      const coachMsg: CoachMessage = { role: 'coach', content: data.reply, replies: data.replies || null, strategy: data.strategy || null };
      setCoachHistory(prev => [...prev, coachMsg]);
      if (data.strategy) {
        setStrategyData({ momentum: data.strategy.momentum || 'Unknown', balance: data.strategy.balance || 'Unknown', move: { energy: data.strategy.energy || 'match', one_liner: data.strategy.one_liner || '', constraints: { no_questions: !!data.strategy.no_questions, keep_short: !!data.strategy.keep_short, add_tease: false, push_meetup: false }, risk: 'medium' } });
      }
    } catch {
      setCoachHistory(prev => [...prev, { role: 'coach', content: "Couldn't reach the coach right now. Try again." }]);
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
        const fd = new FormData();
        fd.append('image', file);
        const r = await fetch('/api/extract-text', { method: 'POST', body: fd });
        const d = await r.json();
        return d.fullConversation || d.extracted_text || null;
      }));
      const extracted = results.filter(Boolean);
      if (extracted.length > 0) {
        const ctx = extracted.length === 1
          ? `Here's the conversation from a screenshot:\n${extracted[0]}`
          : `Here's context from ${extracted.length} screenshots:\n${extracted.map((t, i) => `[Screenshot ${i + 1}]\n${t}`).join('\n\n')}`;
        setCoachInput(prev => prev ? `${prev}\n${ctx}` : ctx);
        toast({ title: `📷 ${extracted.length} screenshot${extracted.length > 1 ? 's' : ''} read`, description: 'Send to get coaching' });
      } else {
        toast({ title: 'Could not read screenshot', description: 'Try a clearer image', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setCoachExtracting(false);
      if (coachFileInputRef.current) coachFileInputRef.current.value = '';
    }
  };

  // Use a Coach reply — add to thread and switch to thread view
  const handleUseCoachReply = (text: string, tone: string) => {
    const reply: Reply = { tone: tone as Reply['tone'], text };
    setReplies(prev => prev.length > 0 ? prev : [reply]);
    setPendingSent(reply);
    setAppView('thread');
    toast({ title: '✓ Reply selected', description: 'Confirm to add to thread' });
  };

  // ── Thread handlers ─────────────────────────────────────
  const handleGenerate = async () => {
    const msg = input.trim();
    if (!msg) return;
    if (!isPro && usageCount >= usageLimit) { setShowPaywall(true); return; }
    setLoading(true);
    setReplies([]);
    setDecodeResult(null);
    try {
      if (thread.length > 0 || appView === 'thread') {
        const newMsg: ThreadMessage = { role: 'them', text: msg, timestamp: Date.now() };
        setThread(prev => [...prev, newMsg]);
      }
      const threadCtx = [...thread, { role: 'them' as const, text: msg, timestamp: Date.now() }].map(m => `${m.role === 'you' ? 'You' : 'Them'}: ${m.text}`).join('\n');
      const endpoint = (isPro && useV2) ? '/api/generate-v2' : '/api/generate';
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: threadCtx, context: selectedContext, customContext: '' }) });
      const data = await res.json();
      if (!res.ok) { if (res.status === 429) { setShowPaywall(true); } throw new Error(data.error); }
      let newReplies: Reply[] = [];
      if (isPro && useV2 && data.shorter) {
        newReplies = [{ tone: 'shorter', text: data.shorter }, { tone: 'spicier', text: data.spicier }, { tone: 'softer', text: data.softer }];
        if (data.strategy) setStrategyData(data.strategy);
      } else if (Array.isArray(data.replies)) {
        newReplies = data.replies.filter((r: any) => r?.tone && r?.text);
      }
      setReplies(newReplies);
      setInput('');
      setAppView('thread');
      const uRes = await fetch('/api/usage');
      if (uRes.ok) { const u = await uRes.json(); setUsageCount(u.usageCount); }
    } catch { toast({ title: 'Generation failed', variant: 'destructive' }); } finally { setLoading(false); }
  };

  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
    setExtracting(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/extract-text', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const convoText = data.full_conversation || data.extracted_text;
      if (!convoText) throw new Error('No text extracted');
      const lines = convoText.split('\n').filter((l: string) => l.trim());
      const msgs: ThreadMessage[] = lines.map((line: string) => ({
        role: line.startsWith('You:') ? 'you' as const : 'them' as const,
        text: line.replace(/^(Them|You):\s*/, '').replace(/\s*\([^)]*\)\s*$/, '').trim(),
        timestamp: Date.now(),
      }));
      // Smart merge: if thread exists, find new messages only
      if (thread.length > 0) {
        const existing = thread.map(m => m.text.toLowerCase().trim());
        const newMsgs = msgs.filter(m => !existing.includes(m.text.toLowerCase().trim()));
        if (newMsgs.length > 0) {
          setThread(prev => [...prev, ...newMsgs]);
          toast({ title: `📷 ${newMsgs.length} new message${newMsgs.length > 1 ? 's' : ''} added` });
          const last = newMsgs[newMsgs.length - 1];
          if (last.role === 'them') setInput(last.text);
        } else {
          toast({ title: '📷 No new messages', description: 'Screenshot matches current thread' });
        }
      } else {
        setThread(msgs);
        setAppView('thread');
        const last = msgs[msgs.length - 1];
        if (last?.role === 'them') setInput(last.text);
        toast({ title: `📷 ${msgs.length} messages loaded` });
      }
    } catch { toast({ title: 'Scan failed', variant: 'destructive' }); } finally {
      setExtracting(false);
      setScreenshotPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDecode = async (text?: string, idx?: number) => {
    const target = text || input.trim();
    if (!target) return;
    if (idx !== undefined) setDecodingIdx(idx);
    setDecoding(true);
    try {
      const res = await fetch('/api/decode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: target, context: selectedContext }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (idx !== undefined) setInlineDecodes(prev => ({ ...prev, [idx]: data }));
      else setDecodeResult(data);
    } catch { toast({ title: 'Decode failed', variant: 'destructive' }); } finally { setDecoding(false); setDecodingIdx(null); }
  };

  const handleCopy = (reply: Reply) => {
    navigator.clipboard.writeText(reply.text);
    setCopied(reply.tone);
    setTimeout(() => setCopied(null), 2000);
    setPendingSent(reply);
  };

  const handleMarkSent = (reply: Reply) => {
    setThread(prev => [...prev, { role: 'you', text: reply.text, timestamp: Date.now() }]);
    setPendingSent(null);
    setReplies([]);
    setDecodeResult(null);
    setStrategyData(null);
    setInput('');
    toast({ title: '✓ Added to thread', description: 'Paste what they said back' });
  };

  const handleRefine = async (tone: string, text: string, instruction: string) => {
    setRefining(true);
    try {
      const res = await fetch('/api/refine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, instruction, context: selectedContext }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReplies(prev => prev.map(r => r.tone === tone ? { ...r, text: data.refined || data.text || r.text } : r));
      setEditingReply(null);
      setEditText('');
      toast({ title: '✓ Reply polished' });
    } catch { toast({ title: 'Polish failed', variant: 'destructive' }); } finally { setRefining(false); }
  };

  const handleRegenerate = async () => {
    if (thread.length === 0) return;
    setLoading(true);
    setReplies([]);
    try {
      const threadCtx = thread.map(m => `${m.role === 'you' ? 'You' : 'Them'}: ${m.text}`).join('\n');
      const endpoint = (isPro && useV2) ? '/api/generate-v2' : '/api/generate';
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: threadCtx, context: selectedContext }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      let newReplies: Reply[] = [];
      if (isPro && useV2 && data.shorter) {
        newReplies = [{ tone: 'shorter', text: data.shorter }, { tone: 'spicier', text: data.spicier }, { tone: 'softer', text: data.softer }];
        if (data.strategy) setStrategyData(data.strategy);
      } else if (Array.isArray(data.replies)) {
        newReplies = data.replies.filter((r: any) => r?.tone && r?.text);
      }
      setReplies(newReplies);
    } catch { toast({ title: 'Regeneration failed', variant: 'destructive' }); } finally { setLoading(false); }
  };

  // ── Thread management ───────────────────────────────────
  const handleLoadThread = async (saved: SavedThread) => {
    try {
      const res = await fetch(`/api/threads?id=${saved.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.thread?.messages) {
        setThread((data.thread.messages as any[]).map((m: any) => ({ role: m.role === 'you' ? 'you' as const : 'them' as const, text: m.text || '', timestamp: m.timestamp ? new Date(m.timestamp).getTime() : Date.now() })));
      }
      setActiveThreadId(saved.id);
      setActiveThreadName(saved.name);
      if (saved.context) setSelectedContext(saved.context);
      setReplies([]);
      setDecodeResult(null);
      setPendingSent(null);
      setInput('');
      setShowRecent(false);
      setAppView('thread');
      toast({ title: 'Thread loaded', description: saved.name });
    } catch { toast({ title: 'Failed to load thread', variant: 'destructive' }); }
  };

  const handleDeleteThread = async (id: string) => {
    try {
      await fetch(`/api/threads?id=${id}`, { method: 'DELETE' });
      setSavedThreads(prev => prev.filter(t => t.id !== id));
      if (activeThreadId === id) { setActiveThreadId(null); setActiveThreadName(null); setThread([]); }
      toast({ title: '✓ Deleted' });
    } catch { toast({ title: 'Delete failed', variant: 'destructive' }); }
  };

  const handleNewThread = () => {
    setThread([]);
    setReplies([]);
    setStrategyData(null);
    setDecodeResult(null);
    setPendingSent(null);
    setInput('');
    setActiveThreadId(null);
    setActiveThreadName(null);
    setShowRecent(false);
    setInlineDecodes({});
  };

  const handleCheckout = async (plan: 'weekly' | 'monthly' | 'annual') => {
    if (!userId) { window.location.href = `/login?redirect=/pricing&plan=${plan}`; return; }
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan, userId, userEmail }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast({ title: 'Checkout error', variant: 'destructive' });
    } catch { toast({ title: 'Checkout error', variant: 'destructive' }); }
  };

  // ── Paywall ──────────────────────────────────────────────
  if (showPaywall) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Glass className="max-w-md w-full p-8 text-center space-y-6" glow neonColor="violet">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center mx-auto">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white mb-2">Free limit reached</h2>
            <p className="text-white/50 text-sm">Unlock unlimited replies + Coach + full style control</p>
            <p className="text-white/25 text-xs mt-1">Resets in 24 hours</p>
          </div>
          <div className="space-y-3">
            <button onClick={() => handleCheckout('annual')} className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-black text-sm tracking-wider shadow-[0_4px_25px_rgba(139,92,246,0.4)] relative">
              <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Best Value</span>
              Unlock Pro — $99.99/year
            </button>
            <button onClick={() => handleCheckout('weekly')} className="w-full h-12 rounded-2xl border border-white/[0.12] text-white/60 font-bold text-sm hover:bg-white/[0.04] transition-all">$9.99/week</button>
            <p className="text-white/20 text-xs">Cancel anytime</p>
          </div>
          <button onClick={() => setShowPaywall(false)} className="text-white/25 text-sm hover:text-white/40 transition-colors">Wait for reset</button>
        </Glass>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/[0.06] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/[0.06] blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[40%] h-[40%] rounded-full bg-cyan-600/[0.04] blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      {/* Full-height flex layout */}
      <div className="relative z-10 h-screen flex flex-col md:flex-row">
        {/* ═══ LEFT: Main Panel ═══ */}
        <div className="flex-1 flex flex-col min-w-0 h-full">

          {/* ── Header ── */}
          <div className="shrink-0 px-4 md:px-6 py-3 flex items-center justify-between border-b border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(40px)' }}>
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 transition-all active:scale-90">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              {/* View toggle */}
              <div className="flex bg-white/[0.04] rounded-xl border border-white/[0.06] p-0.5">
                <button onClick={() => setAppView('coach')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-[0.15em] transition-all ${appView === 'coach' ? 'bg-violet-500/20 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.2)]' : 'text-white/30 hover:text-white/50'}`}>
                  COACH
                </button>
                <button onClick={() => setAppView('thread')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-[0.15em] transition-all ${appView === 'thread' ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.2)]' : 'text-white/30 hover:text-white/50'}`}>
                  THREAD
                </button>
              </div>
              {saving && <Loader2 className="h-3 w-3 animate-spin text-white/15" />}
            </div>
            <div className="flex items-center gap-2">
              {isPro && (
                <span className={`px-2 py-1 rounded-lg text-[8px] font-black tracking-[0.15em] border ${useV2 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-violet-500/10 text-violet-300 border-violet-500/20'}`}>
                  {useV2 ? 'V2' : 'V1'}
                </span>
              )}
              {!isPro && usageCount > 0 && (
                <span className="px-2 py-1 rounded-lg text-[8px] font-black tracking-[0.15em] bg-white/[0.04] text-white/30 border border-white/[0.06]">
                  {Math.max(0, usageLimit - usageCount)}/{usageLimit}
                </span>
              )}
              <button onClick={() => { setShowRecent(!showRecent); }} className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 transition-all active:scale-90 relative">
                <MessageCircle className="h-4 w-4" />
                {savedThreads.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">{savedThreads.length}</span>}
              </button>
              <button onClick={() => setIntelOpen(!intelOpen)} className="hidden md:flex w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] items-center justify-center text-white/40 hover:text-white/70 transition-all active:scale-90">
                {intelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </button>
              <Link href="/profile" className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 transition-all active:scale-90">
                <Crown className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* ── Saved threads dropdown ── */}
          <AnimatePresence>
            {showRecent && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="shrink-0 overflow-hidden border-b border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/30 text-[9px] font-mono font-bold tracking-[0.3em]">SAVED THREADS</span>
                    <button onClick={handleNewThread} className="text-[10px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"><Plus className="h-3 w-3" />NEW</button>
                  </div>
                  {savedThreads.length === 0 && <p className="text-white/20 text-xs text-center py-4">No saved threads yet</p>}
                  {savedThreads.map(t => (
                    <div key={t.id} className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer group ${activeThreadId === t.id ? 'bg-violet-500/10 border-violet-500/20' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'}`}>
                      <button onClick={() => handleLoadThread(t)} className="flex-1 text-left min-w-0">
                        <p className="text-white/70 text-xs font-semibold truncate">{t.name}</p>
                        <p className="text-white/25 text-[10px] mt-0.5">{t.message_count} msgs</p>
                      </button>
                      <button onClick={() => handleDeleteThread(t.id)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 transition-all"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Trial banner ── */}
          {isPro && trialDaysLeft !== null && trialDaysLeft <= 3 && (
            <div className={`shrink-0 mx-4 mt-3 p-3 rounded-xl border flex items-center justify-between text-xs ${trialDaysLeft <= 1 ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'}`}>
              <span className="font-bold">{trialDaysLeft <= 0 ? 'Trial expires today!' : `${trialDaysLeft} day${trialDaysLeft > 1 ? 's' : ''} left`}</span>
              <Link href="/pricing" className="font-black text-[10px] tracking-wider bg-white/[0.08] px-3 py-1 rounded-lg hover:bg-white/[0.12] transition-all">KEEP PRO</Link>
            </div>
          )}

          {/* ═══ COACH VIEW ═══ */}
          {appView === 'coach' && (
            <>
              {/* Coach chat scroll area */}
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
                {/* Empty state */}
                {coachHistory.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-5 py-12">
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center">
                      <MessageCircle className="h-6 w-6 text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-white/80 text-base font-bold mb-1">Ask your coach</h2>
                      <p className="text-white/25 text-sm max-w-xs">Paste a conversation, upload a screenshot, or ask anything about your situation.</p>
                      <p className="text-[10px] text-white/15 mt-2">Thread context always in background</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {[
                        'Read this convo',
                        'What should I say?',
                        'Decode their message',
                        'Write me an opener',
                        'Revive a dead chat',
                      ].map(chip => (
                        <button key={chip} onClick={() => setCoachInput(chip)} className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/35 text-[11px] font-medium hover:bg-white/[0.08] hover:text-white/60 transition-all active:scale-95">
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coach messages */}
                {coachHistory.map((msg, idx) => (
                  <div key={idx} className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] flex flex-col gap-1.5`}>
                      <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-br-md'
                          : 'bg-white/[0.07] text-white/85 border border-white/[0.06] rounded-bl-md'
                      }`}>
                        <p className="font-medium whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      {/* Strategy badges */}
                      {msg.role === 'coach' && msg.strategy && (
                        <div className="flex flex-wrap gap-1.5 px-1">
                          {msg.strategy.momentum && (
                            <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                              msg.strategy.momentum === 'Rising' ? 'bg-emerald-500/15 text-emerald-400' :
                              msg.strategy.momentum === 'Declining' || msg.strategy.momentum === 'Stalling' ? 'bg-red-500/15 text-red-400' :
                              'bg-white/[0.08] text-white/50'
                            }`}>
                              {msg.strategy.momentum === 'Rising' ? <TrendingUp className="h-3 w-3" /> :
                               msg.strategy.momentum === 'Declining' || msg.strategy.momentum === 'Stalling' ? <TrendingDown className="h-3 w-3" /> : null}
                              {msg.strategy.momentum}
                            </span>
                          )}
                          {msg.strategy.balance && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/[0.08] text-white/50">{msg.strategy.balance}</span>}
                          {msg.strategy.energy && (
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                              msg.strategy.energy === 'pull_back' ? 'bg-orange-500/15 text-orange-400' :
                              msg.strategy.energy === 'escalate' ? 'bg-emerald-500/15 text-emerald-400' :
                              'bg-violet-500/15 text-violet-300'
                            }`}>
                              {msg.strategy.energy.replace('_', ' ')}
                            </span>
                          )}
                          {msg.strategy.no_questions && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/[0.06] text-white/35">no questions</span>}
                          {msg.strategy.keep_short && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/[0.06] text-white/35">keep short</span>}
                        </div>
                      )}

                      {/* Coach draft replies */}
                      {msg.role === 'coach' && msg.replies && (msg.replies.shorter || msg.replies.spicier || msg.replies.softer) && (
                        <div className="w-full space-y-1.5 mt-1">
                          <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-wider px-1">Coach draft</p>
                          {msg.replies.shorter && (
                            <button
                              onClick={() => handleUseCoachReply(msg.replies!.shorter!, 'shorter')}
                              className="w-full text-left px-3.5 py-2.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 text-white/80 text-[13px] font-medium hover:bg-emerald-500/[0.14] transition-all active:scale-[0.98] group"
                            >
                              <span className="text-[10px] text-emerald-400/60 font-bold block mb-0.5">Shorter</span>
                              {msg.replies.shorter}
                              <span className="text-[10px] text-white/20 group-hover:text-white/40 ml-2 transition-colors">tap to use</span>
                            </button>
                          )}
                          {msg.replies.spicier && (
                            <button
                              onClick={() => handleUseCoachReply(msg.replies!.spicier!, 'spicier')}
                              className="w-full text-left px-3.5 py-2.5 rounded-xl bg-orange-500/[0.08] border border-orange-500/20 text-white/80 text-[13px] font-medium hover:bg-orange-500/[0.14] transition-all active:scale-[0.98] group"
                            >
                              <span className="text-[10px] text-orange-400/60 font-bold block mb-0.5">Spicier</span>
                              {msg.replies.spicier}
                              <span className="text-[10px] text-white/20 group-hover:text-white/40 ml-2 transition-colors">tap to use</span>
                            </button>
                          )}
                          {msg.replies.softer && (
                            <button
                              onClick={() => handleUseCoachReply(msg.replies!.softer!, 'softer')}
                              className="w-full text-left px-3.5 py-2.5 rounded-xl bg-blue-500/[0.08] border border-blue-500/20 text-white/80 text-[13px] font-medium hover:bg-blue-500/[0.14] transition-all active:scale-[0.98] group"
                            >
                              <span className="text-[10px] text-blue-400/60 font-bold block mb-0.5">Softer</span>
                              {msg.replies.softer}
                              <span className="text-[10px] text-white/20 group-hover:text-white/40 ml-2 transition-colors">tap to use</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Coach typing indicator */}
                {coachLoading && (
                  <div className="mb-3 flex justify-start">
                    <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-white/[0.07] border border-white/[0.06] flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
                      <span className="text-[12px] text-white/40 font-medium">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={coachEndRef} />
              </div>

              {/* Coach input bar */}
              <div className="shrink-0 px-3 py-3 border-t border-white/[0.06]">
                <input ref={coachFileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple onChange={handleCoachScreenshot} className="hidden" />
                {coachExtracting && (
                  <div className="mb-2 flex items-center gap-2 text-xs text-violet-300/60">
                    <Loader2 className="h-3 w-3 animate-spin" /> Reading screenshot...
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => coachFileInputRef.current?.click()}
                    disabled={coachExtracting || coachLoading}
                    className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.10] flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.10] transition-all active:scale-95 disabled:opacity-30 shrink-0"
                    title="Upload screenshot for context"
                  >
                    {coachExtracting ? <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" /> : <Camera className="h-3.5 w-3.5" />}
                  </button>
                  <input
                    type="text"
                    value={coachInput}
                    onChange={(e) => setCoachInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCoachSend(); } }}
                    placeholder="Ask anything or add context..."
                    maxLength={500}
                    disabled={coachLoading || coachExtracting}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/80 placeholder-white/20 text-[13px] focus:outline-none focus:border-violet-500/30 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={handleCoachSend}
                    disabled={!coachInput.trim() || coachLoading}
                    className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 hover:bg-violet-500/30 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ═══ THREAD VIEW ═══ */}
          {appView === 'thread' && (
            <>
              {/* Thread scroll area */}
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
                {/* Thread name */}
                {activeThreadName && (
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-white/40 text-xs font-bold truncate">{activeThreadName}</span>
                    {thread.length > 0 && <span className="text-white/15 text-[10px] font-mono">{thread.length} msgs</span>}
                  </div>
                )}

                {/* Empty thread state */}
                {thread.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                      <MessageCircle className="h-7 w-7 text-white/20" />
                    </div>
                    <div>
                      <p className="text-white/50 text-sm font-semibold">Paste their message below</p>
                      <p className="text-white/20 text-xs mt-1">or upload a screenshot to load the thread</p>
                    </div>
                  </div>
                )}

                {/* Thread messages */}
                {thread.map((msg, idx) => (
                  <div key={idx} className={`mb-3 flex ${msg.role === 'you' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] group`}>
                      <div className={`px-4 py-2.5 rounded-2xl ${msg.role === 'you' ? 'rounded-br-md bg-violet-500/20 border border-violet-500/15' : 'rounded-bl-md bg-white/[0.06] border border-white/[0.08]'}`}>
                        <p className="text-white/85 text-[14px] font-medium leading-relaxed">{msg.text}</p>
                      </div>
                      {/* Inline actions for "them" messages */}
                      {msg.role === 'them' && (
                        <div className="flex items-center gap-1 mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleDecode(msg.text, idx)} disabled={decoding && decodingIdx === idx} className="text-[9px] font-bold text-amber-400/50 hover:text-amber-400 flex items-center gap-1 transition-colors">
                            {decoding && decodingIdx === idx ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Brain className="h-2.5 w-2.5" />} DECODE
                          </button>
                          <button onClick={() => { setThread(prev => prev.filter((_, i) => i !== idx)); toast({ title: '✓ Removed' }); }} className="text-[9px] font-bold text-white/20 hover:text-red-400 flex items-center gap-1 transition-colors ml-2">
                            <Trash2 className="h-2.5 w-2.5" /> DEL
                          </button>
                        </div>
                      )}
                      {msg.role === 'you' && (
                        <div className="flex items-center gap-1 mt-1 mr-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setThread(prev => prev.filter((_, i) => i !== idx)); toast({ title: '✓ Removed' }); }} className="text-[9px] font-bold text-white/20 hover:text-red-400 flex items-center gap-1 transition-colors">
                            <Trash2 className="h-2.5 w-2.5" /> DEL
                          </button>
                        </div>
                      )}
                      {/* Inline decode result */}
                      {inlineDecodes[idx] && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                          <Glass className="p-3 space-y-1.5" glow neonColor="amber">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-400/50 text-[8px] font-mono font-bold tracking-[0.3em]">DECODE</span>
                              {inlineDecodes[idx]!.energy && <span className="text-[9px]">{ENERGY_CONFIG[inlineDecodes[idx]!.energy]?.emoji || '🔍'}</span>}
                            </div>
                            <p className="text-white/80 text-xs font-medium">{inlineDecodes[idx]!.intent}</p>
                            <p className="text-white/40 text-[11px] italic">{inlineDecodes[idx]!.subtext}</p>
                            {inlineDecodes[idx]!.flags.length > 0 && (
                              <div className="flex flex-wrap gap-1">{inlineDecodes[idx]!.flags.map((f, fi) => (<span key={fi} className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${f.type === 'green' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15' : f.type === 'red' ? 'text-red-400 bg-red-500/10 border-red-500/15' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/15'}`}>{f.text}</span>))}</div>
                            )}
                            <p className="text-violet-300/50 text-[10px] flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" />{inlineDecodes[idx]!.coach_tip}</p>
                          </Glass>
                        </motion.div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Reply deck */}
                <AnimatePresence>
                  {replies.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="mt-5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-white/20 text-[9px] font-mono font-bold tracking-[0.4em]">SELECT REPLY</p>
                        <button onClick={handleRegenerate} disabled={loading} className="text-[9px] font-bold text-white/25 hover:text-white/50 flex items-center gap-1 transition-colors">
                          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> REFRESH
                        </button>
                      </div>
                      {replies.map((reply, idx) => {
                        const config = TONE_CONFIG[reply.tone];
                        if (!config) return null;
                        const isCopied = copied === reply.tone;
                        const outcome = simulatedOutcomes[reply.tone];
                        const isBest = !!outcome && outcome.confidence === bestOutcome;
                        return (
                          <motion.div key={reply.tone} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
                            <button onClick={() => handleCopy(reply)} className="w-full text-left group active:scale-[0.98] transition-transform">
                              <Glass className={`p-4 transition-all ${isCopied ? 'border-emerald-500/25' : isBest ? 'border-violet-500/20' : ''}`} glow={isBest || isCopied} neonColor={isCopied ? 'emerald' : config.neon}>
                                <div className="flex items-start gap-3">
                                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shrink-0`} style={{ boxShadow: config.glow }}>
                                    <span className="text-sm">{config.emoji}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className="text-[9px] font-black tracking-[0.15em] text-white/40">{config.label}</span>
                                      {outcome && (<span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${outcome.confidence >= 75 ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/15' : outcome.confidence >= 60 ? 'text-amber-300 bg-amber-500/10 border-amber-500/15' : 'text-rose-300 bg-rose-500/10 border-rose-500/15'}`}>{outcome.confidence}%</span>)}
                                      {isBest && <span className="text-[8px] font-black tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/15 px-1.5 py-0.5 rounded-md">BEST</span>}
                                      <span className={`ml-auto text-[10px] font-bold flex items-center gap-1 transition-all ${isCopied ? 'text-emerald-400' : 'text-transparent group-hover:text-white/25'}`}>{isCopied ? <><Check className="h-3 w-3" /> COPIED</> : <Copy className="h-3 w-3" />}</span>
                                    </div>
                                    {/* Edit mode */}
                                    {editingReply === reply.tone ? (
                                      <div className="space-y-2" onClick={e => e.stopPropagation()}>
                                        <textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full bg-white/[0.06] border border-white/[0.12] rounded-xl px-3 py-2 text-white/90 text-sm resize-none focus:outline-none focus:border-violet-500/30" rows={2} />
                                        <div className="flex gap-1.5">
                                          <button onClick={() => handleRefine(reply.tone, reply.text, editText)} disabled={refining} className="px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 text-[10px] font-bold border border-violet-500/20 hover:bg-violet-500/30 transition-all disabled:opacity-40">
                                            {refining ? <Loader2 className="h-3 w-3 animate-spin" /> : 'POLISH'}
                                          </button>
                                          <button onClick={() => { setEditingReply(null); setEditText(''); }} className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-white/30 text-[10px] font-bold border border-white/[0.06]">CANCEL</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-white/90 text-[14px] font-medium leading-relaxed">{reply.text}</p>
                                    )}
                                    {outcome && <p className="mt-1.5 text-[10px] text-white/20 font-mono">{outcome.branch}</p>}
                                  </div>
                                </div>
                              </Glass>
                            </button>
                            {/* Edit button */}
                            {editingReply !== reply.tone && (
                              <div className="flex justify-end mt-1 mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); setEditingReply(reply.tone); setEditText('Make it more '); }} className="text-[9px] font-bold text-white/20 hover:text-violet-400 flex items-center gap-1 transition-colors"><Pencil className="h-2.5 w-2.5" /> EDIT</button>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Confirm send */}
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
                          <button onClick={() => setPendingSent(null)} className="h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/30 font-bold text-xs hover:text-white/50 transition-all">SKIP</button>
                        </div>
                      </Glass>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={threadEndRef} />
              </div>

              {/* Thread input bar */}
              <div className="shrink-0 px-4 md:px-6 py-3 border-t border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(40px)' }}>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleScreenshot} className="hidden" />
                {screenshotPreview && (
                  <div className="mb-2 relative rounded-xl overflow-hidden border border-white/10 max-h-20">
                    <img src={screenshotPreview} alt="" className="w-full max-h-20 object-cover opacity-50" />
                    {extracting && <div className="absolute inset-0 bg-black/70 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-violet-400" /></div>}
                  </div>
                )}
                <div className="flex items-end gap-2.5">
                  <div className="flex-1 rounded-2xl border border-white/[0.08] focus-within:border-cyan-500/30 focus-within:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={thread.length === 0 ? 'Paste what they said...' : 'Their reply...'} rows={1}
                      className="w-full bg-transparent text-white placeholder-white/20 resize-none focus:outline-none text-sm font-medium leading-relaxed px-4 py-3 max-h-32"
                      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                      onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 128) + 'px'; }} />
                  </div>
                  <div className="flex items-center gap-1.5 pb-0.5">
                    <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/25 hover:text-white/50 hover:border-white/[0.12] transition-all active:scale-90"><Camera className="h-4 w-4" /></button>
                    <button onClick={() => handleDecode()} disabled={decoding || !input.trim()} className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300/80 hover:bg-amber-500/20 transition-all active:scale-90 disabled:opacity-15">
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
                  {mobileSheet ? 'HIDE INTEL' : `HP ${tactical.healthScore} · RISK ${tactical.riskLevel.toUpperCase()}`}
                  <ChevronUp className={`h-3 w-3 transition-transform ${mobileSheet ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Mobile sheet */}
              <AnimatePresence>
                {mobileSheet && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="md:hidden overflow-hidden shrink-0 border-t border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(40px)' }}>
                    <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
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
            </>
          )}
        </div>

        {/* ═══ RIGHT: Intel Sidebar (desktop) ═══ */}
        <AnimatePresence>
          {intelOpen && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 340, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="hidden md:block h-full overflow-hidden border-l border-white/[0.06]">
              <div className="w-[340px] h-full overflow-y-auto p-5 space-y-5" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(40px) saturate(180%)' }}>

                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-[0.15em] border ${isPro ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-violet-500/10 text-violet-300 border-violet-500/20'}`}>{isPro ? 'PRO' : 'FREE'}</span>
                  <span className="text-white/20 text-[8px] font-mono font-bold tracking-[0.5em]">INTEL</span>
                </div>

                {/* Health Ring */}
                <div className="flex flex-col items-center py-2">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 128 128" className="w-full h-full">
                      <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                      <circle cx="64" cy="64" r="45" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                      <motion.circle cx="64" cy="64" r="54" fill="none" strokeWidth="4" strokeLinecap="round" stroke={pulseColor}
                        initial={{ strokeDasharray: '0 339.3' }}
                        animate={{ strokeDasharray: `${healthPct * 339.3} 339.3` }}
                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                        transform="rotate(-90 64 64)" style={{ filter: `drop-shadow(0 0 10px ${pulseColor}90)` }} />
                      <motion.circle cx="64" cy="64" r="45" fill="none" strokeWidth="3" strokeLinecap="round" stroke="rgba(139,92,246,0.4)"
                        initial={{ strokeDasharray: '0 282.7' }}
                        animate={{ strokeDasharray: `${recipPct * 282.7} 282.7` }}
                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                        transform="rotate(-90 64 64)" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-white/90 text-3xl font-black">{tactical.healthScore}</span>
                      <span className="text-white/20 text-[7px] font-mono font-bold tracking-[0.4em]">HEALTH</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {tactical.momentum === 'theirs' ? <TrendingUp className="h-3 w-3 text-emerald-400" /> : tactical.momentum === 'yours' ? <TrendingDown className="h-3 w-3 text-rose-400" /> : <Gauge className="h-3 w-3 text-violet-400" />}
                    <span className="text-white/40 text-xs font-semibold">{tactical.momentum === 'theirs' ? 'Their lead' : tactical.momentum === 'yours' ? 'You\u2019re chasing' : 'Balanced'}</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'RISK', value: tactical.riskScore, color: tactical.riskLevel === 'high' ? 'text-rose-400' : tactical.riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400' },
                    { label: 'BALANCE', value: `${tactical.reciprocity}%`, color: 'text-violet-300' },
                    { label: 'THEM', value: tactical.themCount, color: 'text-white/60' },
                    { label: 'YOU', value: tactical.youCount, color: 'text-white/60' },
                  ].map(s => (
                    <Glass key={s.label} className="p-3 text-center">
                      <p className="text-white/25 text-[7px] font-mono font-bold tracking-[0.4em]">{s.label}</p>
                      <p className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</p>
                    </Glass>
                  ))}
                </div>

                {/* Timing */}
                <Glass className="p-3 flex items-center gap-3" glow neonColor="cyan">
                  <Clock className="h-4 w-4 text-cyan-400/50 shrink-0" />
                  <div><p className="text-cyan-300/70 text-xs font-bold">Wait {tactical.waitWindow}</p><p className="text-white/20 text-[9px] mt-0.5 font-mono">REDUCES CHASE</p></div>
                </Glass>

                {/* Risk guardrail */}
                <Glass className="p-3" glow neonColor={riskNeon}>
                  <p className={`text-xs font-bold ${tactical.riskLevel === 'high' ? 'text-rose-400' : tactical.riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {tactical.riskLevel === 'high' ? '\u26D4 DO NOT DOUBLE-TEXT' : tactical.riskLevel === 'medium' ? '\u26A0\uFE0F KEEP SHORT, NO PRESSURE' : '\u2705 SAFE TO ADVANCE'}
                  </p>
                </Glass>

                {/* Strategy */}
                {strategyData && (
                  <Glass className="p-4 space-y-2" glow neonColor="emerald">
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
                  <p className="text-white/25 text-[8px] font-mono font-bold tracking-[0.5em] mb-2.5">CONTEXT</p>
                  <div className="flex flex-wrap gap-2">
                    {CONTEXT_OPTIONS.map(ctx => (
                      <motion.button key={ctx.value} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => setSelectedContext(ctx.value)} title={ctx.label}
                        className={`w-10 h-10 rounded-xl text-base flex items-center justify-center transition-all border ${selectedContext === ctx.value ? 'bg-white/[0.10] border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.25)]' : 'bg-white/[0.04] border-white/[0.08] hover:border-white/[0.15]'}`}
                      >{ctx.emoji}</motion.button>
                    ))}
                  </div>
                </div>

                {/* Goal */}
                <div>
                  <p className="text-white/25 text-[8px] font-mono font-bold tracking-[0.5em] mb-2.5">MISSION</p>
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
    </div>
  );
}
