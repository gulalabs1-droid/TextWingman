'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2, CreditCard, AlertTriangle, RefreshCw, Download, Clock, XCircle, CheckCircle,
} from 'lucide-react';
import { mockBillingData } from '@/lib/admin-demo-data';

const isDemoMode = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ADMIN_DEMO_MODE === 'true';

type BillingData = {
  totalSubs: number;
  activeSubs: number;
  canceledSubs: number;
  orphaned: { user_id: string; status: string; stripe_subscription_id: string | null; stripe_customer_id: string | null }[];
  cancelingSubs: { user_id: string; plan_type: string; current_period_end: string; profiles: { email: string } }[];
  upcomingRenewals: { user_id: string; plan_type: string; current_period_end: string; profiles: { email: string } }[];
  mismatches: { id: string; email: string; plan: string }[];
  recentEvents: { id: string; action?: string | null; event_type?: string | null; created_at: string; metadata?: Record<string, unknown> | null; payload?: Record<string, unknown> | null }[];
  stripeHealth?: {
    connected: boolean;
    checkedAt: string;
    activeSubs: number;
    canceledSubs: number;
    databaseActiveSubs: number;
    staleDatabaseSubs: number;
    orphanedStripeSubs: number;
    priceMismatches: number;
    unknownActivePrices: number;
    hasMore: boolean;
    priceConfig: {
      weekly: { configured: boolean; active: boolean; amountCents: number | null; currency: string | null; interval: string | null; intervalCount: number | null; matchesApp: boolean };
      annual: { configured: boolean; active: boolean; amountCents: number | null; currency: string | null; interval: string | null; intervalCount: number | null; matchesApp: boolean };
    };
  };
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
    if (isDemoMode) {
      setData(mockBillingData);
      setLoading(false);
      return;
    }
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

  const stripeIsHealthy = Boolean(
    data.stripeHealth?.connected &&
    data.stripeHealth.staleDatabaseSubs === 0 &&
    data.stripeHealth.orphanedStripeSubs === 0 &&
    data.stripeHealth.priceMismatches === 0 &&
    data.stripeHealth.unknownActivePrices === 0 &&
    data.stripeHealth.priceConfig.weekly.matchesApp &&
    data.stripeHealth.priceConfig.annual.matchesApp,
  );

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

      {/* Stripe source-of-truth reconciliation */}
      {data.stripeHealth && (
        <Card className={`border ${stripeIsHealthy ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${stripeIsHealthy ? 'text-emerald-300' : 'text-amber-300'}`}>
              {stripeIsHealthy ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              Stripe source of truth
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!data.stripeHealth.connected ? (
              <p className="text-amber-200/80 text-sm">Stripe could not be checked. Do not rely on the app-side subscription count until the connection is restored.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div><p className="text-white/40">Stripe active</p><p className="text-white font-bold text-lg">{data.stripeHealth.activeSubs}</p></div>
                  <div><p className="text-white/40">App active</p><p className="text-white font-bold text-lg">{data.stripeHealth.databaseActiveSubs}</p></div>
                  <div><p className="text-white/40">Stale app rows</p><p className={`font-bold text-lg ${data.stripeHealth.staleDatabaseSubs ? 'text-amber-300' : 'text-white'}`}>{data.stripeHealth.staleDatabaseSubs}</p></div>
                  <div><p className="text-white/40">Stripe-only rows</p><p className={`font-bold text-lg ${data.stripeHealth.orphanedStripeSubs ? 'text-amber-300' : 'text-white'}`}>{data.stripeHealth.orphanedStripeSubs}</p></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                  <span className={data.stripeHealth.priceConfig.weekly.matchesApp ? 'text-emerald-300' : 'text-amber-200'}>Weekly price: {data.stripeHealth.priceConfig.weekly.matchesApp ? 'matches Stripe' : 'needs attention'}</span>
                  <span className={data.stripeHealth.priceConfig.annual.matchesApp ? 'text-emerald-300' : 'text-amber-200'}>Annual price: {data.stripeHealth.priceConfig.annual.matchesApp ? 'matches Stripe' : 'needs attention'}</span>
                </div>
                {(data.stripeHealth.priceMismatches > 0 || data.stripeHealth.unknownActivePrices > 0 || data.stripeHealth.hasMore) && (
                  <p className="mt-3 text-amber-200/80 text-xs">
                    {data.stripeHealth.priceMismatches > 0 ? `${data.stripeHealth.priceMismatches} price mismatch(es). ` : ''}
                    {data.stripeHealth.unknownActivePrices > 0 ? `${data.stripeHealth.unknownActivePrices} active subscription(s) use an unrecognized price. ` : ''}
                    {data.stripeHealth.hasMore ? 'More than 100 Stripe subscriptions exist; reconciliation is partial.' : ''}
                  </p>
                )}
                <p className="mt-3 text-white/35 text-xs">Checked {new Date(data.stripeHealth.checkedAt).toLocaleString()}. Reconcile flagged rows before changing access or revenue reporting.</p>
              </>
            )}
          </CardContent>
        </Card>
      )}

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
              {data.recentEvents.map((ev) => {
                const colorMap: Record<string, string> = {
                  subscription_created: 'bg-emerald-500/20 text-emerald-300',
                  payment_succeeded: 'bg-blue-500/20 text-blue-300',
                  payment_failed: 'bg-red-500/20 text-red-300',
                  subscription_canceled: 'bg-orange-500/20 text-orange-300',
                  subscription_updated: 'bg-violet-500/20 text-violet-300',
                  grant_entitlement: 'bg-fuchsia-500/20 text-fuchsia-300',
                };
                const eventType = ev.action || ev.event_type || 'admin_event';
                const cls = colorMap[eventType] || 'bg-purple-500/20 text-purple-300';
                return (
                <div key={ev.id} className="flex items-center justify-between p-2 bg-white/[0.04] rounded text-xs">
                  <span className={`px-1.5 py-0.5 ${cls} rounded font-medium`}>{eventType.replace(/_/g, ' ')}</span>
                  <span className="text-white/40">{new Date(ev.created_at).toLocaleString()}</span>
                </div>
              );})}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
