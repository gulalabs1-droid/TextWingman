'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sparkles, MessageCircle, Shield, Brain, Send,
  Target, Gauge, TrendingUp, TrendingDown, Activity, Crosshair,
  Zap, Heart, Crown, Lock, Eye, Copy, ChevronRight, Search,
  Flame, BarChart3, Radar, Clock, AlertTriangle, CheckCircle,
  Compass, Rocket, Swords, Lightbulb, Star, Award, RefreshCw,
  BookOpen, Mic2, PenTool, Wand2, Ghost, Radio, ScanLine,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────
type SavedThread = {
  id: string;
  name: string;
  context: string | null;
  updated_at: string;
  message_count: number;
  last_message: { role: string; text: string } | null;
};

type StyleStats = {
  favoriteTone: string | null;
  avgWordCount: number;
  totalCopies: number;
  hasData: boolean;
};

// ── Glass Component (matches /x page) ──────────────────
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

// ── Animated Pulse Line (Hero Power Pulse) ──────────────
function HeroPulse({ health, momentum }: { health: number; momentum: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const phase = useRef(0);

  const color = health > 75 ? '#f59e0b' : health > 50 ? '#8b5cf6' : '#3b82f6';
  const speed = momentum === 'rising' ? 0.04 : momentum === 'declining' ? 0.015 : 0.025;
  const amplitude = health > 75 ? 28 : health > 50 ? 20 : 12;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Glow trail
      ctx.beginPath();
      ctx.strokeStyle = color + '15';
      ctx.lineWidth = 8;
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin((x / w) * Math.PI * 4 + phase.current) * amplitude * 0.7;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Main line
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin((x / w) * Math.PI * 4 + phase.current) * amplitude;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      phase.current += speed;
      animRef.current = requestAnimationFrame(draw);
    };

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, [color, speed, amplitude]);

  return <canvas ref={canvasRef} className="w-full h-16" />;
}

// ── Mini Sparkline Component ──────────────────
function Sparkline({ data, color = '#8b5cf6', height = 32 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <polyline fill={`${color}15`} stroke="none" points={`0,${height} ${points} ${w},${height}`} />
    </svg>
  );
}

// ── Donut Chart ──────────────────
function DonutChart({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let cumulative = 0;
  const r = 40;
  const circumference = 2 * Math.PI * r;

  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const offset = cumulative;
        cumulative += pct;
        return (
          <circle
            key={i}
            cx="50" cy="50" r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="10"
            strokeDasharray={`${pct * circumference} ${circumference}`}
            strokeDashoffset={-offset * circumference}
            transform="rotate(-90 50 50)"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${seg.color}50)` }}
          />
        );
      })}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function ExperimentalDashboard() {
  const [userName, setUserName] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [threads, setThreads] = useState<SavedThread[]>([]);
  const [styleStats, setStyleStats] = useState<StyleStats | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch data ──
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, threadsRes, styleRes] = await Promise.all([
          fetch('/api/profile').catch(() => null),
          fetch('/api/threads').catch(() => null),
          fetch('/api/style-stats').catch(() => null),
        ]);

        if (profileRes?.ok) {
          const p = await profileRes.json();
          setUserName(p.profile?.display_name || p.profile?.email?.split('@')[0] || null);
          setIsPro(p.isPro || false);
        }
        if (threadsRes?.ok) {
          const t = await threadsRes.json();
          setThreads(t.threads || []);
        }
        if (styleRes?.ok) {
          const s = await styleRes.json();
          setStyleStats(s);
        }
      } catch {}
      setLoading(false);
    };
    fetchAll();
  }, []);

  // ── Derived data ──
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const activeThreadCount = threads.length;
  const hotThreads = useMemo(() => {
    return threads
      .filter(t => t.message_count >= 3)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 4);
  }, [threads]);

  // Mock data for features not yet wired (realistic placeholders)
  const overallHealth = 78;
  const overallMomentum = 'rising';
  const frameScore = 82;
  const weeklyImprovement = 27;
  const todayReplies = 4;
  const todayDecodes = 2;
  const winRate = 73;
  const styleMastery = 87;
  const weeklyActivity = [2, 4, 3, 6, 4, 8, 5]; // last 7 days

  const toneDistribution = useMemo(() => [
    { value: 62, color: '#3b82f6', label: 'Shorter' },
    { value: 28, color: '#f43f5e', label: 'Spicier' },
    { value: 10, color: '#10b981', label: 'Softer' },
  ], []);

  // Silent Guardian whispers (contextual, risk-based)
  const [whisper, setWhisper] = useState<string | null>(null);
  const [showWhisper, setShowWhisper] = useState(false);

  useEffect(() => {
    // Show a contextual whisper after 3 seconds
    const timer = setTimeout(() => {
      if (hotThreads.length > 0) {
        const whispers = [
          'A thread has high momentum — coach it now before the window closes.',
          'Your frame has been strong this week. Keep the energy.',
          'One thread shows declining engagement — consider a strategic re-entry.',
          'Perfect frame hold on your last 3 replies. Stay the course.',
        ];
        setWhisper(whispers[Math.floor(Math.random() * whispers.length)]);
        setShowWhisper(true);
        setTimeout(() => setShowWhisper(false), 5000);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [hotThreads.length]);

  // ══════════════════════════════════════════════════════
  //  R E N D E R
  // ══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen relative bg-[#030305]">

      {/* ══ ANIMATED BACKGROUND ══ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div className="absolute w-[700px] h-[700px] rounded-full" style={{ filter: 'blur(180px)', top: '-20%', left: '-15%' }}
          animate={{ backgroundColor: ['rgba(139,92,246,0.22)', 'rgba(217,70,239,0.18)', 'rgba(139,92,246,0.22)'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute w-[600px] h-[600px] rounded-full" style={{ filter: 'blur(180px)', bottom: '-15%', right: '-15%' }}
          animate={{ backgroundColor: ['rgba(236,72,153,0.18)', 'rgba(34,211,238,0.14)', 'rgba(236,72,153,0.18)'] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute w-[400px] h-[400px] rounded-full" style={{ filter: 'blur(140px)', top: '40%', left: '50%' }}
          animate={{ backgroundColor: ['rgba(52,211,153,0.08)', 'rgba(251,191,36,0.06)', 'rgba(52,211,153,0.08)'] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* ══ CONTENT ══ */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-8">

        {/* ── NAV ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/x" className="group w-9 h-9 rounded-2xl border border-white/[0.08] flex items-center justify-center transition-all hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] active:scale-90" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <ArrowLeft className="h-4 w-4 text-white/40 group-hover:text-violet-400 transition-colors" />
            </Link>
            <div className="flex items-center gap-2.5">
              <motion.div
                animate={{ boxShadow: ['0 0 20px rgba(139,92,246,0.3)', '0 0 40px rgba(139,92,246,0.5)', '0 0 20px rgba(139,92,246,0.3)'] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-8 h-8 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center"
              >
                <Compass className="h-4 w-4 text-white" />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-white font-black text-[15px] tracking-tight">COMMAND CENTER</h1>
                  <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-[0.15em] bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-violet-300 border border-violet-500/20">V4 LAB</span>
                </div>
                <p className="text-white/25 text-[9px] font-mono tracking-[0.3em] uppercase">experimental dashboard</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-[0.15em] border ${isPro ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(52,211,153,0.1)]' : 'bg-violet-500/10 text-violet-300 border-violet-500/20'}`}>{isPro ? 'PRO' : 'FREE'}</span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            1. HERO SECTION
            ═══════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <Glass className="p-6 md:p-8 overflow-hidden relative" glow neonColor="violet">
            {/* Animated gradient accent */}
            <motion.div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(236,72,153,0.6), rgba(34,211,238,0.4), transparent)' }}
              animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="space-y-4 flex-1">
                {/* Greeting */}
                <div>
                  <h2 className="text-white/90 text-3xl md:text-4xl font-black tracking-tight">
                    {greeting}{userName ? `, ${userName}` : ''} <span className="inline-block animate-pulse">👋</span>
                  </h2>
                  <p className="text-white/40 text-sm md:text-base font-medium mt-2 leading-relaxed">
                    {hotThreads.length > 0
                      ? <>{hotThreads.length} high-opportunity thread{hotThreads.length > 1 ? 's' : ''} today. Your frame is strong this week <span className="text-amber-400">🔥</span></>
                      : <>Start a thread to activate your command center.</>
                    }
                  </p>
                </div>

                {/* Quick stats under greeting */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400/80 text-xs font-bold">+{weeklyImprovement}% frame this month</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-violet-300/60 text-xs font-bold">{activeThreadCount} active threads</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-3 pt-2">
                  <Link href="/x">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="h-12 px-7 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 text-white font-black text-sm tracking-wider flex items-center gap-2.5 shadow-[0_4px_30px_rgba(139,92,246,0.4)] hover:shadow-[0_4px_40px_rgba(139,92,246,0.5)] transition-shadow">
                      <Crosshair className="h-4.5 w-4.5" /> Coach My Hottest Thread
                    </motion.button>
                  </Link>
                  <Link href="/app">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="h-12 px-5 rounded-2xl bg-white/[0.06] border border-white/[0.10] text-white/50 font-bold text-sm flex items-center gap-2 hover:bg-white/[0.08] hover:text-white/70 transition-all">
                      <Send className="h-4 w-4" /> Quick Reply
                    </motion.button>
                  </Link>
                </div>
              </div>

              {/* Hero Power Pulse */}
              <div className="w-full md:w-80 space-y-2">
                <p className="text-white/15 text-[8px] font-mono font-bold tracking-[0.5em]">OVERALL PULSE</p>
                <div className="relative">
                  <HeroPulse health={overallHealth} momentum={overallMomentum} />
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-1">
                    <span className="text-white/25 text-[9px] font-mono">Momentum: <span className="text-amber-400/80">{overallMomentum === 'rising' ? 'Rising ↑' : overallMomentum === 'declining' ? 'Declining ↓' : 'Steady →'}</span></span>
                    <span className="text-white/25 text-[9px] font-mono">Power: <span className="text-violet-300/80">{overallHealth}%</span></span>
                  </div>
                </div>
              </div>
            </div>
          </Glass>
        </motion.div>

        {/* ── SILENT GUARDIAN WHISPER ── */}
        <AnimatePresence>
          {showWhisper && whisper && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
            >
              <div className="px-5 py-3 rounded-2xl border border-violet-500/25 backdrop-blur-2xl flex items-center gap-3 shadow-[0_0_40px_rgba(139,92,246,0.2)]"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(236,72,153,0.08) 100%)' }}>
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Eye className="h-4 w-4 text-violet-400" />
                </motion.div>
                <span className="text-white/80 text-sm font-medium">{whisper}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════
            2. SMART OPPORTUNITY FEED
            ═══════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Flame className="h-4 w-4 text-amber-400" />
              <h3 className="text-white/80 text-sm font-black tracking-wider uppercase">What Needs Your Attention</h3>
            </div>
            <span className="text-white/15 text-[8px] font-mono tracking-[0.4em]">TODAY</span>
          </div>

          {hotThreads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hotThreads.map((thread, i) => {
                const urgency = i === 0 ? 'high' : i === 1 ? 'medium' : 'low';
                const urgencyColor = urgency === 'high' ? 'emerald' : urgency === 'medium' ? 'amber' : 'violet';
                const insights = [
                  'High-engagement window open',
                  'Momentum declining — consider re-entry',
                  'Matches your best historical pattern',
                  'Steady energy — safe to advance',
                ];
                return (
                  <motion.div key={thread.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.08 }}>
                    <Link href="/x">
                      <Glass className="p-4 group hover:border-white/[0.18] transition-all cursor-pointer" glow={i === 0} neonColor={urgencyColor}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <motion.div animate={i === 0 ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 2, repeat: Infinity }}
                              className={`w-2.5 h-2.5 rounded-full ${urgency === 'high' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : urgency === 'medium' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'bg-violet-400/50'}`} />
                            <span className="text-white/70 text-sm font-bold truncate">{thread.name}</span>
                          </div>
                          <span className={`text-[8px] font-black tracking-wider px-2 py-0.5 rounded-md border ${urgency === 'high' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15' : urgency === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/15' : 'text-violet-300 bg-violet-500/10 border-violet-500/15'}`}>{urgency === 'high' ? 'HOT' : urgency === 'medium' ? 'WARM' : 'ACTIVE'}</span>
                        </div>

                        {thread.last_message && (
                          <p className="text-white/40 text-xs font-medium mb-2 truncate">
                            &ldquo;{thread.last_message.text}&rdquo;
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-white/25 text-[10px] font-medium">{insights[i] || insights[3]}</span>
                          <span className="text-white/15 text-[10px] font-bold flex items-center gap-1 group-hover:text-violet-400/60 transition-colors">
                            Coach <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>

                        {/* Mini pulse bar */}
                        <div className="mt-3 h-[2px] rounded-full overflow-hidden bg-white/[0.04]">
                          <motion.div
                            className={`h-full rounded-full ${urgency === 'high' ? 'bg-emerald-400' : urgency === 'medium' ? 'bg-amber-400' : 'bg-violet-400/50'}`}
                            initial={{ width: '0%' }}
                            animate={{ width: `${80 - i * 15}%` }}
                            transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                          />
                        </div>
                      </Glass>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Glass className="p-8 text-center">
              <MessageCircle className="h-8 w-8 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm font-medium">No active threads yet</p>
              <p className="text-white/15 text-xs mt-1">Start a conversation in the Thread Engine to see opportunities here</p>
            </Glass>
          )}
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            3. UPGRADED STATS ROW
            ═══════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Today's Activity */}
            <Glass className="p-4">
              <p className="text-white/25 text-[8px] font-mono font-bold tracking-[0.4em] mb-2">TODAY</p>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-white/90 text-3xl font-black">{todayReplies}</span>
                  <span className="text-white/25 text-xs font-bold ml-1">replies</span>
                </div>
                <div className="text-right">
                  <span className="text-cyan-400/60 text-xs font-bold">{todayDecodes}</span>
                  <span className="text-white/15 text-[10px] ml-1">decodes</span>
                </div>
              </div>
              <div className="mt-3">
                <Sparkline data={weeklyActivity} color="#8b5cf6" height={28} />
              </div>
              <p className="text-white/15 text-[8px] font-mono mt-1 tracking-wider">7-DAY TREND</p>
            </Glass>

            {/* Overall Momentum */}
            <Glass className="p-4" glow neonColor="emerald">
              <p className="text-white/25 text-[8px] font-mono font-bold tracking-[0.4em] mb-2">MOMENTUM</p>
              <div className="flex items-center gap-2">
                <span className="text-white/90 text-3xl font-black">{overallHealth}</span>
                <motion.div animate={{ y: overallMomentum === 'rising' ? [0, -3, 0] : [0, 3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  {overallMomentum === 'rising' ? <TrendingUp className="h-5 w-5 text-emerald-400" /> : overallMomentum === 'declining' ? <TrendingDown className="h-5 w-5 text-rose-400" /> : <Gauge className="h-5 w-5 text-violet-400" />}
                </motion.div>
              </div>
              <p className="text-emerald-400/50 text-[10px] font-bold mt-2">↑ Rising this week</p>
            </Glass>

            {/* Win Rate */}
            <Glass className="p-4">
              <p className="text-white/25 text-[8px] font-mono font-bold tracking-[0.4em] mb-2">WIN RATE</p>
              <span className="text-white/90 text-3xl font-black">{winRate}%</span>
              <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                  initial={{ width: '0%' }} animate={{ width: `${winRate}%` }} transition={{ duration: 1, delay: 0.5 }} />
              </div>
              <p className="text-white/15 text-[10px] font-mono mt-1.5">replies that landed</p>
            </Glass>

            {/* Style Mastery */}
            <Glass className="p-4" glow neonColor="amber">
              <p className="text-white/25 text-[8px] font-mono font-bold tracking-[0.4em] mb-2">STYLE SCORE</p>
              <div className="flex items-center gap-2">
                <span className="text-white/90 text-3xl font-black">{styleMastery}</span>
                <span className="text-amber-400/60 text-lg font-black">/100</span>
              </div>
              <div className="mt-2 flex gap-1">
                {['Shorter', 'Spicier', 'Softer'].map((t, i) => (
                  <div key={t} className="flex-1">
                    <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className={`h-full rounded-full ${i === 0 ? 'bg-blue-400' : i === 1 ? 'bg-rose-400' : 'bg-emerald-400'}`} style={{ width: `${toneDistribution[i].value}%` }} />
                    </div>
                    <p className="text-white/15 text-[7px] font-mono mt-0.5 text-center">{t.substring(0, 3).toUpperCase()}</p>
                  </div>
                ))}
              </div>
            </Glass>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            4. TEXTING PERSONA + 5. VICTORY MOMENTS (side by side)
            ═══════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ── TEXTING PERSONA ── */}
            <Glass className="p-5 space-y-4" glow neonColor="violet">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radar className="h-4 w-4 text-violet-400" />
                  <span className="text-white/60 text-sm font-black tracking-wider">YOUR PERSONA</span>
                </div>
                <span className="text-[8px] font-mono font-bold text-white/15 tracking-[0.3em]">STYLE DNA</span>
              </div>

              <div className="flex items-center gap-5">
                {/* Donut chart */}
                <DonutChart segments={toneDistribution} />
                {/* Legend */}
                <div className="space-y-2.5 flex-1">
                  {toneDistribution.map(seg => (
                    <div key={seg.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color, boxShadow: `0 0 6px ${seg.color}50` }} />
                        <span className="text-white/50 text-xs font-bold">{seg.label}</span>
                      </div>
                      <span className="text-white/70 text-sm font-black">{seg.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signature move */}
              <div className="p-3 rounded-xl border border-violet-500/15 bg-violet-500/[0.04]">
                <p className="text-violet-300/40 text-[9px] font-mono font-bold tracking-[0.3em] mb-1">SIGNATURE MOVE</p>
                <p className="text-white/70 text-sm font-semibold">{styleStats?.favoriteTone || 'Shorter'} + witty closer — your strongest play</p>
              </div>

              {/* Progress bars */}
              <div className="space-y-2.5">
                {[
                  { label: 'Confidence', value: 82, color: 'from-violet-500 to-purple-500' },
                  { label: 'Playfulness', value: 68, color: 'from-rose-500 to-pink-500' },
                  { label: 'Frame Control', value: frameScore, color: 'from-cyan-500 to-blue-500' },
                ].map(bar => (
                  <div key={bar.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/30 text-[10px] font-bold">{bar.label}</span>
                      <span className="text-white/50 text-[10px] font-black">{bar.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div className={`h-full rounded-full bg-gradient-to-r ${bar.color}`}
                        initial={{ width: '0%' }} animate={{ width: `${bar.value}%` }}
                        transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button className="flex-1 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300/70 text-[10px] font-black tracking-wider hover:bg-violet-500/15 transition-all">Refine My Style</button>
                <button className="flex-1 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/30 text-[10px] font-black tracking-wider hover:bg-white/[0.06] transition-all">Full Evolution</button>
              </div>
            </Glass>

            {/* ── VICTORY MOMENTS ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-amber-400" />
                <span className="text-white/60 text-sm font-black tracking-wider">YOUR LATEST WINS</span>
              </div>

              {[
                {
                  them: 'I took a sick day to go to the spa lol',
                  you: 'called in sick for the spa? respect',
                  lesson: 'Short Spicier reply matched their playful energy — led to 6-msg convo',
                  tone: 'spicier',
                },
                {
                  them: 'idk if I wanna go out tonight',
                  you: 'more for us then',
                  lesson: 'Unbothered Shorter reply created intrigue — they decided to come',
                  tone: 'shorter',
                },
                {
                  them: 'I had the worst day ugh',
                  you: 'tell me about it, I got time',
                  lesson: 'Warm Softer reply opened them up — deep conversation followed',
                  tone: 'softer',
                },
              ].map((win, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}>
                  <Glass className="p-4 space-y-2.5">
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <span className="text-white/15 text-[9px] font-mono font-bold shrink-0 mt-0.5">THEM</span>
                        <p className="text-white/50 text-xs font-medium">&ldquo;{win.them}&rdquo;</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-violet-400/40 text-[9px] font-mono font-bold shrink-0 mt-0.5">YOU</span>
                        <p className="text-white/80 text-xs font-semibold">&ldquo;{win.you}&rdquo;</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 pt-1 border-t border-white/[0.04]">
                      <Lightbulb className="h-3 w-3 text-amber-400/50 shrink-0 mt-0.5" />
                      <p className="text-amber-300/40 text-[10px] font-medium leading-relaxed">{win.lesson}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="h-7 px-3 rounded-lg bg-violet-500/10 border border-violet-500/15 text-violet-300/60 text-[9px] font-bold hover:bg-violet-500/15 transition-all flex items-center gap-1">
                        <RefreshCw className="h-2.5 w-2.5" /> Apply Pattern
                      </button>
                      <button className="h-7 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/25 text-[9px] font-bold hover:bg-white/[0.05] transition-all flex items-center gap-1">
                        <BookOpen className="h-2.5 w-2.5" /> Save to Playbook
                      </button>
                    </div>
                  </Glass>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            6. QUICK TOOLS HUB
            ═══════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="h-4 w-4 text-cyan-400" />
            <span className="text-white/60 text-sm font-black tracking-wider">QUICK TOOLS</span>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
            {[
              { label: 'Decode', icon: Brain, color: 'amber', href: '/app', desc: 'Read subtext' },
              { label: 'Opener', icon: Wand2, color: 'cyan', href: '/app', desc: 'Start strong' },
              { label: 'Revive', icon: Flame, color: 'rose', href: '/app', desc: 'Restart dead convos' },
              { label: 'Vibe Check', icon: Radio, color: 'emerald', href: '/app', desc: 'Live energy read' },
              { label: 'Thread', icon: MessageCircle, color: 'violet', href: '/x', desc: 'Full engine' },
              { label: 'Shadow', icon: Ghost, color: 'rose', href: '#', desc: 'V4 coming soon', locked: true },
            ].map((tool, i) => {
              const Icon = tool.icon;
              const colorMap: Record<string, string> = {
                amber: 'from-amber-500 to-orange-500',
                cyan: 'from-cyan-500 to-blue-500',
                rose: 'from-rose-500 to-pink-500',
                emerald: 'from-emerald-500 to-green-500',
                violet: 'from-violet-500 to-purple-500',
              };
              const glowColorMap: Record<string, string> = {
                amber: '0 0 20px rgba(251,191,36,0.25)',
                cyan: '0 0 20px rgba(34,211,238,0.25)',
                rose: '0 0 20px rgba(251,113,133,0.25)',
                emerald: '0 0 20px rgba(52,211,153,0.25)',
                violet: '0 0 20px rgba(139,92,246,0.25)',
              };
              return (
                <motion.div key={tool.label} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Link href={(tool as any).locked ? '#' : tool.href}>
                    <Glass className={`p-4 text-center space-y-2 cursor-pointer group transition-all hover:border-white/[0.18] ${(tool as any).locked ? 'opacity-50' : ''}`}>
                      <div className={`w-11 h-11 mx-auto rounded-2xl bg-gradient-to-br ${colorMap[tool.color]} flex items-center justify-center relative`}
                        style={{ boxShadow: glowColorMap[tool.color] }}>
                        {(tool as any).locked ? <Lock className="h-5 w-5 text-white/70" /> : <Icon className="h-5 w-5 text-white" />}
                      </div>
                      <p className="text-white/60 text-[10px] font-black tracking-wider">{tool.label}</p>
                      <p className="text-white/15 text-[8px] font-mono">{tool.desc}</p>
                    </Glass>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            7. BOTTOM SECTION
            ═══════════════════════════════════════════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Glow-Up Teaser */}
            <Glass className="p-5 relative overflow-hidden" glow neonColor="cyan">
              <motion.div className="absolute -top-10 -right-10 w-32 h-32 rounded-full" style={{ filter: 'blur(40px)', background: 'rgba(34,211,238,0.1)' }}
                animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity }} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-cyan-400" />
                  <span className="text-cyan-300/60 text-xs font-black tracking-wider">MONTHLY GLOW-UP</span>
                </div>
                <p className="text-white/70 text-sm font-semibold">Your February Texting Evolution drops in 12 days</p>
                <p className="text-white/30 text-xs mt-1.5">Full analysis of your style growth, strongest moments, and next-level plays.</p>
                <button className="mt-3 h-8 px-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300/70 text-[10px] font-black tracking-wider hover:bg-cyan-500/15 transition-all">Sneak Peek →</button>
              </div>
            </Glass>

            {/* Pro Upgrade / Feedback */}
            {!isPro ? (
              <Glass className="p-5 relative overflow-hidden">
                <motion.div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full" style={{ filter: 'blur(40px)', background: 'rgba(139,92,246,0.15)' }}
                  animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 5, repeat: Infinity }} />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="h-4 w-4 text-violet-400" />
                    <span className="text-violet-300/60 text-xs font-black tracking-wider">UPGRADE TO PRO</span>
                  </div>
                  <p className="text-white/70 text-sm font-semibold">Unlock Daily Briefings, Strategy Mode & unlimited everything</p>
                  <p className="text-white/30 text-xs mt-1.5">V2 AI pipeline • Full decode • Style Evolution • Priority support</p>
                  <Link href="/pricing">
                    <button className="mt-3 h-9 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-[11px] font-black tracking-wider shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_30px_rgba(139,92,246,0.4)] transition-all">Go Pro →</button>
                  </Link>
                </div>
              </Glass>
            ) : (
              <Glass className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-300/60 text-xs font-black tracking-wider">PRO ACTIVE</span>
                </div>
                <p className="text-white/50 text-sm font-semibold">All V4 features unlocked. You&apos;re running the full engine.</p>
                <div className="mt-3 flex gap-2">
                  <button className="h-8 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/30 text-[10px] font-black tracking-wider hover:bg-white/[0.06] transition-all">Send Feedback</button>
                  <button className="h-8 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/30 text-[10px] font-black tracking-wider hover:bg-white/[0.06] transition-all">Request Feature</button>
                </div>
              </Glass>
            )}
          </div>
        </motion.div>

        {/* Footer spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}
