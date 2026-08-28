'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  DollarSign,
  ExternalLink,
  Link2,
  Loader2,
  MessageCircle,
  Plus,
  Radar,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';

type NullableNumber = number | null;

type Stage = { key: string; label: string; count: NullableNumber; source: string };
type Bottleneck = {
  type: string;
  severity: string;
  title: string;
  detail: string;
  nextAction: string;
  from: string | null;
  to: string | null;
  conversion: NullableNumber;
  drop: NullableNumber;
};
type RevenueWindow = { visitors: number; replies: number; signups: number; paidUsers: number };
type Creative = {
  videoId: string;
  platform: string;
  title: string | null;
  hook: string | null;
  avatar: string | null;
  cta: string | null;
  status: string;
  views: NullableNumber;
  profileVisits: NullableNumber;
  bioClicks: NullableNumber;
  siteVisits: number;
  replies: number;
  signups: number;
  paidConversions: number;
  paidPerThousandViews: NullableNumber;
  metricsImported: boolean;
  lastMetricDate: string | null;
  notes: string | null;
};
type Lead = {
  id: string;
  platform: string;
  handle: string | null;
  source_video_id: string | null;
  status: string;
  comment_text: string | null;
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
};
type Cohort = {
  cohort: string;
  size: number;
  activated24h: number;
  secondSession7d: number;
  upgraded14d: number;
  churnedAfterPayment: number;
  activationRate: NullableNumber;
  secondSessionRate: NullableNumber;
  upgradeRate: NullableNumber;
  churnRate: NullableNumber;
};
type GrowthData = {
  setupRequired: boolean;
  setupMessage: string | null;
  range: { days: number; since: string; generatedAt: string };
  revenue: {
    current: { externalVisitors: number; replySuccesses: number; signups: number; paidUsers: number; mrr: number };
    windows: { h24: RevenueWindow; d7: RevenueWindow; previous7: RevenueWindow; d30: RevenueWindow };
    rates: { visitorToReply: NullableNumber; visitorToSignup: NullableNumber; signupToPaid: NullableNumber };
  };
  funnel: { stages: Stage[]; bottleneck: Bottleneck; bySource: Array<{ source: string; visitors: number; landingSessions: number; composerStarts: number; replySuccesses: number; signups: number; paid: number }> };
  creatives: Creative[];
  leads: Lead[];
  cohorts: Cohort[];
  measurement: {
    visitorIdCoverage: NullableNumber;
    visitorIdEvents: number;
    anonymousEvents: number;
    missingUtmPageViews: number;
    pageViews: number;
    unknownSourcePageViews: number;
    missingSessionEvents: number;
    trackingErrors: number;
    lastEventReceived: string | null;
    queryTruncated: boolean;
    importedMetricRows: number;
    importedMetricDays: number;
    unknownCreativeRows: number;
    sourceCoverage: NullableNumber;
  };
  definitions: Record<string, string>;
  dataQuality: { rawEvents: number; externalEvents: number; internalExcluded: number; currentMrr: number; activePaidUsers: number; querySince: string };
};

const LEAD_STATUSES = ['new', 'replied', 'clicked', 'tried', 'signed_up', 'paid', 'closed'];
const RANGES = [7, 30, 90];

function displayNumber(value: NullableNumber | undefined) {
  return value == null ? '--' : value.toLocaleString();
}

function displayRate(value: NullableNumber | undefined) {
  return value == null ? '--' : `${value}%`;
}

function displayMoney(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function displayDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '--';
}

function inputClass() {
  return 'w-full rounded-xl bg-white/[0.04] border border-white/[0.10] px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-400/50';
}

function panelClass() {
  return 'rounded-2xl border border-white/[0.08] bg-white/[0.03]';
}

function toneForSeverity(severity: string) {
  if (severity === 'critical') return { border: 'border-red-500/30', bg: 'bg-red-500/[0.08]', text: 'text-red-300', icon: XCircle };
  if (severity === 'high') return { border: 'border-amber-500/30', bg: 'bg-amber-500/[0.08]', text: 'text-amber-300', icon: AlertTriangle };
  return { border: 'border-cyan-500/25', bg: 'bg-cyan-500/[0.06]', text: 'text-cyan-300', icon: Activity };
}

function MetricCard({ label, value, sub, color = 'text-white' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">{label}</p>
      <p className={`mt-1 text-2xl font-black ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-[11px] text-white/35">{sub}</p>}
    </div>
  );
}

function HealthRow({ label, value, detail, good }: { label: string; value: string; detail: string; good: boolean }) {
  return (
    <div className="flex items-start gap-3 border-b border-white/[0.06] py-3 last:border-0">
      {good ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-white/75">{label}</p>
          <p className={`shrink-0 text-sm font-bold ${good ? 'text-emerald-300' : 'text-amber-300'}`}>{value}</p>
        </div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-white/35">{detail}</p>
      </div>
    </div>
  );
}

export default function GrowthCommandCenterPage() {
  const [data, setData] = useState<GrowthData | null>(null);
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);
  const [metricForm, setMetricForm] = useState({
    video_id: '', platform: 'tiktok', metric_date: new Date().toISOString().slice(0, 10),
    title: '', hook: '', avatar: '', cta: '', status: 'active',
    views: '', profile_visits: '', bio_clicks: '', likes: '', comments: '', shares: '', saves: '', notes: '',
  });
  const [leadForm, setLeadForm] = useState({ platform: 'tiktok', handle: '', source_video_id: '', status: 'new', comment_text: '', notes: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/growth?days=${range}`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Failed to load growth data');
      setData(body);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load growth data');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const postAction = async (payload: Record<string, unknown>) => {
    setSaving(true);
    setActionError('');
    try {
      const response = await fetch('/api/admin/growth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Action failed');
      await fetchData();
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveCreative = async (event: FormEvent) => {
    event.preventDefault();
    if (!metricForm.video_id.trim()) return setActionError('Add a video_id before saving creative metadata.');
    await postAction({ action: 'save_creative', ...metricForm });
  };

  const saveMetric = async (event: FormEvent) => {
    event.preventDefault();
    if (!metricForm.video_id.trim()) return setActionError('Add a video_id before saving a metric snapshot.');
    const saved = await postAction({ action: 'save_metric', ...metricForm });
    if (saved) setMetricForm(form => ({ ...form, views: '', profile_visits: '', bio_clicks: '', likes: '', comments: '', shares: '', saves: '', notes: '' }));
  };

  const addLead = async (event: FormEvent) => {
    event.preventDefault();
    if (!leadForm.platform.trim()) return setActionError('Choose the lead platform.');
    const saved = await postAction({ action: 'add_lead', ...leadForm });
    if (saved) setLeadForm(form => ({ ...form, handle: '', source_video_id: '', comment_text: '', notes: '' }));
  };

  if (loading && !data) return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></div>;
  if (error && !data) return <div className="space-y-3 py-32 text-center"><p className="text-sm text-red-300">{error}</p><button onClick={fetchData} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70">Retry</button></div>;
  if (!data) return null;

  const severity = toneForSeverity(data.funnel.bottleneck.severity);
  const SeverityIcon = severity.icon;
  const current = data.revenue.current;
  const windows = data.revenue.windows;
  const previous = windows.previous7;
  const growthPct = (currentValue: number, previousValue: number) => previousValue ? Math.round(((currentValue - previousValue) / previousValue) * 100) : currentValue ? 100 : 0;
  const leadCounts = LEAD_STATUSES.map(status => ({ status, count: data.leads.filter(lead => lead.status === status).length }));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2"><Radar className="h-6 w-6 text-fuchsia-400" /><h1 className="text-2xl font-black text-white">Growth OS</h1></div>
            <span className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">Revenue control room</span>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/45">One source of truth for acquisition, creative quality, social leads, retention, and measurement health.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
            {RANGES.map(value => <button key={value} onClick={() => setRange(value)} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${range === value ? 'bg-violet-500/20 text-violet-200' : 'text-white/35 hover:text-white/70'}`}>{value}d</button>)}
          </div>
          <button onClick={fetchData} className="flex items-center gap-1.5 rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-500/20"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
        </div>
      </div>

      {data.setupRequired && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] p-4 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <div><p className="font-bold">Growth storage is not fully enabled yet.</p><p className="mt-1 text-xs leading-relaxed text-amber-100/65">{data.setupMessage} The page is still showing first-party data, but metric snapshots and lead mutations will remain unavailable until the migration runs.</p></div>
        </div>
      )}
      {actionError && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{actionError}</div>}

      <section className={`${panelClass()} ${severity.border} ${severity.bg} overflow-hidden`}>
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className={`rounded-xl border border-white/10 bg-black/10 p-2.5 ${severity.text}`}><SeverityIcon className="h-5 w-5" /></div>
            <div><p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Next best action</p><h2 className="mt-1 text-lg font-black text-white">{data.funnel.bottleneck.title}</h2><p className="mt-1 text-sm text-white/60">{data.funnel.bottleneck.detail}</p><p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-white/85"><span className={severity.text}>Do this:</span> {data.funnel.bottleneck.nextAction}</p></div>
          </div>
          <Link href="/admin/links" className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs font-semibold text-white/60 hover:text-white">Build tracked links <ExternalLink className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-white/[0.08] bg-white/[0.06] sm:grid-cols-4 lg:grid-cols-8">
          {data.funnel.stages.map(stage => <div key={stage.key} className="bg-black/10 p-3"><p className="truncate text-[10px] font-semibold text-white/35">{stage.label}</p><p className="mt-1 text-lg font-black text-white">{displayNumber(stage.count)}</p><p className="truncate text-[9px] text-white/25">{stage.source}</p></div>)}
        </div>
      </section>

      <section className={panelClass()}>
        <div className="flex flex-col gap-1 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-400" /><h2 className="text-sm font-bold text-white/85">Revenue Funnel Header</h2></div><p className="mt-1 text-xs text-white/35">External visitors -&gt; reply successes -&gt; signups -&gt; paid users -&gt; MRR. Counts are period-aware; MRR is current active/trialing revenue.</p></div><span className="text-[10px] text-white/25">{data.range.days}d view</span></div>
        <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-5">
          <MetricCard label="External visitors" value={displayNumber(current.externalVisitors)} sub={`${displayNumber(windows.d7.visitors)} in 7d`} color="text-blue-300" />
          <MetricCard label="Reply successes" value={displayNumber(current.replySuccesses)} sub={`${displayRate(data.revenue.rates.visitorToReply)} visitor -> reply`} color="text-fuchsia-300" />
          <MetricCard label="Signups" value={displayNumber(current.signups)} sub={`${displayRate(data.revenue.rates.visitorToSignup)} visitor -> signup`} color="text-amber-300" />
          <MetricCard label="Paid users" value={displayNumber(current.paidUsers)} sub={`${displayRate(data.revenue.rates.signupToPaid)} selected-period signup -> paid`} color="text-emerald-300" />
          <MetricCard label="MRR" value={displayMoney(current.mrr)} sub={`${displayMoney(current.mrr * 12)} ARR run-rate`} color="text-white" />
        </div>
        <div className="overflow-x-auto border-t border-white/[0.07]"><table className="w-full min-w-[680px] text-xs"><thead><tr className="text-[10px] uppercase tracking-wider text-white/30"><th className="px-5 py-3 text-left">Window</th><th className="px-3 py-3 text-right">Visitors</th><th className="px-3 py-3 text-right">Replies</th><th className="px-3 py-3 text-right">Signups</th><th className="px-3 py-3 text-right">New paid</th><th className="px-5 py-3 text-right">vs prior 7d</th></tr></thead><tbody>
          {([['24h', windows.h24, null], ['7d', windows.d7, previous], ['30d', windows.d30, null]] as Array<[string, RevenueWindow, RevenueWindow | null]>).map(([label, window, compare]) => <tr key={label} className="border-t border-white/[0.05] text-white/65"><td className="px-5 py-3 font-semibold text-white/80">{label}</td><td className="px-3 py-3 text-right">{window.visitors.toLocaleString()}</td><td className="px-3 py-3 text-right">{window.replies.toLocaleString()}</td><td className="px-3 py-3 text-right">{window.signups.toLocaleString()}</td><td className="px-3 py-3 text-right text-emerald-300">{window.paidUsers.toLocaleString()}</td><td className="px-5 py-3 text-right">{compare ? <span className={growthPct(window.signups, compare.signups) >= 0 ? 'text-emerald-300' : 'text-red-300'}>{growthPct(window.signups, compare.signups) >= 0 ? '+' : ''}{growthPct(window.signups, compare.signups)}% signups</span> : <span className="text-white/25">--</span>}</td></tr>)}
        </tbody></table></div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className={`${panelClass()} p-5`}><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-400" /><h2 className="text-sm font-bold text-white/85">Measurement Health</h2></div><p className="mt-1 text-xs text-white/35">A green dashboard with incomplete instrumentation is worse than an honest warning.</p><div className="mt-3">
          <HealthRow label="Visitor-ID coverage" value={displayRate(data.measurement.visitorIdCoverage)} detail={`${data.measurement.visitorIdEvents.toLocaleString()} of ${data.measurement.anonymousEvents.toLocaleString()} anonymous events carry a durable first-party ID.`} good={(data.measurement.visitorIdCoverage ?? 0) >= 90 || data.measurement.anonymousEvents === 0} />
          <HealthRow label="UTM coverage" value={data.measurement.pageViews ? `${Math.max(0, Math.round((1 - data.measurement.missingUtmPageViews / data.measurement.pageViews) * 1000) / 10)}%` : '--'} detail={`${data.measurement.missingUtmPageViews.toLocaleString()} of ${data.measurement.pageViews.toLocaleString()} page views have no source parameter.`} good={data.measurement.missingUtmPageViews === 0} />
          <HealthRow label="Unknown sources" value={displayNumber(data.measurement.unknownSourcePageViews)} detail="Direct/unknown traffic cannot be used to rank social creative." good={data.measurement.unknownSourcePageViews === 0} />
          <HealthRow label="Session IDs missing" value={displayNumber(data.measurement.missingSessionEvents)} detail="Session IDs are required for trustworthy landing-to-composer conversion." good={data.measurement.missingSessionEvents === 0} />
          <HealthRow label="Recorded flow errors" value={displayNumber(data.measurement.trackingErrors)} detail="Reply, screenshot, or checkout errors that reached first-party analytics. Delivery failures are kept separate because they never reach the event table." good={data.measurement.trackingErrors === 0} />
          <HealthRow label="Last event received" value={displayDate(data.measurement.lastEventReceived)} detail={`${data.measurement.importedMetricRows} platform metric rows across ${data.measurement.importedMetricDays} dates.`} good={Boolean(data.measurement.lastEventReceived)} />
        </div></section>

        <section className={`${panelClass()} p-5`}><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-violet-400" /><h2 className="text-sm font-bold text-white/85">Acquisition Sources</h2></div><p className="mt-1 text-xs text-white/35">First-party source attribution for the selected window.</p><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[500px] text-xs"><thead><tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-wider text-white/30"><th className="py-2 text-left">Source</th><th className="py-2 text-right">Visitors</th><th className="py-2 text-right">Starts</th><th className="py-2 text-right">Replies</th><th className="py-2 text-right">Paid</th></tr></thead><tbody>{data.funnel.bySource.length ? data.funnel.bySource.map(source => <tr key={source.source} className="border-b border-white/[0.05] text-white/60"><td className="py-2.5 font-semibold capitalize text-white/75">{source.source.replace(/_/g, ' ')}</td><td className="py-2.5 text-right">{source.visitors}</td><td className="py-2.5 text-right">{source.composerStarts}</td><td className="py-2.5 text-right">{source.replySuccesses}</td><td className="py-2.5 text-right text-emerald-300">{source.paid}</td></tr>) : <tr><td colSpan={5} className="py-8 text-center text-white/25">No attributed sources yet.</td></tr>}</tbody></table></div></section>
      </div>

      <section className={panelClass()}><div className="flex flex-col gap-2 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-fuchsia-400" /><h2 className="text-sm font-bold text-white/85">Creative Revenue Leaderboard</h2></div><p className="mt-1 text-xs leading-relaxed text-white/35">Ranked by paid customers per 1,000 imported views. Site outcomes are joined from the first-party <code className="text-fuchsia-300/70">video_id</code>; platform views/profile/bio metrics must be imported below.</p></div><Link href="/admin/links" className="flex items-center gap-1 text-xs font-semibold text-violet-300 hover:text-violet-200">Create tracked video link <ArrowRight className="h-3.5 w-3.5" /></Link></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-xs"><thead><tr className="border-b border-white/[0.07] bg-white/[0.02] text-[10px] uppercase tracking-wider text-white/30"><th className="px-5 py-3 text-left">Creative</th><th className="px-3 py-3 text-left">Platform</th><th className="px-3 py-3 text-right">Views</th><th className="px-3 py-3 text-right">Profile</th><th className="px-3 py-3 text-right">Bio</th><th className="px-3 py-3 text-right">Site</th><th className="px-3 py-3 text-right">Replies</th><th className="px-3 py-3 text-right">Signups</th><th className="px-3 py-3 text-right">Paid</th><th className="px-5 py-3 text-right">Paid / 1k</th></tr></thead><tbody>{data.creatives.length ? data.creatives.map((creative, index) => <tr key={`${creative.videoId}-${creative.platform}`} className="border-b border-white/[0.05] hover:bg-white/[0.025]"><td className="px-5 py-3"><div className="flex items-start gap-2"><span className="mt-0.5 w-5 font-mono text-white/25">{index + 1}</span><div><p className="font-mono font-semibold text-white/80">{creative.videoId}</p><p className="mt-0.5 max-w-[240px] truncate text-[10px] text-white/35">{creative.title || creative.hook || 'No creative metadata yet'}</p><p className="mt-1 text-[9px] text-white/25">{creative.metricsImported ? `imported ${displayDate(creative.lastMetricDate)}` : 'first-party only'}</p></div></div></td><td className="px-3 py-3 capitalize text-white/60">{creative.platform}</td><td className="px-3 py-3 text-right font-mono text-white/70">{displayNumber(creative.views)}</td><td className="px-3 py-3 text-right font-mono text-white/60">{displayNumber(creative.profileVisits)}</td><td className="px-3 py-3 text-right font-mono text-white/60">{displayNumber(creative.bioClicks)}</td><td className="px-3 py-3 text-right font-mono text-cyan-300">{creative.siteVisits}</td><td className="px-3 py-3 text-right font-mono text-fuchsia-300">{creative.replies}</td><td className="px-3 py-3 text-right font-mono text-amber-300">{creative.signups}</td><td className="px-3 py-3 text-right font-mono font-bold text-emerald-300">{creative.paidConversions}</td><td className="px-5 py-3 text-right font-mono font-bold text-emerald-200">{displayRate(creative.paidPerThousandViews)}</td></tr>) : <tr><td colSpan={10} className="py-12 text-center text-white/25">No video_id has reached the site yet. Use Campaign Links to tag the next cohort.</td></tr>}</tbody></table></div>
        <details className="border-t border-white/[0.07] p-5"><summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-white/70"><Plus className="h-4 w-4 text-fuchsia-400" />Register a creative or import a dated platform snapshot</summary><form className="mt-4 space-y-4" onSubmit={saveMetric}><div className="grid grid-cols-1 gap-3 md:grid-cols-3"><input className={inputClass()} placeholder="video_id e.g. tw-051" value={metricForm.video_id} onChange={event => setMetricForm(form => ({ ...form, video_id: event.target.value }))} /><select className={inputClass()} value={metricForm.platform} onChange={event => setMetricForm(form => ({ ...form, platform: event.target.value }))}><option value="tiktok">TikTok</option><option value="youtube">YouTube</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option></select><input type="date" className={inputClass()} value={metricForm.metric_date} onChange={event => setMetricForm(form => ({ ...form, metric_date: event.target.value }))} /></div><div className="grid grid-cols-1 gap-3 md:grid-cols-4"><input className={inputClass()} placeholder="Title" value={metricForm.title} onChange={event => setMetricForm(form => ({ ...form, title: event.target.value }))} /><input className={inputClass()} placeholder="Hook variant" value={metricForm.hook} onChange={event => setMetricForm(form => ({ ...form, hook: event.target.value }))} /><input className={inputClass()} placeholder="Avatar" value={metricForm.avatar} onChange={event => setMetricForm(form => ({ ...form, avatar: event.target.value }))} /><input className={inputClass()} placeholder="CTA" value={metricForm.cta} onChange={event => setMetricForm(form => ({ ...form, cta: event.target.value }))} /></div><div className="grid grid-cols-2 gap-3 md:grid-cols-7">{(['views', 'profile_visits', 'bio_clicks', 'likes', 'comments', 'shares', 'saves'] as const).map(field => <input key={field} type="number" min="0" className={inputClass()} placeholder={field.replace(/_/g, ' ')} value={metricForm[field]} onChange={event => setMetricForm(form => ({ ...form, [field]: event.target.value }))} />)}</div><div className="flex flex-wrap items-center gap-2"><button disabled={saving} type="submit" className="flex items-center gap-1.5 rounded-lg bg-fuchsia-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BarChart3 className="h-3.5 w-3.5" />}Save snapshot</button><button disabled={saving} type="button" onClick={saveCreative} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/60 disabled:opacity-50">Save metadata only</button><span className="text-[10px] text-white/30">Platform exports are usually cumulative. Import the latest total for each post/platform/date; the leaderboard uses the newest snapshot so it never double-counts prior snapshots.</span></div></form></details>
      </section>

      <section className={panelClass()}><div className="border-b border-white/[0.07] p-5"><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-cyan-400" /><h2 className="text-sm font-bold text-white/85">Signup Cohort Retention</h2></div><p className="mt-1 text-xs leading-relaxed text-white/35">Grouped by UTC signup week. This separates a busy acquisition day from users who actually return, upgrade, and stay.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-xs"><thead><tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-wider text-white/30"><th className="px-5 py-3 text-left">Cohort</th><th className="px-3 py-3 text-right">Size</th><th className="px-3 py-3 text-right">Reply &lt;=24h</th><th className="px-3 py-3 text-right">2nd session &lt;=7d</th><th className="px-3 py-3 text-right">Upgrade &lt;=14d</th><th className="px-3 py-3 text-right">Churned</th></tr></thead><tbody>{data.cohorts.length ? data.cohorts.map(cohort => <tr key={cohort.cohort} className="border-b border-white/[0.05] text-white/65"><td className="px-5 py-3 font-semibold text-white/80">Week of {displayDate(cohort.cohort)}</td><td className="px-3 py-3 text-right font-mono">{cohort.size}</td><td className="px-3 py-3 text-right"><span className="font-mono text-emerald-300">{cohort.activated24h}</span><span className="ml-1 text-white/35">({displayRate(cohort.activationRate)})</span></td><td className="px-3 py-3 text-right"><span className="font-mono text-cyan-300">{cohort.secondSession7d}</span><span className="ml-1 text-white/35">({displayRate(cohort.secondSessionRate)})</span></td><td className="px-3 py-3 text-right"><span className="font-mono text-amber-300">{cohort.upgraded14d}</span><span className="ml-1 text-white/35">({displayRate(cohort.upgradeRate)})</span></td><td className="px-3 py-3 text-right"><span className="font-mono text-red-300">{cohort.churnedAfterPayment}</span><span className="ml-1 text-white/35">({displayRate(cohort.churnRate)})</span></td></tr>) : <tr><td colSpan={6} className="py-12 text-center text-white/25">No external signup cohorts in this range.</td></tr>}</tbody></table></div></section>

      <section className={panelClass()}><div className="flex flex-col gap-2 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-amber-400" /><h2 className="text-sm font-bold text-white/85">DM / Comment Lead Queue</h2></div><p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/35">Record real social conversations, then move each lead through replied, clicked, tried, signed up, and paid. Platform DMs are intentionally manual; this prevents pretending the site has access it does not have.</p></div><div className="flex flex-wrap gap-1.5">{leadCounts.map(item => <span key={item.status} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] text-white/45">{item.status.replace('_', ' ')} {item.count}</span>)}</div></div><div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-[340px_1fr]"><form onSubmit={addLead} className="space-y-3"><p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Add conversation</p><div className="grid grid-cols-2 gap-2"><select className={inputClass()} value={leadForm.platform} onChange={event => setLeadForm(form => ({ ...form, platform: event.target.value }))}><option value="tiktok">TikTok</option><option value="youtube">YouTube</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option></select><select className={inputClass()} value={leadForm.status} onChange={event => setLeadForm(form => ({ ...form, status: event.target.value }))}>{LEAD_STATUSES.map(status => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}</select></div><input className={inputClass()} placeholder="Handle (optional)" value={leadForm.handle} onChange={event => setLeadForm(form => ({ ...form, handle: event.target.value }))} /><input className={inputClass()} placeholder="Source video_id (optional)" value={leadForm.source_video_id} onChange={event => setLeadForm(form => ({ ...form, source_video_id: event.target.value }))} /><textarea className={`${inputClass()} min-h-[80px] resize-y`} placeholder="Comment or DM summary" value={leadForm.comment_text} onChange={event => setLeadForm(form => ({ ...form, comment_text: event.target.value }))} /><textarea className={`${inputClass()} min-h-[60px] resize-y`} placeholder="Follow-up notes" value={leadForm.notes} onChange={event => setLeadForm(form => ({ ...form, notes: event.target.value }))} /><button disabled={saving} type="submit" className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2.5 text-xs font-black text-black disabled:opacity-50"><Plus className="h-3.5 w-3.5" />Add lead</button></form><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-xs"><thead><tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-wider text-white/30"><th className="py-2 text-left">Lead</th><th className="py-2 text-left">Source</th><th className="py-2 text-left">Conversation</th><th className="py-2 text-left">Stage</th><th className="py-2 text-right">Updated</th></tr></thead><tbody>{data.leads.length ? data.leads.map(lead => <tr key={lead.id} className="border-b border-white/[0.05] align-top text-white/60"><td className="py-3 pr-3"><p className="font-semibold text-white/80">{lead.handle || 'unnamed lead'}</p><p className="mt-0.5 capitalize text-[10px] text-white/30">{lead.platform}</p></td><td className="py-3 pr-3 font-mono text-[10px] text-violet-300/70">{lead.source_video_id || '--'}</td><td className="max-w-[280px] py-3 pr-3"><p className="line-clamp-2 text-white/55">{lead.comment_text || 'No comment captured'}</p>{lead.notes && <p className="mt-1 line-clamp-1 text-[10px] text-white/25">{lead.notes}</p>}</td><td className="py-3 pr-3"><select className="rounded-lg border border-white/10 bg-[#15131f] px-2 py-1 text-[11px] capitalize text-white/70" value={lead.status} disabled={saving} onChange={event => postAction({ action: 'update_lead', id: lead.id, platform: lead.platform, status: event.target.value, notes: lead.notes || '' })}>{LEAD_STATUSES.map(status => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}</select></td><td className="py-3 text-right text-[10px] text-white/30">{displayDate(lead.updated_at)}</td></tr>) : <tr><td colSpan={5} className="py-12 text-center text-white/25">No leads logged yet. Add every genuine comment that deserves a human reply.</td></tr>}</tbody></table></div></div></section>

      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"><div className="flex items-start gap-3"><Target className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-400" /><div><h2 className="text-sm font-bold text-white/80">Operating rule</h2><p className="mt-1 text-xs leading-relaxed text-white/40">Do not scale the top-viewed creative until it also wins on profile intent, first-party site starts, successful replies, or paid customers. Import native platform numbers daily, tag every post with a unique <code className="text-fuchsia-300/70">video_id</code>, and review the bottleneck at 24h and 72h.</p><div className="mt-3 flex flex-wrap gap-3 text-[10px] text-white/30"><span>Events: {data.dataQuality.externalEvents.toLocaleString()} external</span><span>Excluded: {data.dataQuality.internalExcluded.toLocaleString()} internal/bot</span><span>Active paid: {data.dataQuality.activePaidUsers}</span><Link href="/admin/funnel" className="inline-flex items-center gap-1 text-violet-300 hover:text-violet-200">Open canonical funnel <ArrowRight className="h-3 w-3" /></Link><Link href="/admin/people" className="inline-flex items-center gap-1 text-violet-300 hover:text-violet-200">Open people <Users className="h-3 w-3" /></Link></div></div></div></section>
    </div>
  );
}
