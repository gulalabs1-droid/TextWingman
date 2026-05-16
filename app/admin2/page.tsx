'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Users, Zap, Copy, UserPlus, TrendingUp, TrendingDown, Activity, Pause, Play,
  RefreshCw, Wifi, Eye, Crown, Globe, Monitor, Smartphone, Tablet, MapPin,
} from 'lucide-react';

type FeedItem = { kind: string; at: string; userId: string | null; email: string | null; meta?: string };
type Visitor = {
  at: string;
  userId: string | null;
  ip: string | null;
  email: string | null;
  page: string;
  referrer: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  screen: string | null;
  lang: string | null;
  utm: Record<string, string> | null;
};

type LiveData = {
  serverTime: string;
  online: { m5: number; m15: number; h1: number };
  today: { signups: number; actions: number; copies: number; upgrades: number; cancels: number; pageViews: number; uniqueVisitors: number };
  actionBreakdown: Record<string, number>;
  heatmap: { hour: number; total: number; actions: Record<string, number> }[];
  activeUsersNow: { user_id: string; email: string; lastAction: string; lastSeen: string; count: number; ipCount: number }[];
  feed: FeedItem[];
  topUsersToday: { user_id: string; email: string; count: number }[];
  recentSignups: { id: string; email: string | null; full_name: string | null; created_at: string }[];
  visitors: Visitor[];
  visitorStats: {
    pageBreakdown: Record<string, number>;
    countryBreakdown: Record<string, number>;
    deviceBreakdown: Record<string, number>;
    referrerBreakdown: Record<string, number>;
  };
};

const ACTION_COLORS: Record<string, string> = {
  page_view:        'text-sky-300 bg-sky-500/10 border-sky-500/30',
  signup:           'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  generate_reply:   'text-violet-300 bg-violet-500/10 border-violet-500/30',
  decode:           'text-blue-300 bg-blue-500/10 border-blue-500/30',
  generate_opener:  'text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/30',
  generate_revive:  'text-pink-300 bg-pink-500/10 border-pink-500/30',
  strategy_chat:    'text-amber-300 bg-amber-500/10 border-amber-500/30',
  extract_text:     'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
  copy:             'text-teal-300 bg-teal-500/10 border-teal-500/30',
  upgrade:          'text-yellow-300 bg-yellow-500/10 border-yellow-500/30',
  cancel:           'text-red-300 bg-red-500/10 border-red-500/30',
  unknown:          'text-white/40 bg-white/[0.04] border-white/10',
};

function relTime(iso: string, now: number): string {
  const diff = (now - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.max(1, Math.floor(diff))}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function shortEmail(email: string | null): string {
  if (!email) return 'anon';
  const [name, domain] = email.split('@');
  if (!domain) return email;
  return `${name.slice(0, 12)}@${domain.split('.')[0]}`;
}

function actionLabel(kind: string): string {
  return kind
    .replace('generate_reply', 'reply')
    .replace('generate_opener', 'opener')
    .replace('generate_revive', 'revive')
    .replace('strategy_chat', 'coach')
    .replace('extract_text', 'screenshot')
    .replace(/_/g, ' ');
}

export default function Admin2Page() {
  const [data, setData] = useState<LiveData | null>(null);
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0); // for "Xs ago" recalc
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin2/live', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError('');
      setNow(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }, []);

  // initial + poll every 5s
  useEffect(() => {
    fetchData();
    if (paused) return;
    intervalRef.current = setInterval(fetchData, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData, paused]);

  // tick every 1s so relTime updates
  useEffect(() => {
    const t = setInterval(() => { setTick(x => x + 1); setNow(Date.now()); }, 1000);
    return () => clearInterval(t);
  }, []);

  if (!data && !error) {
    return <div className="flex items-center justify-center py-24"><div className="text-white/30 text-sm">Loading live data…</div></div>;
  }
  if (error && !data) {
    return <div className="text-center py-24"><p className="text-red-400 text-sm mb-3">{error}</p><button onClick={fetchData} className="px-3 py-1.5 rounded-md bg-white/[0.06] text-xs hover:bg-white/[0.10]">Retry</button></div>;
  }
  if (!data) return null;

  const maxHeat = Math.max(...data.heatmap.map(h => h.total), 1);
  const totalActions = Object.values(data.actionBreakdown).reduce((s, n) => s + n, 0);
  const sortedActions = Object.entries(data.actionBreakdown).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4 text-sm">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full ${paused ? 'bg-white/30' : 'bg-emerald-400 animate-ping'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${paused ? 'bg-white/40' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="text-xs font-medium text-white/70">{paused ? 'Paused' : 'Live'}</span>
            <span className="text-[10px] text-white/30 ml-1">· refresh every 5s</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPaused(p => !p)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-xs text-white/60 transition border border-white/[0.06]">
            {paused ? <><Play className="h-3 w-3" />Resume</> : <><Pause className="h-3 w-3" />Pause</>}
          </button>
          <button onClick={fetchData} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-xs text-white/60 transition border border-white/[0.06]">
            <RefreshCw className="h-3 w-3" />Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-2">
        <Kpi label="Online · 5m"  value={data.online.m5}  icon={<Wifi className="h-3 w-3" />} accent="emerald" pulse />
        <Kpi label="Online · 15m" value={data.online.m15} icon={<Eye className="h-3 w-3" />} accent="violet" />
        <Kpi label="Online · 1h"  value={data.online.h1}  icon={<Users className="h-3 w-3" />} accent="blue" />
        <Kpi label="Page Views" value={data.today.pageViews} icon={<Eye className="h-3 w-3" />} accent="sky" />
        <Kpi label="Unique Visitors" value={data.today.uniqueVisitors} icon={<Globe className="h-3 w-3" />} accent="cyan" />
        <Kpi label="Signups today" value={data.today.signups} icon={<UserPlus className="h-3 w-3" />} accent="emerald" />
        <Kpi label="Actions today" value={data.today.actions} icon={<Activity className="h-3 w-3" />} accent="fuchsia" />
        <Kpi label="Copies today"  value={data.today.copies}  icon={<Copy className="h-3 w-3" />} accent="teal" />
        <Kpi
          label="Upgrades / Cancels"
          value={`${data.today.upgrades} / ${data.today.cancels}`}
          icon={data.today.upgrades >= data.today.cancels ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          accent={data.today.upgrades >= data.today.cancels ? 'emerald' : 'red'}
        />
      </div>

      {/* ── Heatmap (24h) ── */}
      <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">24h Activity · {data.today.actions} actions today</h2>
          <span className="text-[10px] text-white/25">left = 23h ago · right = now</span>
        </div>
        <div className="flex items-end gap-1 h-20">
          {data.heatmap.map((h, i) => {
            const heightPct = (h.total / maxHeat) * 100;
            const isNow = i === 23;
            return (
              <div key={i} className="flex-1 group relative flex flex-col justify-end" title={`${h.total} actions`}>
                <div
                  className={`w-full rounded-sm transition-all ${isNow ? 'bg-gradient-to-t from-emerald-500 to-emerald-300' : 'bg-gradient-to-t from-violet-600/80 to-fuchsia-400/80'}`}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                />
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 text-[10px] text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10">
                  {h.total}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1.5 text-[9px] text-white/20 font-mono">
          <span>-23h</span><span>-18h</span><span>-12h</span><span>-6h</span><span>now</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── LIVE FEED ── */}
        <div className="lg:col-span-2 rounded-lg bg-black/40 border border-white/[0.06] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
            <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Live Activity Stream</h2>
            <span className="text-[10px] text-white/25 font-mono">{data.feed.length} events · 24h</span>
          </div>
          <div className="max-h-[560px] overflow-y-auto font-mono text-[11px] divide-y divide-white/[0.03]">
            {data.feed.length === 0 && (
              <div className="px-4 py-8 text-center text-white/30">No activity yet — waiting for users…</div>
            )}
            {data.feed.map((f, i) => {
              const cls = ACTION_COLORS[f.kind] || ACTION_COLORS.unknown;
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-1.5 hover:bg-white/[0.02] transition">
                  <span className="text-white/30 w-10 shrink-0 text-right">{relTime(f.at, now)}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${cls} w-24 text-center shrink-0`}>{actionLabel(f.kind)}</span>
                  <span className="text-white/70 truncate flex-1">{shortEmail(f.email)}</span>
                  {f.meta && <span className="text-white/30 text-[10px] shrink-0">{f.meta}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Active users RIGHT NOW ── */}
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
            <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Active Now · 15m</h2>
            <span className="text-[10px] text-emerald-400 font-bold">{data.activeUsersNow.length} users</span>
          </div>
          <div className="max-h-[560px] overflow-y-auto divide-y divide-white/[0.03]">
            {data.activeUsersNow.length === 0 && (
              <div className="px-4 py-8 text-center text-white/30 text-xs">No active users right now</div>
            )}
            {data.activeUsersNow.map(u => (
              <div key={u.user_id} className="px-4 py-2 hover:bg-white/[0.03] transition">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/80 truncate max-w-[180px] font-medium">{shortEmail(u.email)}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">{relTime(u.lastSeen, now)} ago</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/40">
                  <span className={`px-1.5 py-0.5 rounded ${ACTION_COLORS[u.lastAction] || ACTION_COLORS.unknown}`}>{actionLabel(u.lastAction)}</span>
                  <span className="font-mono">{u.count}× actions</span>
                  {u.ipCount > 1 && <span className="text-amber-400 font-mono">{u.ipCount} IPs</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Action breakdown bar ── */}
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
          <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3">Actions Today · {totalActions}</h2>
          <div className="space-y-2">
            {sortedActions.length === 0 && <div className="text-xs text-white/30 py-4">No actions yet today</div>}
            {sortedActions.map(([action, count]) => {
              const pct = totalActions > 0 ? (count / totalActions) * 100 : 0;
              const cls = ACTION_COLORS[action] || ACTION_COLORS.unknown;
              return (
                <div key={action}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] text-white/70">{actionLabel(action)}</span>
                    <span className="text-[10px] text-white/40 font-mono">{count} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cls.split(' ').find(c => c.startsWith('bg-')) || 'bg-white/20'}`} style={{ width: `${Math.max(pct, 1)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Top users today ── */}
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <div className="px-4 py-2.5 border-b border-white/[0.06]">
            <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Top Users · Today</h2>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {data.topUsersToday.length === 0 && <div className="px-4 py-8 text-center text-white/30 text-xs">No user activity today</div>}
            {data.topUsersToday.map((u, i) => (
              <div key={u.user_id} className="flex items-center gap-3 px-4 py-2 hover:bg-white/[0.03] transition">
                <span className={`text-[10px] font-bold w-5 text-right ${i === 0 ? 'text-yellow-400' : i < 3 ? 'text-white/60' : 'text-white/25'}`}>{i + 1}</span>
                <span className="text-xs text-white/70 truncate flex-1">{shortEmail(u.email)}</span>
                <span className="text-xs font-mono text-fuchsia-300">{u.count}</span>
                {i === 0 && <Crown className="h-3 w-3 text-yellow-400" />}
              </div>
            ))}
          </div>
        </div>

        {/* ── Recent signups ── */}
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
            <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Recent Signups</h2>
            <span className="text-[10px] text-emerald-400 font-mono">{data.recentSignups.length} · 24h</span>
          </div>
          <div className="max-h-[280px] overflow-y-auto divide-y divide-white/[0.03]">
            {data.recentSignups.length === 0 && <div className="px-4 py-8 text-center text-white/30 text-xs">No signups in last 24h</div>}
            {data.recentSignups.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-2 hover:bg-white/[0.03] transition">
                <UserPlus className="h-3 w-3 text-emerald-400 shrink-0" />
                <span className="text-xs text-white/70 truncate flex-1">{shortEmail(s.email)}</span>
                <span className="text-[10px] text-white/40 font-mono">{relTime(s.created_at, now)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── VISITORS SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Recent Visitors Stream ── */}
        <div className="lg:col-span-2 rounded-lg bg-black/40 border border-white/[0.06] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
            <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5"><Globe className="h-3 w-3 text-sky-400" />Visitors · Live</h2>
            <span className="text-[10px] text-white/25 font-mono">{data.visitors.length} visits · 24h</span>
          </div>
          <div className="max-h-[480px] overflow-y-auto font-mono text-[11px] divide-y divide-white/[0.03]">
            {data.visitors.length === 0 && (
              <div className="px-4 py-8 text-center text-white/30">No page views tracked yet — waiting for visitors…</div>
            )}
            {data.visitors.map((v, i) => (
              <div key={i} className="px-4 py-2 hover:bg-white/[0.02] transition">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/30 w-10 shrink-0 text-right text-[10px]">{relTime(v.at, now)}</span>
                  <span className="text-sky-300 font-medium truncate flex-1">{v.page}</span>
                  <span className="flex items-center gap-1 text-[10px] text-white/40 shrink-0">
                    {v.device === 'mobile' && <Smartphone className="h-3 w-3" />}
                    {v.device === 'tablet' && <Tablet className="h-3 w-3" />}
                    {v.device === 'desktop' && <Monitor className="h-3 w-3" />}
                    {v.os && <span>{v.os}</span>}
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-12 text-[10px] text-white/30">
                  {v.country && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{v.city ? `${v.city}, ` : ''}{v.country}</span>}
                  {v.browser && <span className="px-1 py-0.5 rounded bg-white/[0.04]">{v.browser}</span>}
                  {v.email && <span className="text-violet-300/70">{shortEmail(v.email)}</span>}
                  {!v.email && v.ip && <span className="text-white/20">·{v.ip.slice(-6)}</span>}
                  {v.referrer && <span className="text-amber-300/60 truncate max-w-[200px]">← {v.referrer}</span>}
                  {v.utm && Object.keys(v.utm).length > 0 && (
                    <span className="text-emerald-300/60">{Object.entries(v.utm).map(([k,val]) => `${k}=${val}`).join(' ')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Visitor Stats Sidebar ── */}
        <div className="space-y-4">
          {/* Pages breakdown */}
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
            <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3">Pages · Today</h2>
            <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
              {Object.entries(data.visitorStats.pageBreakdown).sort((a,b) => b[1]-a[1]).map(([page, count]) => (
                <div key={page} className="flex items-center justify-between text-[11px]">
                  <span className="text-white/60 truncate max-w-[160px]">{page}</span>
                  <span className="text-sky-300 font-mono">{count}</span>
                </div>
              ))}
              {Object.keys(data.visitorStats.pageBreakdown).length === 0 && <span className="text-white/30 text-xs">No data</span>}
            </div>
          </div>

          {/* Countries */}
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
            <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3">Countries · Today</h2>
            <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
              {Object.entries(data.visitorStats.countryBreakdown).sort((a,b) => b[1]-a[1]).map(([country, count]) => (
                <div key={country} className="flex items-center justify-between text-[11px]">
                  <span className="text-white/60">{country}</span>
                  <span className="text-cyan-300 font-mono">{count}</span>
                </div>
              ))}
              {Object.keys(data.visitorStats.countryBreakdown).length === 0 && <span className="text-white/30 text-xs">No data</span>}
            </div>
          </div>

          {/* Devices */}
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
            <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3">Devices · Today</h2>
            <div className="flex items-center gap-3">
              {Object.entries(data.visitorStats.deviceBreakdown).sort((a,b) => b[1]-a[1]).map(([dev, count]) => (
                <div key={dev} className="flex items-center gap-1.5 text-[11px]">
                  {dev === 'mobile' && <Smartphone className="h-3 w-3 text-fuchsia-300" />}
                  {dev === 'tablet' && <Tablet className="h-3 w-3 text-amber-300" />}
                  {dev === 'desktop' && <Monitor className="h-3 w-3 text-blue-300" />}
                  <span className="text-white/60">{dev}</span>
                  <span className="text-white/40 font-mono">{count}</span>
                </div>
              ))}
              {Object.keys(data.visitorStats.deviceBreakdown).length === 0 && <span className="text-white/30 text-xs">No data</span>}
            </div>
          </div>

          {/* Referrers */}
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
            <h2 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3">Traffic Sources · Today</h2>
            <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
              {Object.entries(data.visitorStats.referrerBreakdown).sort((a,b) => b[1]-a[1]).map(([src, count]) => (
                <div key={src} className="flex items-center justify-between text-[11px]">
                  <span className="text-white/60 truncate max-w-[160px]">{src}</span>
                  <span className="text-amber-300 font-mono">{count}</span>
                </div>
              ))}
              {Object.keys(data.visitorStats.referrerBreakdown).length === 0 && <span className="text-white/30 text-xs">No data</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] text-white/20 font-mono pt-2">
        last updated {new Date(data.serverTime).toLocaleTimeString()} · tick #{tick}
      </div>
    </div>
  );
}

function Kpi({ label, value, icon, accent, pulse }: { label: string; value: number | string; icon: React.ReactNode; accent: 'emerald' | 'violet' | 'blue' | 'fuchsia' | 'teal' | 'red' | 'sky' | 'cyan'; pulse?: boolean }) {
  const accents: Record<string, { text: string; bg: string; border: string }> = {
    emerald: { text: 'text-emerald-300', bg: 'bg-emerald-500/[0.07]', border: 'border-emerald-500/20' },
    violet:  { text: 'text-violet-300',  bg: 'bg-violet-500/[0.07]',  border: 'border-violet-500/20' },
    blue:    { text: 'text-blue-300',    bg: 'bg-blue-500/[0.07]',    border: 'border-blue-500/20' },
    fuchsia: { text: 'text-fuchsia-300', bg: 'bg-fuchsia-500/[0.07]', border: 'border-fuchsia-500/20' },
    teal:    { text: 'text-teal-300',    bg: 'bg-teal-500/[0.07]',    border: 'border-teal-500/20' },
    red:     { text: 'text-red-300',     bg: 'bg-red-500/[0.07]',     border: 'border-red-500/20' },
    sky:     { text: 'text-sky-300',     bg: 'bg-sky-500/[0.07]',     border: 'border-sky-500/20' },
    cyan:    { text: 'text-cyan-300',    bg: 'bg-cyan-500/[0.07]',    border: 'border-cyan-500/20' },
  };
  const a = accents[accent];
  return (
    <div className={`rounded-lg ${a.bg} border ${a.border} px-3 py-2.5 relative overflow-hidden`}>
      {pulse && (
        <span className="absolute top-2 right-2 flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
        </span>
      )}
      <div className={`flex items-center gap-1 ${a.text} mb-0.5`}>
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">{label}</span>
      </div>
      <p className={`text-xl font-bold ${a.text} tabular-nums`}>{value}</p>
    </div>
  );
}
