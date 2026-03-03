'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ── SVG Sparkline ─────────────────────────────────────────────────────────────
export function Sparkline({ values, color = '#8b5cf6', h = 36 }: { values: number[]; color?: string; h?: number }) {
  if (!values || values.length < 2) {
    return (
      <svg width="100%" height={h} viewBox={`0 0 80 ${h}`} preserveAspectRatio="none">
        <line x1="0" y1={h - 4} x2="80" y2={h - 4} stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="3 2" />
      </svg>
    );
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pad = 4;
  const W = 80;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y] as [number, number];
  });
  const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const fillPath = `${linePath} L ${W} ${h} L 0 ${h} Z`;
  const uid = `sg${color.replace(/[^a-z0-9]/gi, '')}${h}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={uid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${uid})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Mini Donut ────────────────────────────────────────────────────────────────
export function MiniDonut({ segments }: { segments: Array<{ value: number; color: string }> }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = 28; const cx = 36; const cy = 36;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const arc = (
          <circle
            key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth="10"
            strokeDasharray={`${dash.toFixed(2)} ${circ.toFixed(2)}`}
            strokeDashoffset={(-offset).toFixed(2)}
            transform={`rotate(-90, ${cx}, ${cy})`}
          />
        );
        offset += dash;
        return arc;
      })}
    </svg>
  );
}

// ── useCountUp ────────────────────────────────────────────────────────────────
export function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    const steps = 28;
    const inc = target / steps;
    let cur = 0;
    timer.current = setInterval(() => {
      cur = Math.min(cur + inc, target);
      setVal(cur);
      if (cur >= target) clearInterval(timer.current!);
    }, duration / steps);
    return () => clearInterval(timer.current!);
  }, [target, duration]);
  return val;
}

// ── AnimatedNumber ────────────────────────────────────────────────────────────
export function AnimatedNumber({ value, className = '', prefix = '', decimals = 0 }: { value: number; className?: string; prefix?: string; decimals?: number }) {
  const count = useCountUp(value);
  const display = decimals > 0 ? count.toFixed(decimals) : Math.round(count).toLocaleString();
  return <span className={className}>{prefix}{display}</span>;
}

// ── GrowthBadge ───────────────────────────────────────────────────────────────
export function GrowthBadge({ pct }: { pct: number }) {
  if (pct > 0) return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
      <TrendingUp className="h-2.5 w-2.5" />+{pct}%
    </span>
  );
  if (pct < 0) return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
      <TrendingDown className="h-2.5 w-2.5" />{pct}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white/25 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-full">
      <Minus className="h-2.5 w-2.5" />flat
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function daySeriesFromMap(map: Record<string, number>, days = 7): number[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000);
    return map[d.toISOString().split('T')[0]] || 0;
  });
}

export function relTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

export function actionLabel(action: string): string {
  const map: Record<string, string> = {
    generate: 'generated a reply', generate_v2: 'generated a reply',
    decode: 'decoded a message', opener: 'wrote an opener',
    revive: 'revived a convo', coach: 'asked Coach',
    x2_orchestrate: 'ran Deep Analysis',
  };
  return map[action] || action.replace(/_/g, ' ');
}

export function actionIcon(action: string): string {
  if (action.includes('decode')) return '🔍';
  if (action.includes('revive')) return '🔥';
  if (action.includes('opener')) return '✨';
  if (action.includes('x2') || action.includes('orchestrate')) return '🏆';
  if (action.includes('coach')) return '🤖';
  return '⚡';
}
