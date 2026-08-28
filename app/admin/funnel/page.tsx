'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, RefreshCw, ArrowDown, ShieldCheck } from 'lucide-react';

type Period = {
  visitors: number;
  landingSessions: number;
  composerStarts: number;
  replyRequests: number;
  replySuccesses: number;
  uniqueReplyPeople: number;
  copies: number;
  replySends: number;
  signups: number;
  activatedSignups: number;
  paidSignups: number;
};

type FunnelData = {
  range: { days: number; since: string; generatedAt: string };
  period: Period;
  account: {
    registered: number;
    activated: number;
    paid: number;
    free: number;
    activationRate: number | null;
    paidRate: number | null;
    freeToPaidRate: number | null;
  };
  dataQuality: {
    queriedEvents: number;
    externalEvents: number;
    internalExcluded: number;
    queriedSuccessEvents: number;
    anonymousEventsWithVisitorId: number;
    anonymousEventsWithoutVisitorId: number;
    legacyEvents: number;
    queryTruncated: boolean;
  };
  bySource: Array<{
    source: string;
    visitors: number;
    landingSessions: number;
    composerStarts: number;
    replySuccesses: number;
    signups: number;
    paid: number;
  }>;
};

const rate = (value: number | null) => value == null ? '—' : `${value}%`;

function FunnelBars({ steps }: { steps: Array<{ label: string; count: number; color: string }> }) {
  const max = Math.max(...steps.map(step => step.count), 1);
  return (
    <div className="space-y-1">
      {steps.map((step, index) => {
        const previous = index > 0 ? steps[index - 1].count : null;
        const conversion = previous && previous > 0 ? Math.round((step.count / previous) * 1000) / 10 : null;
        const drop = conversion == null ? null : Math.round((100 - conversion) * 10) / 10;
        return (
          <div key={step.label}>
            {index > 0 && (
              <div className="flex items-center justify-center gap-2 py-1.5 text-xs text-white/40">
                <ArrowDown className="h-3 w-3" />
                <span>{conversion == null ? '—' : `${conversion}% continued`}</span>
                {drop != null && drop > 0 && <span className="text-red-400">({drop}% drop)</span>}
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/70 w-48 shrink-0 font-medium">{step.label}</span>
              <div className="flex-1 h-10 bg-white/[0.06] rounded-lg overflow-hidden">
                <div className={`h-full ${step.color} rounded-lg flex items-center px-3 transition-all duration-500`} style={{ width: `${Math.max((step.count / max) * 100, 10)}%` }}>
                  <span className="text-sm font-bold text-white">{step.count.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FunnelPage() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/funnel?days=30', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load funnel');
      setData(await response.json());
      setError('');
    } catch {
      setError('Failed to load canonical funnel data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-purple-600 animate-spin" /></div>;
  if (error || !data) return <div className="text-center text-red-400 py-20 space-y-3"><p>{error || 'No data'}</p><Button variant="outline" size="sm" onClick={fetchData}>Retry</Button></div>;

  const acquisitionSteps = [
    { label: 'External visitors', count: data.period.visitors, color: 'bg-blue-500' },
    { label: 'Landing sessions', count: data.period.landingSessions, color: 'bg-cyan-500' },
    { label: 'Composer starts', count: data.period.composerStarts, color: 'bg-violet-500' },
    { label: 'Reply successes', count: data.period.uniqueReplyPeople, color: 'bg-fuchsia-500' },
    { label: 'Signups', count: data.period.signups, color: 'bg-amber-500' },
    { label: 'Paid signups', count: data.period.paidSignups, color: 'bg-emerald-500' },
  ];
  const accountSteps = [
    { label: 'Registered users', count: data.account.registered, color: 'bg-blue-500' },
    { label: 'Activated users', count: data.account.activated, color: 'bg-violet-500' },
    { label: 'Paid users', count: data.account.paid, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Funnel</h1>
          <p className="text-sm text-white/50">Canonical external acquisition and account conversion, last {data.range.days} days</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-1.5" />Refresh</Button>
      </div>

      <Card className="border border-white/[0.08] bg-white/[0.03]">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-white/70 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-purple-400" />Acquisition Funnel</CardTitle></CardHeader>
        <CardContent><FunnelBars steps={acquisitionSteps} /><p className="mt-4 text-xs text-white/35">Requests: {data.period.replyRequests.toLocaleString()} · Successful replies: {data.period.replySuccesses.toLocaleString()} · Copies: {data.period.copies.toLocaleString()} · Marked sent: {data.period.replySends.toLocaleString()}</p></CardContent>
      </Card>

      <Card className="border border-white/[0.08] bg-white/[0.03]">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-white/70 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" />Account Funnel</CardTitle></CardHeader>
        <CardContent>
          <FunnelBars steps={accountSteps} />
          <div className="mt-6 pt-4 border-t border-white/[0.08] grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-500/10 rounded-lg"><p className="text-xs text-blue-400 font-medium">Activation Rate</p><p className="text-xl font-bold text-white">{rate(data.account.activationRate)}</p></div>
            <div className="p-3 bg-purple-500/10 rounded-lg"><p className="text-xs text-purple-400 font-medium">Free to Paid</p><p className="text-xl font-bold text-white">{rate(data.account.freeToPaidRate)}</p></div>
            <div className="p-3 bg-green-500/10 rounded-lg"><p className="text-xs text-green-400 font-medium">Registered to Paid</p><p className="text-xl font-bold text-white">{rate(data.account.paidRate)}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-white/[0.08] bg-white/[0.03]">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-white/70">Source Performance</CardTitle></CardHeader>
        <CardContent>
          {data.bySource.length === 0 ? <p className="text-sm text-white/35">No attributed external activity in this period.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-white/30"><th className="text-left py-2">Source</th><th className="text-right py-2">Visitors</th><th className="text-right py-2">Replies</th><th className="text-right py-2">Signups</th><th className="text-right py-2">Paid</th></tr></thead><tbody>{data.bySource.map(source => <tr key={source.source} className="border-b border-white/[0.05] text-white/60"><td className="py-2.5 capitalize">{source.source.replace(/_/g, ' ')}</td><td className="text-right">{source.visitors}</td><td className="text-right">{source.replySuccesses}</td><td className="text-right">{source.signups}</td><td className="text-right text-emerald-400">{source.paid}</td></tr>)}</tbody></table></div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs text-white/40">
        <p className="font-semibold text-white/60 mb-1">Data quality</p>
        <p>{data.dataQuality.externalEvents.toLocaleString()} external events · {data.dataQuality.internalExcluded.toLocaleString()} internal/bot events excluded · {data.dataQuality.anonymousEventsWithVisitorId.toLocaleString()} anonymous events have durable IDs · {data.dataQuality.legacyEvents.toLocaleString()} legacy events predate canonical event metadata{data.dataQuality.queryTruncated ? ' · query limit reached' : ''}.</p>
      </div>
    </div>
  );
}
