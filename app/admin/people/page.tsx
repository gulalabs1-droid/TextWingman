'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Loader2, Search, RefreshCw, UserPlus, Ghost, Zap, Globe,
  Smartphone, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Calendar,
} from 'lucide-react';

type Person = {
  person_key: string;
  is_registered: boolean;
  user_id: string | null;
  email: string | null;
  channel: string;
  activated: boolean;
  first_seen: string;
  last_seen: string;
  events: number;
  page_views: number;
  product_actions: number;
  replies: number;
  landing_page: string | null;
  first_referrer: string | null;
  utm_campaign: string | null;
  video_id: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  last_ip: string | null;
};

type Week = {
  week_start: string;
  new_people: number;
  new_anonymous: number;
  new_registered: number;
  activated: number;
  took_action: number;
  total_replies: number;
  total_page_views: number;
};

type Tally = { label: string; count: number; activated: number };

type Data = {
  kpis: {
    totalPeople: number; totalAnon: number; totalRegistered: number;
    totalActivated: number; activationRate: number;
    newThisWeek: number; newLastWeek: number; wowPct: number; activatedThisWeek: number;
  };
  weeks: Week[];
  sources: Tally[];
  devices: Tally[];
  countries: Tally[];
  landingPages: Tally[];
  people: Person[];
  total: number;
  page: number;
  limit: number;
};

const RANGES = [
  { v: '7', label: '7d' },
  { v: '30', label: '30d' },
  { v: '90', label: '90d' },
  { v: 'all', label: 'All' },
];

const TYPES = [
  { v: 'all', label: 'Everyone' },
  { v: 'anon', label: 'Anonymous' },
  { v: 'registered', label: 'Registered' },
];

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function PeoplePage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState('30');
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ range, type, page: String(page) });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/people?${params}`);
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
      setError('');
    } catch {
      setError('Failed to load people data');
    } finally {
      setLoading(false);
    }
  }, [range, type, search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const kpis = data?.kpis;
  const totalPages = data ? Math.ceil(data.total / data.limit) || 1 : 1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">People</h1>
          <p className="text-sm text-white/50">
            Everyone who touched the product — including anonymous users with no account.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5">
            {RANGES.map(r => (
              <button
                key={r.v}
                onClick={() => { setRange(r.v); setPage(1); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  range === r.v ? 'bg-violet-500/20 text-violet-300' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="New this week"
            value={kpis.newThisWeek}
            sub={`vs ${kpis.newLastWeek} last week`}
            icon={UserPlus}
            color="text-blue-400"
            bg="bg-blue-500/10"
            growth={kpis.wowPct}
          />
          <KpiCard
            label="Anonymous"
            value={kpis.totalAnon}
            sub={`${kpis.totalRegistered} registered`}
            icon={Ghost}
            color="text-fuchsia-400"
            bg="bg-fuchsia-500/10"
          />
          <KpiCard
            label="Activated"
            value={kpis.totalActivated}
            sub={`${kpis.activationRate}% generated a reply`}
            icon={Zap}
            color="text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <KpiCard
            label="Total people"
            value={kpis.totalPeople}
            sub={`in selected range`}
            icon={Globe}
            color="text-violet-400"
            bg="bg-violet-500/10"
          />
        </div>
      )}

      {/* Weekly new-person summary */}
      {data && data.weeks.length > 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.08] bg-white/[0.02]">
            <Calendar className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white/80">Weekly new-person summary</h2>
            <span className="text-[11px] text-white/30">last {data.weeks.length} weeks</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-white/40">
                  <th className="text-left px-4 py-2 font-medium">Week of</th>
                  <th className="text-right px-4 py-2 font-medium">New</th>
                  <th className="text-right px-4 py-2 font-medium">Anon</th>
                  <th className="text-right px-4 py-2 font-medium">Signed up</th>
                  <th className="text-right px-4 py-2 font-medium">Activated</th>
                  <th className="text-right px-4 py-2 font-medium">Replies</th>
                  <th className="text-right px-4 py-2 font-medium">Act. rate</th>
                </tr>
              </thead>
              <tbody>
                {data.weeks.map((w, i) => {
                  const rate = w.new_people > 0 ? Math.round((w.activated / w.new_people) * 100) : 0;
                  return (
                    <tr
                      key={w.week_start}
                      className={`border-b border-white/[0.04] ${i === 0 ? 'bg-violet-500/[0.06]' : ''}`}
                    >
                      <td className="px-4 py-2 text-white/80">
                        {new Date(w.week_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        {i === 0 && <span className="ml-2 text-[10px] text-violet-300 font-semibold">current</span>}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-white font-semibold">{w.new_people}</td>
                      <td className="px-4 py-2 text-right font-mono text-fuchsia-300/80">{w.new_anonymous}</td>
                      <td className="px-4 py-2 text-right font-mono text-blue-300/80">{w.new_registered}</td>
                      <td className="px-4 py-2 text-right font-mono text-emerald-300/80">{w.activated}</td>
                      <td className="px-4 py-2 text-right font-mono text-white/50">{w.total_replies}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`font-mono text-xs ${rate >= 20 ? 'text-emerald-400' : rate > 0 ? 'text-amber-400' : 'text-white/30'}`}>
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Breakdowns */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <BreakdownCard title="Where they came from" icon={TrendingUp} rows={data.sources} />
          <BreakdownCard title="Device" icon={Smartphone} rows={data.devices} />
          <BreakdownCard title="Country" icon={Globe} rows={data.countries} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
          className="flex gap-2 flex-1 min-w-[260px]"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search email, source, country, city, device, IP…"
              className="w-full pl-9 pr-3 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/40"
            />
          </div>
          <button type="submit" className="px-3 h-9 rounded-lg bg-white/[0.06] border border-white/[0.10] text-white/70 text-xs font-medium hover:bg-white/[0.10] transition">
            Search
          </button>
        </form>
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5">
          {TYPES.map(t => (
            <button
              key={t.v}
              onClick={() => { setType(t.v); setPage(1); }}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                type === t.v ? 'bg-violet-500/20 text-violet-300' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* People table */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.04] text-white/50">
                <th className="text-left px-4 py-3 font-medium">Person</th>
                <th className="text-left px-4 py-3 font-medium">Source</th>
                <th className="text-left px-4 py-3 font-medium">Location</th>
                <th className="text-left px-4 py-3 font-medium">Device</th>
                <th className="text-right px-4 py-3 font-medium">Views</th>
                <th className="text-right px-4 py-3 font-medium">Replies</th>
                <th className="text-left px-4 py-3 font-medium">First seen</th>
                <th className="text-left px-4 py-3 font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12"><Loader2 className="h-6 w-6 text-violet-500 animate-spin mx-auto" /></td></tr>
              ) : !data || data.people.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-white/30">No people found in this range</td></tr>
              ) : data.people.map(p => (
                <tr key={p.person_key} className="border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.is_registered ? (
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400" title="Registered" />
                      ) : (
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-fuchsia-400" title="Anonymous" />
                      )}
                      <div className="min-w-0">
                        {p.user_id ? (
                          <Link href={`/admin/users/${p.user_id}`} className="font-medium text-white hover:text-violet-300 transition truncate block">
                            {p.email || 'registered user'}
                          </Link>
                        ) : (
                          <p className="font-medium text-white/70 truncate">Anonymous</p>
                        )}
                        <p className="text-[11px] text-white/30 font-mono truncate">{p.last_ip || '-'}</p>
                      </div>
                      {p.activated && (
                        <span className="ml-1 shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-white/60 border border-white/[0.08]">
                      {p.channel}
                    </span>
                    {p.utm_campaign && <p className="text-[10px] text-white/25 mt-0.5">{p.utm_campaign}</p>}
                    {p.video_id && <p className="text-[10px] text-violet-300/40 mt-0.5">vid: {p.video_id}</p>}
                  </td>
                  <td className="px-4 py-3 text-white/50 text-xs">
                    {p.country ? (
                      <>
                        <span className="text-white/70">{p.country}</span>
                        {p.city && <span className="text-white/35"> · {p.city}</span>}
                      </>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-white/50 text-xs">
                    {p.device || '-'}
                    {p.os && <span className="text-white/30"> · {p.os}</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white/60">{p.page_views}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className={p.replies > 0 ? 'text-emerald-400 font-semibold' : 'text-white/25'}>{p.replies}</span>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">{relTime(p.first_seen)}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">{relTime(p.last_seen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.total > data.limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.08] bg-white/[0.04]">
            <p className="text-xs text-white/50">Page {page} of {totalPages} · {data.total} people</p>
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg bg-white/[0.06] border border-white/[0.10] text-white/60 disabled:opacity-30 hover:bg-white/[0.10] transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg bg-white/[0.06] border border-white/[0.10] text-white/60 disabled:opacity-30 hover:bg-white/[0.10] transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-white/25 leading-relaxed">
        Anonymous people are grouped by browser fingerprint + IP. That is an approximation:
        the fingerprint is a hash of user-agent and language, so two different people on the
        same device model and network can merge, and one person switching networks can split.
        Treat anonymous counts as close, not exact.
      </p>
    </div>
  );
}

function KpiCard({
  label, value, sub, icon: Icon, color, bg, growth,
}: {
  label: string; value: number; sub: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; bg: string; growth?: number;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        {typeof growth === 'number' && growth !== 0 && (
          <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${growth > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(growth)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      <p className="text-xs text-white/50 mt-0.5">{label}</p>
      <p className="text-[11px] text-white/25 mt-0.5">{sub}</p>
    </div>
  );
}

function BreakdownCard({
  title, icon: Icon, rows,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  rows: Tally[];
}) {
  const top = rows.slice(0, 6);
  const max = Math.max(1, ...top.map(r => r.count));
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-3.5 w-3.5 text-white/40" />
        <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide">{title}</h3>
      </div>
      {top.length === 0 ? (
        <p className="text-xs text-white/25">No data</p>
      ) : (
        <div className="space-y-2">
          {top.map(r => (
            <div key={r.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-white/70 truncate pr-2">{r.label}</span>
                <span className="text-white/40 font-mono shrink-0">
                  {r.count}
                  {r.activated > 0 && <span className="text-emerald-400/70"> · {r.activated} act</span>}
                </span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                  style={{ width: `${(r.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
