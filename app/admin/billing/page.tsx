'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2, CreditCard, AlertTriangle, RefreshCw, Download, Clock, XCircle, CheckCircle,
} from 'lucide-react';

type BillingData = {
  totalSubs: number;
  activeSubs: number;
  canceledSubs: number;
  orphaned: { user_id: string; status: string; stripe_subscription_id: string | null; stripe_customer_id: string | null }[];
  cancelingSubs: { user_id: string; plan_type: string; current_period_end: string; profiles: { email: string } }[];
  upcomingRenewals: { user_id: string; plan_type: string; current_period_end: string; profiles: { email: string } }[];
  mismatches: { id: string; email: string; plan: string }[];
  recentEvents: { id: string; event_type: string; created_at: string; payload: Record<string, unknown> }[];
};

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/billing');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type: string) => {
    setExporting(type);
    try {
      const secret = prompt('Enter ADMIN_SECRET to export:');
      if (!secret) { setExporting(''); return; }
      const res = await fetch('/api/admin/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: `export_${type}`, secret }),
      });
      if (res.ok) {
        const { data: rows } = await res.json();
        downloadCSV(rows, `${type}_${new Date().toISOString().split('T')[0]}.csv`);
      }
    } finally {
      setExporting('');
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-purple-600 animate-spin" /></div>;
  }
  if (!data) return <p className="text-center text-red-600 py-20">Failed to load</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing &amp; Stripe Health</h1>
          <p className="text-sm text-white/50">Subscription diagnostics</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-1.5" />Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Subs', value: data.totalSubs, icon: CreditCard, bg: 'bg-blue-500/15', color: 'text-blue-400' },
          { label: 'Active', value: data.activeSubs, icon: CheckCircle, bg: 'bg-green-500/15', color: 'text-green-400' },
          { label: 'Canceled', value: data.canceledSubs, icon: XCircle, bg: 'bg-red-500/15', color: 'text-red-400' },
          { label: 'Orphaned', value: data.orphaned.length, icon: AlertTriangle, bg: data.orphaned.length > 0 ? 'bg-red-500/15' : 'bg-white/[0.06]', color: data.orphaned.length > 0 ? 'text-red-400' : 'text-white/50' },
        ].map(c => (
          <Card key={c.label} className="border border-white/[0.08] bg-white/[0.03]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white/50 uppercase tracking-wide">{c.label}</span>
                <div className={`p-1.5 rounded-lg ${c.bg}`}><c.icon className={`h-3.5 w-3.5 ${c.color}`} /></div>
              </div>
              <p className="text-2xl font-bold text-white">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orphaned Subscriptions */}
      {data.orphaned.length > 0 && (
        <Card className="border border-red-500/30 bg-red-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Orphaned Subscriptions ({data.orphaned.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.orphaned.map((o, i) => (
                <div key={i} className="p-2 bg-white/[0.06] rounded text-xs flex items-center justify-between">
                  <span className="font-mono text-white/70">{o.user_id}</span>
                  <span className="text-red-400">Missing: {!o.stripe_subscription_id ? 'sub_id ' : ''}{!o.stripe_customer_id ? 'cust_id' : ''}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Renewals */}
      <Card className="border border-white/[0.08] bg-white/[0.03]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" /> Upcoming Renewals (7d) — {data.upcomingRenewals.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.upcomingRenewals.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-4">None</p>
          ) : (
            <div className="space-y-1">
              {data.upcomingRenewals.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-white/[0.04] rounded text-xs">
                  <span className="text-white/70">{r.profiles?.email}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white/50 capitalize">{r.plan_type}</span>
                    <span className="text-blue-400">{new Date(r.current_period_end).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Canceling */}
      <Card className="border border-white/[0.08] bg-white/[0.03]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-orange-400" /> Canceling at Period End — {data.cancelingSubs.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.cancelingSubs.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-4">None</p>
          ) : (
            <div className="space-y-1">
              {data.cancelingSubs.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-white/[0.04] rounded text-xs">
                  <span className="text-white/70">{c.profiles?.email}</span>
                  <span className="text-orange-400">Ends: {new Date(c.current_period_end).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Exports */}
      <Card className="border border-white/[0.08] bg-white/[0.03]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <Download className="h-4 w-4 text-green-400" /> CSV Exports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'subs', label: 'Active Subs' },
              { key: 'churn', label: 'Churn List' },
              { key: 'users', label: 'All Users' },
            ].map((e) => (
              <Button key={e.key} variant="outline" size="sm" onClick={() => exportData(e.key)} disabled={!!exporting}>
                {exporting === e.key ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Download className="h-3.5 w-3.5 mr-1" />}
                {e.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card className="border border-white/[0.08] bg-white/[0.03]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-white/70">Recent Admin Events</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentEvents.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-4">No events yet</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {data.recentEvents.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between p-2 bg-white/[0.04] rounded text-xs">
                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded font-medium">{ev.event_type}</span>
                  <span className="text-white/40">{new Date(ev.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
