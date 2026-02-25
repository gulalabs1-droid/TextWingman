'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft, Camera, Send, Sparkles, Loader2, Copy, Check,
  Target, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  Trophy, Shield, Zap, Heart, MessageCircle, Brain, X,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────
type Goal = 'set_date' | 'tease' | 'recover' | 'support' | 'de_escalate' | 'general';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  // Orchestration results (only on assistant messages from full pipeline)
  orchestration?: OrchestrateResult | null;
  // Simple drafts (from coaching mode)
  draft?: { shorter?: string; spicier?: string; softer?: string } | null;
};

type CandidateScores = {
  neediness_risk: number;
  clarity: number;
  forward_motion: number;
  tone_match: number;
  one_breath: boolean;
};

type Candidate = {
  text: string;
  style: string;
  word_count: number;
  scores: CandidateScores;
  notes: string;
};

type OrchestrateResult = {
  mode: 'orchestrate';
  winner: Candidate | null;
  backup: Candidate | null;
  winner_id: number;
  backup_id: number;
  winner_reason: string;
  candidates: Candidate[];
  context_extraction: {
    her_tone: string;
    topic: string;
    open_questions: string[];
    must_acknowledge: string[];
    goal_detected: string;
  };
  strategy: {
    momentum: string;
    balance: string;
    energy_level?: string;
    sarcasm_detected?: boolean;
    is_kidding?: boolean;
    risk_flags?: string[];
    move: {
      energy: string;
      one_liner: string;
      constraints: Record<string, boolean>;
      risk: string;
    };
  };
  latency: {
    total: number;
    strategy: number;
    generation: number;
    critic: number;
  };
};

// ── Constants ────────────────────────────────────────────
const GOALS: { value: Goal; label: string; emoji: string; sub: string }[] = [
  { value: 'general', label: 'General', emoji: '💬', sub: 'Coach me through this' },
  { value: 'set_date', label: 'Set a date', emoji: '📅', sub: 'Lock in plans' },
  { value: 'tease', label: 'Tease / flirt', emoji: '🔥', sub: 'Build tension' },
  { value: 'recover', label: 'Recover', emoji: '🔄', sub: 'Fix a fumble' },
  { value: 'support', label: 'Support', emoji: '💚', sub: 'Be there for them' },
  { value: 'de_escalate', label: 'De-escalate', emoji: '🕊️', sub: 'Cool things down' },
];

const STYLE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  hood_charisma: { label: 'Hood Charisma', emoji: '👑', color: 'text-amber-400 bg-amber-500/15' },
  clean_direct: { label: 'Clean Direct', emoji: '🎯', color: 'text-blue-400 bg-blue-500/15' },
  playful_tease: { label: 'Playful Tease', emoji: '😏', color: 'text-pink-400 bg-pink-500/15' },
  bold_closer: { label: 'Bold Closer', emoji: '⚡', color: 'text-orange-400 bg-orange-500/15' },
  warm_genuine: { label: 'Warm Genuine', emoji: '💚', color: 'text-emerald-400 bg-emerald-500/15' },
  chill_unbothered: { label: 'Chill', emoji: '🧊', color: 'text-cyan-400 bg-cyan-500/15' },
};

const SMART_PLACEHOLDERS = [
  'Paste their message or drop a screenshot...',
  'What did they say?',
  'Ask me anything about your situation...',
  'Paste the convo and I\'ll read it...',
  'Upload a screenshot for instant analysis...',
];

// ── Component ────────────────────────────────────────────
export default function X2Page() {
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [goal, setGoal] = useState<Goal>('general');
  const [context, setContext] = useState('crush');
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [expandedTrace, setExpandedTrace] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % SMART_PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // ── Send message ───────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setChatHistory((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/x2/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userMsg,
          threadText: userMsg, // If it contains You:/Them: it'll auto-orchestrate
          chatHistory: chatHistory.map((m) => ({ role: m.role, content: m.content })),
          goal,
          relationshipContext: context,
          mode: 'chat',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      if (data.mode === 'orchestrate') {
        setChatHistory((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Here's my read and your best options:`,
            orchestration: data,
          },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply, draft: data.draft },
        ]);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setChatHistory((prev) => prev.slice(0, -1));
      setInput(userMsg);
    } finally {
      setLoading(false);
    }
  };

  // ── Screenshot upload ──────────────────────────────────
  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setExtracting(true);

    try {
      const fileData = await Promise.all(
        files.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );

      // Show images in chat immediately
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'user',
          content: files.length === 1 ? '📸 Screenshot uploaded' : `📸 ${files.length} screenshots uploaded`,
          images: fileData,
        },
      ]);

      // Extract text from screenshots
      const results = await Promise.all(
        fileData.map(async (base64) => {
          const res = await fetch('/api/extract-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }),
          });
          const data = await res.json();
          return data.full_conversation || null;
        })
      );
      const extracted = results.filter(Boolean);

      if (extracted.length > 0) {
        setLoading(true);
        const threadText = extracted.join('\n\n');

        try {
          const res = await fetch('/api/x2/orchestrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userMessage: `Analyze this conversation from the screenshot`,
              threadText,
              chatHistory: chatHistory.map((m) => ({ role: m.role, content: m.content })),
              goal,
              relationshipContext: context,
              mode: 'orchestrate',
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed');

          if (data.mode === 'orchestrate') {
            setChatHistory((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: `Analyzed the screenshot. Here's my read:`,
                orchestration: data,
              },
            ]);
          } else {
            setChatHistory((prev) => [
              ...prev,
              { role: 'assistant', content: data.reply, draft: data.draft },
            ]);
          }
        } catch {
          setChatHistory((prev) => [
            ...prev,
            { role: 'assistant', content: "Couldn't analyze the screenshot. Try again." },
          ]);
        } finally {
          setLoading(false);
        }
      } else {
        toast({ title: 'Could not read screenshot', description: 'Try a clearer image', variant: 'destructive' });
        setChatHistory((prev) => prev.slice(0, -1));
      }
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Copy helper ────────────────────────────────────────
  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: '✅ Copied' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Score bar component ────────────────────────────────
  const ScoreBar = ({ label, value, inverted = false }: { label: string; value: number; inverted?: boolean }) => {
    const displayValue = inverted ? 100 - value : value;
    const color =
      displayValue >= 80 ? 'bg-emerald-500' : displayValue >= 60 ? 'bg-amber-500' : 'bg-red-500';
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-white/40 w-20 shrink-0">{label}</span>
        <div className="flex-1 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${displayValue}%` }} />
        </div>
        <span className="text-[10px] text-white/50 w-8 text-right">{value}</span>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-[#0a0a0f] text-white flex flex-col px-4 pt-4 pb-[env(safe-area-inset-bottom,0px)]">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        multiple
        onChange={handleScreenshotUpload}
        className="hidden"
      />

      {/* ── Contained card — Apple iMessage pattern ── */}
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col rounded-3xl bg-white/[0.04] border border-white/[0.08] overflow-hidden" style={{ height: 'calc(100dvh - 2rem)' }}>

        {/* ─ Header — compact, inside card ─ */}
        <div className="shrink-0 pt-5 pb-3 px-6 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-500/30">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              Text God
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 uppercase tracking-widest">Lab</span>
            </h2>
            <Link href="/app" className="text-[10px] text-white/25 hover:text-white/50 transition-colors">← Back</Link>
          </div>
          <p className="text-sm text-white/40 mb-3">Drop a screenshot, paste a convo, or ask anything</p>

          {/* Goal + context — compact inline pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {GOALS.map((g) => (
              <button
                key={g.value}
                onClick={() => setGoal(g.value)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  goal === g.value
                    ? 'bg-amber-500/15 text-amber-400 shadow-sm shadow-amber-500/10'
                    : 'bg-white/[0.04] text-white/25 hover:text-white/50 hover:bg-white/[0.08]'
                }`}
              >
                <span className="mr-0.5">{g.emoji}</span> {g.label}
              </button>
            ))}
            <div className="w-px h-4 bg-white/[0.08] mx-1" />
            {['crush', 'ex', 'partner', 'friend', 'situationship'].map((c) => (
              <button
                key={c}
                onClick={() => setContext(c)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  context === c
                    ? 'bg-white/[0.12] text-white/70'
                    : 'bg-white/[0.04] text-white/20 hover:text-white/40'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ─ Scrollable content — chips OR chat history ─ */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {/* Empty state */}
          {chatHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="space-y-3 w-full max-w-sm">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { emoji: '💬', label: "What'd they say?", sub: 'Craft the perfect reply', prompt: '', glow: true, action: () => textareaRef.current?.focus() },
                    { emoji: '🔍', label: 'Decode this', sub: 'Read between the lines', prompt: 'Decode their message for me: ', glow: false, action: () => setInput('Decode their message for me: ') },
                    { emoji: '📸', label: 'Screenshot', sub: 'Full pipeline analysis', prompt: '', glow: false, action: () => fileInputRef.current?.click() },
                    { emoji: '�', label: 'Flirty opener', sub: 'Start the convo strong', prompt: 'Write me a great opener', glow: false, action: () => setInput('Write me a great opener for someone I just matched with') },
                    { emoji: '🎯', label: 'Am I being played?', sub: 'Get an honest read', prompt: '', glow: false, action: () => setInput('Am I being played or are they genuinely interested?') },
                    { emoji: '�', label: 'Read the situation', sub: 'Full vibe analysis', prompt: '', glow: false, action: () => setInput('Read this convo and tell me where I stand') },
                  ].map(chip => (
                    <button
                      key={chip.label}
                      onClick={chip.action}
                      className={`px-3 py-2.5 rounded-xl text-left transition-all active:scale-95 border ${
                        chip.glow
                          ? 'bg-amber-500/[0.08] border-amber-500/20 hover:bg-amber-500/[0.15] hover:border-amber-500/35 shadow-sm shadow-amber-500/5'
                          : 'bg-white/[0.05] border-white/[0.10] hover:bg-white/[0.10]'
                      }`}
                    >
                      <p className="text-[12px] font-semibold text-white/70 leading-snug">
                        <span className="mr-1">{chip.emoji}</span>{chip.label}
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5 leading-tight">{chip.sub}</p>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-white/15 text-center">Multi-agent pipeline &bull; 6 styles &bull; Verified &amp; scored</p>
              </div>
            </div>
          )}

        {/* Chat messages */}
        {chatHistory.map((msg, i) => (
          <div key={i} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {/* Image thumbnails */}
              {msg.images && msg.images.length > 0 && (
                <div className="flex gap-2 flex-wrap justify-end">
                  {msg.images.map((img, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden border border-white/[0.12] shadow-lg shadow-black/30 max-w-[160px]">
                      <img src={img} alt={`Screenshot ${idx + 1}`} className="w-full h-auto max-h-[200px] object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Message bubble */}
              <div
                className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-amber-600 to-orange-600 text-white rounded-br-md shadow-md shadow-amber-500/20'
                    : 'bg-white/[0.07] text-white/90 border border-white/[0.08] rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>

              {/* ── Orchestration results (full pipeline) ── */}
              {msg.orchestration && (() => {
                const orch = msg.orchestration;
                const isExpanded = expandedTrace === i;
                return (
                  <div className="w-full space-y-2">
                    {/* Strategy one-liner */}
                    <div className="flex flex-wrap gap-1.5 px-1">
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        orch.strategy.momentum === 'Rising' ? 'bg-emerald-500/15 text-emerald-400' :
                        orch.strategy.momentum === 'Declining' || orch.strategy.momentum === 'Stalling' ? 'bg-red-500/15 text-red-400' :
                        'bg-white/[0.08] text-white/50'
                      }`}>
                        {orch.strategy.momentum === 'Rising' ? <TrendingUp className="h-2.5 w-2.5" /> : orch.strategy.momentum === 'Declining' || orch.strategy.momentum === 'Stalling' ? <TrendingDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                        {orch.strategy.momentum}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/[0.08] text-white/50">{orch.strategy.balance}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        orch.strategy.move.energy === 'pull_back' ? 'bg-orange-500/15 text-orange-400' :
                        orch.strategy.move.energy === 'escalate' ? 'bg-emerald-500/15 text-emerald-400' :
                        'bg-violet-500/15 text-violet-300'
                      }`}>{orch.strategy.move.energy.replace('_', ' ')}</span>
                      {orch.strategy.move.risk === 'high' && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400">⚠ high risk</span>
                      )}
                    </div>

                    {/* Strategy one-liner */}
                    <p className="text-[12px] text-white/50 italic px-1">&ldquo;{orch.strategy.move.one_liner}&rdquo;</p>

                    {/* Winner card */}
                    {orch.winner && (
                      <div className="relative">
                        <div className="absolute -top-1.5 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 z-10">
                          <Trophy className="h-2.5 w-2.5 text-amber-400" />
                          <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Winner</span>
                        </div>
                        <button
                          onClick={() => copyText(orch.winner!.text, `winner-${i}`)}
                          className="w-full text-left mt-1 px-4 pt-5 pb-3 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 hover:bg-amber-500/[0.12] hover:border-amber-500/35 transition-all active:scale-[0.98] group"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STYLE_CONFIG[orch.winner.style]?.color || 'bg-white/10 text-white/50'}`}>
                              {STYLE_CONFIG[orch.winner.style]?.emoji} {STYLE_CONFIG[orch.winner.style]?.label || orch.winner.style}
                            </span>
                            <span className="text-[10px] text-amber-400/50 group-hover:text-amber-400 transition-colors">
                              {copiedId === `winner-${i}` ? <Check className="h-3 w-3" /> : 'Copy →'}
                            </span>
                          </div>
                          <p className="text-[14px] text-white/90 font-medium">{orch.winner.text}</p>
                          {orch.winner_reason && (
                            <p className="text-[10px] text-amber-400/40 mt-1.5">💡 {orch.winner_reason}</p>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Backup card */}
                    {orch.backup && orch.backup.text !== orch.winner?.text && (
                      <button
                        onClick={() => copyText(orch.backup!.text, `backup-${i}`)}
                        className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-all active:scale-[0.98] group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Backup</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STYLE_CONFIG[orch.backup.style]?.color || 'bg-white/10 text-white/50'}`}>
                              {STYLE_CONFIG[orch.backup.style]?.emoji} {STYLE_CONFIG[orch.backup.style]?.label || orch.backup.style}
                            </span>
                          </div>
                          <span className="text-[10px] text-white/30 group-hover:text-white/60 transition-colors">
                            {copiedId === `backup-${i}` ? <Check className="h-3 w-3" /> : 'Copy →'}
                          </span>
                        </div>
                        <p className="text-[13px] text-white/70">{orch.backup.text}</p>
                      </button>
                    )}

                    {/* Expand/collapse trace */}
                    <button
                      onClick={() => setExpandedTrace(isExpanded ? null : i)}
                      className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-white/25 hover:text-white/50 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {isExpanded ? 'Hide' : 'Show'} all {orch.candidates?.length || 0} candidates + scores
                      <span className="text-white/15 ml-1">{orch.latency.total}ms</span>
                    </button>

                    {/* Expanded trace panel */}
                    {isExpanded && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Context extraction */}
                        <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <p className="text-[9px] font-bold text-white/25 uppercase tracking-wider mb-2">Context Extraction</p>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40">tone: {orch.context_extraction.her_tone}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40">topic: {orch.context_extraction.topic}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40">goal: {orch.context_extraction.goal_detected}</span>
                          </div>
                          {orch.context_extraction.must_acknowledge.length > 0 && (
                            <div className="mt-1.5">
                              <p className="text-[9px] text-red-400/50 font-bold">Must acknowledge:</p>
                              {orch.context_extraction.must_acknowledge.map((a, idx) => (
                                <p key={idx} className="text-[10px] text-white/35 ml-2">• {a}</p>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* All candidates with scores */}
                        {orch.candidates?.map((c, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => copyText(c.text, `cand-${i}-${cIdx}`)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all active:scale-[0.98] group ${
                              cIdx === orch.winner_id
                                ? 'bg-amber-500/[0.06] border-amber-500/20'
                                : cIdx === orch.backup_id
                                ? 'bg-white/[0.03] border-white/[0.08]'
                                : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5">
                                {cIdx === orch.winner_id && <Trophy className="h-3 w-3 text-amber-400" />}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STYLE_CONFIG[c.style]?.color || 'bg-white/10 text-white/50'}`}>
                                  {STYLE_CONFIG[c.style]?.emoji} {STYLE_CONFIG[c.style]?.label || c.style}
                                </span>
                                <span className="text-[9px] text-white/20">{c.word_count}w</span>
                              </div>
                              <span className="text-[10px] text-white/20 group-hover:text-white/50 transition-colors">
                                {copiedId === `cand-${i}-${cIdx}` ? <Check className="h-3 w-3 text-emerald-400" /> : 'Copy'}
                              </span>
                            </div>
                            <p className="text-[13px] text-white/75 mb-2">{c.text}</p>
                            {/* Score bars */}
                            <div className="space-y-1">
                              <ScoreBar label="Neediness" value={c.scores.neediness_risk} inverted />
                              <ScoreBar label="Clarity" value={c.scores.clarity} />
                              <ScoreBar label="Forward" value={c.scores.forward_motion} />
                              <ScoreBar label="Tone match" value={c.scores.tone_match} />
                            </div>
                            {c.notes && <p className="text-[9px] text-white/20 mt-1.5">{c.notes}</p>}
                          </button>
                        ))}

                        {/* Latency breakdown */}
                        <div className="flex gap-3 px-2 text-[9px] text-white/15">
                          <span>Strategy: {orch.latency.strategy}ms</span>
                          <span>Generation: {orch.latency.generation}ms</span>
                          <span>Critic: {orch.latency.critic}ms</span>
                          <span className="text-white/25 font-bold">Total: {orch.latency.total}ms</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── Simple draft cards (coaching mode) ── */}
              {msg.draft && (msg.draft.shorter || msg.draft.spicier || msg.draft.softer) && (
                <div className="w-full space-y-2">
                  <p className="text-[10px] text-amber-400/70 font-bold uppercase tracking-wider px-1">Coach Drafts</p>
                  {msg.draft.shorter && (
                    <button onClick={() => copyText(msg.draft!.shorter!, `draft-s-${i}`)} className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] hover:bg-white/[0.09] transition-all active:scale-[0.98] group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">⚡ Shorter</span>
                        <span className="text-[10px] text-amber-400/50 group-hover:text-amber-400 transition-colors">{copiedId === `draft-s-${i}` ? <Check className="h-3 w-3" /> : 'Copy →'}</span>
                      </div>
                      <p className="text-[13px] text-white/80">{msg.draft.shorter}</p>
                    </button>
                  )}
                  {msg.draft.spicier && (
                    <button onClick={() => copyText(msg.draft!.spicier!, `draft-p-${i}`)} className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] hover:bg-white/[0.09] transition-all active:scale-[0.98] group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">🔥 Spicier</span>
                        <span className="text-[10px] text-orange-400/50 group-hover:text-orange-400 transition-colors">{copiedId === `draft-p-${i}` ? <Check className="h-3 w-3" /> : 'Copy →'}</span>
                      </div>
                      <p className="text-[13px] text-white/80">{msg.draft.spicier}</p>
                    </button>
                  )}
                  {msg.draft.softer && (
                    <button onClick={() => copyText(msg.draft!.softer!, `draft-f-${i}`)} className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] hover:bg-white/[0.09] transition-all active:scale-[0.98] group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">💚 Softer</span>
                        <span className="text-[10px] text-emerald-400/50 group-hover:text-emerald-400 transition-colors">{copiedId === `draft-f-${i}` ? <Check className="h-3 w-3" /> : 'Copy →'}</span>
                      </div>
                      <p className="text-[13px] text-white/80">{msg.draft.softer}</p>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="mb-4 flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white/[0.07] border border-white/[0.08] flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
              <span className="text-[13px] text-white/40">
                {extracting ? 'Reading screenshot...' : 'Running pipeline...'}
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

        {/* ─ Input — pinned at bottom of card ─ */}
        <div className="shrink-0 px-6 pb-5 pt-3 border-t border-white/[0.06]">
          <div className="flex items-end gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={extracting}
              className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.10] flex items-center justify-center text-white/35 hover:text-white/70 hover:bg-white/[0.10] transition-all active:scale-90 shrink-0 disabled:opacity-40"
            >
              {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={SMART_PLACEHOLDERS[placeholderIdx]}
              rows={1}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/85 placeholder-white/25 text-[13px] focus:outline-none focus:border-amber-500/40 transition-all disabled:opacity-50 resize-none overflow-hidden leading-relaxed"
              style={{ minHeight: '42px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className={`rounded-xl flex items-center justify-center text-white transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 ${
                input.trim()
                  ? 'px-4 h-10 gap-1.5 bg-gradient-to-br from-amber-600 to-orange-600 shadow-md shadow-amber-500/25 hover:shadow-amber-500/40'
                  : 'w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 shadow-md shadow-amber-500/20 disabled:shadow-none'
              }`}
            >
              {input.trim() ? (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="text-[12px] font-bold">Go</span>
                </>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Clear chat */}
          {chatHistory.length > 0 && (
            <div className="flex justify-end mt-2">
              <button
                onClick={() => {
                  setChatHistory([]);
                  setExpandedTrace(null);
                }}
                className="text-[10px] text-white/20 hover:text-white/40 transition-colors"
              >
                Clear chat
              </button>
            </div>
          )}
        </div>
      </div>{/* End card */}
    </div>
  );
}
