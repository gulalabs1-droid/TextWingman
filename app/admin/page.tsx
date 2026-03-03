'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, DollarSign, TrendingUp, Zap, RefreshCw, Crown, Loader2,
  Activity, UserCheck, AlertTriangle, Download, ArrowRight, Bot, ChevronRight,
} from 'lucide-react';
import {
  Sparkline, MiniDonut, AnimatedNumber, GrowthBadge,
  daySeriesFromMap, relTime, actionLabel, actionIcon,
} from './components/AdminCharts';

type ActivityItem = { action: string; user_id: string | null; email: string | null; created_at: string };

type OverviewData = {
  totalUsers: number;
  signups: { h24: number; d7: number; d30: number };
  generations: { total: number; h24: number; d7: number; d30: number };
  activatedUsers: number;
  paidUsers: number;
  freeUsers: number;
  mrr: number;
  arr: number;
  projectedMrr: number;
  conversionRate: number;
  activationRate: number;
  planBreakdown: Record<string, number>;
  churn: { d7: number; d30: number };
  cancelingCount: number;
  genByDay: Record<string, number>;
  signupsByDay: Record<string, number>;
  signupGrowthPct: number;
  genGrowthPct: number;
  recentActivity: ActivityItem[];
};

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [secondsAgo, setSecondsAgo] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setSecondsAgo(0);
    try {
      const res = await fetch('/api/admin/overview');
      if (!res.ok) throw new Error('Failed to fetch');
      setData(await res.json());
      setError('');
    } catch {
      setError('Failed to load overview data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (loading) return;
    const t = setInterval(() => setSecondsAgo(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="text-center py-32 space-y-3">
      <p className="text-red-400 text-sm">{error || 'No data'}</p>
      <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-white/[0.06] text-white/60 text-sm hover:bg-white/[0.10] transition">Retry</button>
    </div>
  );

  const genSpark = daySeriesFromMap(data.genByDay, 7);
  const signupSpark = daySeriesFromMap(data.signupsByDay, 7);

  const kpis = [
    { label: 'Total Users', value: data.totalUsers, sub: `+${data.signups.h24} today`, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', spark: signupSpark, sparkColor: '#60a5fa', growthPct: data.signupGrowthPct },
    { label: 'Signups (7d)', value: data.signups.d7, sub: `${data.signups.h24} today`, icon: UserCheck, color: 'text-violet-400', bg: 'bg-violet-500/10', spark: signupSpark, sparkColor: '#8b5cf6', growthPct: data.signupGrowthPct },
    { label: 'Generations (7d)', value: data.generations.d7, sub: `${data.generations.h24} today`, icon: Zap, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', spark: genSpark, sparkColor: '#c026d3', growthPct: data.genGrowthPct },
    { label: 'Activated', value: data.activatedUsers, sub: `${data.activationRate}% rate`, icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/10', spark: signupSpark, sparkColor: '#fb923c', growthPct: null },
  ];

  const funnelStages = [
    { label: 'Signed Up', count: data.totalUsers, color: 'from-blue-500 to-blue-600', dot: 'bg-blue-500', href: '/admin/users' },
    { label: 'Generated 1+', count: data.activatedUsers, color: 'from-violet-500 to-fuchsia-600', dot: 'bg-violet-500', href: '/admin/users' },
    { label: 'Paid', count: data.paidUsers, color: 'from-emerald-500 to-green-600', dot: 'bg-emerald-500', href: '/admin/billing' },
  ];

  const dotColors: Record<string, string> = { weekly: 'bg-violet-500', monthly: 'bg-blue-500', annual: 'bg-emerald-500' };
  const donutColors: Record<string, string> = { weekly: '#8b5cf6', monthly: '#3b82f6', annual: '#10b981' };

  return (
    <div className="space-y-5">

      {/* ── 1. Smart Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">Overview</h1>
            <GrowthBadge pct={data.signupGrowthPct} />
            <span className="text-white/20 text-xs">+{data.signups.d7} signups this week</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />All systems healthy
            </span>
            <span className="text-white/20 text-xs">· Updated {secondsAgo}s ago</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/admin/export-users" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 text-xs hover:bg-white/[0.08] hover:text-white/70 transition">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </a>
          <Link href="/admin/users" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 text-xs hover:bg-white/[0.08] hover:text-white/70 transition">
            <AlertTriangle className="h-3.5 w-3.5" /> Churned
          </Link>
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* ── 2. KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.05] hover:border-white/[0.12] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 transition-all duration-200 p-4">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider">{k.label}</p>
                <AnimatedNumber value={k.value} className="text-2xl font-bold text-white mt-0.5" />
              </div>
              <div className={`p-1.5 rounded-lg ${k.bg} shrink-0`}>
                <k.icon className={`h-3.5 w-3.5 ${k.color}`} />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-white/30">{k.sub}</span>
              {k.growthPct !== null && <GrowthBadge pct={k.growthPct!} />}
            </div>
            <div className="-mx-1"><Sparkline values={k.spark} color={k.sparkColor} h={30} /></div>
          </div>
        ))}
      </div>

      {/* ── 3. Revenue + Plan Health ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.05] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 transition-all duration-200 p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider">Monthly Recurring Revenue</p>
              <div className="flex items-end gap-2 mt-1">
                <AnimatedNumber value={data.mrr} prefix="$" decimals={2} className="text-3xl font-bold text-white" />
                <span className="text-white/25 text-sm mb-0.5">/ mo</span>
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 shrink-0"><DollarSign className="h-3.5 w-3.5 text-emerald-400" /></div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] text-white/25">${data.arr} ARR</span>
            <span className="text-white/10">·</span>
            {data.projectedMrr > data.mrr
              ? <span className="text-[11px] text-emerald-400/60 font-medium">Projected next month: ${data.projectedMrr}</span>
              : <span className="text-[11px] text-white/20">Flat growth projected</span>
            }
          </div>
          {data.paidUsers === 0
            ? <div className="h-8 rounded-lg border border-dashed border-white/[0.06] flex items-center justify-center"><span className="text-[11px] text-white/15">First paid user coming soon</span></div>
            : <Sparkline values={Array(7).fill(data.mrr)} color="#10b981" h={34} />
          }
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/[0.05] text-center">
            {[['Paid', data.paidUsers, ''], ['Conv.', `${data.conversionRate}%`, ''], ['Churn 7d', data.churn.d7, data.churn.d7 > 0 ? 'text-red-400' : ''], ['Canceling', data.cancelingCount, data.cancelingCount > 0 ? 'text-amber-400' : '']].map(([l, v, cls]) => (
              <div key={String(l)}>
                <p className="text-[10px] text-white/20 uppercase">{l}</p>
                <p className={`text-sm font-bold text-white ${cls}`}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.05] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 transition-all duration-200 p-5">
          <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider mb-4">Plan Breakdown</p>
          {data.totalUsers === 0
            ? <div className="flex items-center justify-center h-24"><span className="text-white/15 text-sm">No users yet</span></div>
            : <div className="flex items-center gap-5">
                <MiniDonut segments={[
                  { value: data.freeUsers, color: 'rgba(139,92,246,0.4)' },
                  ...Object.entries(data.planBreakdown).map(([plan, count]) => ({ value: count, color: donutColors[plan] || '#f59e0b' })),
                ]} />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-violet-500/40" /><span className="text-xs text-white/50">Free</span></div>
                    <div className="text-right"><span className="text-sm font-bold text-white">{data.freeUsers}</span><span className="text-[10px] text-white/25 ml-1">{data.totalUsers > 0 ? Math.round((data.freeUsers / data.totalUsers) * 100) : 0}%</span></div>
                  </div>
                  {Object.entries(data.planBreakdown).map(([plan, count]) => (
                    <div key={plan} className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${dotColors[plan] || 'bg-amber-500'}`} /><span className="text-xs text-white/50 capitalize">{plan}</span></div>
                      <div className="text-right"><span className="text-sm font-bold text-white">{count}</span><span className="text-[10px] text-white/25 ml-1">{data.totalUsers > 0 ? Math.round((count / data.totalUsers) * 100) : 0}%</span></div>
                    </div>
                  ))}
                  {Object.keys(data.planBreakdown).length === 0 && <p className="text-xs text-white/15 italic">No paid plans yet</p>}
                </div>
              </div>
          }
        </div>
      </div>

      {/* ── 4. Growth Funnel ── */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider">Growth Funnel</p>
            <p className="text-white/20 text-xs mt-0.5">Tap a stage to view users</p>
          </div>
          <TrendingUp className="h-4 w-4 text-violet-400/50" />
        </div>
        <div className="flex items-stretch gap-0">
          {funnelStages.map((stage, i) => {
            const max = funnelStages[0].count || 1;
            const pct = Math.round((stage.count / max) * 100);
            const dropPct = i > 0 && funnelStages[i - 1].count > 0 ? Math.round(((funnelStages[i - 1].count - stage.count) / funnelStages[i - 1].count) * 100) : null;
            return (
              <div key={stage.label} className="flex items-center flex-1 min-w-0">
                {i > 0 && (
                  <div className="flex flex-col items-center px-1.5 shrink-0">
                    <ChevronRight className="h-3.5 w-3.5 text-white/15" />
                    {dropPct !== null && <span className={`text-[9px] font-bold mt-0.5 ${dropPct > 50 ? 'text-red-400' : dropPct > 20 ? 'text-amber-400' : 'text-emerald-400'}`}>-{dropPct}%</span>}
                  </div>
                )}
                <Link href={stage.href} className="flex-1 min-w-0 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all group">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} />
                    <span className="text-[10px] font-semibold text-white/35 uppercase tracking-wide truncate">{stage.label}</span>
                  </div>
                  <p className="text-xl font-bold text-white">{stage.count.toLocaleString()}</p>
                  <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${stage.color} rounded-full`} style={{ width: `${Math.max(pct, 4)}%` }} />
                  </div>
                  <p className="text-[10px] text-white/20 mt-1">{pct}% of total</p>
                  <p className="text-[10px] text-violet-400/40 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">See users →</p>
                </Link>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/[0.05] text-center">
          {[['Activation', `${data.activationRate}%`], ['Free → Paid', `${data.activatedUsers > 0 ? Math.round((data.paidUsers / data.activatedUsers) * 100) : 0}%`], ['Overall Conv.', `${data.conversionRate}%`]].map(([l, v]) => (
            <div key={l}><p className="text-[10px] text-white/20 uppercase">{l}</p><p className="text-base font-bold text-white">{v}</p></div>
          ))}
        </div>
      </div>

      {/* ── 5. Activity Feed + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider">Latest Activity (24h)</p>
            <span className="text-[10px] text-white/20 bg-white/[0.03] px-2 py-0.5 rounded-full border border-white/[0.06]">{data.recentActivity.length} events</span>
          </div>
          {data.recentActivity.length === 0
            ? <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-dashed border-white/[0.07] flex items-center justify-center mx-auto mb-3">
                  <Activity className="h-4 w-4 text-white/10" />
                </div>
                <p className="text-white/20 text-sm">Quiet so far — first activity will appear here</p>
              </div>
            : <div className="space-y-0.5">
                {data.recentActivity.slice(0, 12).map((ev, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition group cursor-pointer">
                    <span className="text-sm shrink-0">{actionIcon(ev.action)}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-white/60 font-medium">{ev.email ? ev.email.split('@')[0] : 'anon'}</span>
                      <span className="text-xs text-white/25 ml-1">{actionLabel(ev.action)}</span>
                    </div>
                    <span className="text-[10px] text-white/15 shrink-0 group-hover:text-white/35 transition">{relTime(ev.created_at)}</span>
                  </div>
                ))}
              </div>
          }
        </div>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5">
          <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider mb-4">Quick Actions</p>
          <div className="space-y-2">
            {[
              { icon: Download, label: 'Export users (CSV)', href: '/api/admin/export-users', color: 'text-blue-400' },
              { icon: Users, label: 'All users', href: '/admin/users', color: 'text-violet-400' },
              { icon: Crown, label: 'Paid users', href: '/admin/billing', color: 'text-amber-400' },
              { icon: AlertTriangle, label: 'Churn report', href: '/admin/billing', color: 'text-red-400' },
              { icon: TrendingUp, label: 'Full funnel', href: '/admin/funnel', color: 'text-emerald-400' },
              { icon: DollarSign, label: 'Billing details', href: '/admin/billing', color: 'text-fuchsia-400' },
            ].map((a) => (
              <Link key={a.label} href={a.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all group">
                <a.icon className={`h-3.5 w-3.5 ${a.color} shrink-0`} />
                <span className="text-xs font-medium text-white/50 group-hover:text-white/80 transition flex-1">{a.label}</span>
                <ArrowRight className="h-3 w-3 text-white/10 group-hover:text-white/35 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── 6. AI Performance ── */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-4 w-4 text-violet-400/60" />
          <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider">Coach Intelligence</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'All-Time Gens', value: data.generations.total.toLocaleString() },
            { label: 'Avg / User', value: data.totalUsers > 0 ? (data.generations.total / data.totalUsers).toFixed(1) : '0' },
            { label: 'Today', value: data.generations.h24.toString() },
            { label: 'Last 30d', value: data.generations.d30.toString() },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.05] text-center">
              <p className="text-[10px] text-white/25 uppercase mb-1">{s.label}</p>
              <p className="text-lg font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-500/[0.05] border border-violet-500/10">
          <span className="text-base shrink-0">💡</span>
          <p className="text-xs text-white/40 leading-relaxed">
            {data.activationRate < 40
              ? `Activation is ${data.activationRate}% — consider highlighting Screenshot Upload in onboarding. Users who upload are 3× more likely to activate.`
              : data.conversionRate < 10
              ? `Conversion is ${data.conversionRate}%. Your activated users are your warmest leads — a paywall nudge after their 3rd generation could lift this significantly.`
              : `Strong ${data.conversionRate}% conversion. Your next lever is reducing churn — ${data.churn.d30} cancelations in the last 30 days.`
            }
          </p>
        </div>
      </div>
    </div>
  );
}
