'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2, Wrench, RefreshCw, CheckCircle, XCircle, Shield, Download, Crown,
} from 'lucide-react';
import { ConfirmModal } from '@/components/admin/confirm-modal';

type ToolsData = {
  checks: Record<string, boolean | string>;
  recentEvents: { id: string; event_type: string; created_at: string; payload: Record<string, unknown> }[];
};

export default function ToolsPage() {
  const [data, setData] = useState<ToolsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{ action: string; title: string; desc: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tools');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const runToolAction = async (action: string) => {
    setActionLoading(true);
    try {
      const secretInput = document.querySelector<HTMLInputElement>('input[type="password"]');
      const secret = secretInput?.value || '';
      const res = await fetch('/api/admin/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, secret }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          // CSV export
          const headers = Object.keys(result.data[0] || {});
          const csv = [
            headers.join(','),
            ...result.data.map((row: Record<string, unknown>) =>
              headers.map(h => JSON.stringify(row[h] ?? '')).join(',')
            ),
          ].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${action}_${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          setActionResult(`Exported ${result.data.length} rows`);
        } else {
          setActionResult('Action completed successfully');
        }
        setActionModal(null);
        await fetchData();
      } else {
        setActionResult('Action failed');
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-purple-600 animate-spin" /></div>;
  }
  if (!data) return <p className="text-center text-red-600 py-20">Failed to load</p>;

  const envChecks = Object.entries(data.checks).filter(([, v]) => typeof v === 'boolean') as [string, boolean][];
  const envStrings = Object.entries(data.checks).filter(([, v]) => typeof v === 'string') as [string, string][];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Tools</h1>
          <p className="text-sm text-white/50">System status and utilities</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-1.5" />Refresh
        </Button>
      </div>

      {actionResult && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400 flex items-center justify-between">
          <span>{actionResult}</span>
          <button onClick={() => setActionResult(null)} className="text-green-400 hover:text-green-300">&times;</button>
        </div>
      )}

      {/* System Status */}
      <Card className="border border-white/[0.08] bg-white/[0.03]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-400" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {envChecks.map(([key, ok]) => (
              <div key={key} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${ok ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {ok ? <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                <span className={`font-mono ${ok ? 'text-green-300' : 'text-red-300'}`}>{key.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
          {envStrings.length > 0 && (
            <div className="mt-3 space-y-1">
              {envStrings.map(([key, val]) => (
                <div key={key} className="flex items-center justify-between text-xs p-2 bg-white/[0.04] rounded">
                  <span className="font-mono text-white/50">{key}</span>
                  <span className="font-mono text-white">{val}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border border-white/[0.08] bg-white/[0.03]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-purple-400" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionModal({
                action: 'seed_owner_elite',
                title: 'Seed Owner Elite',
                desc: 'Grant yourself (current admin) elite entitlement. Safe to run multiple times.',
              })}
            >
              <Crown className="h-3.5 w-3.5 mr-1.5 text-yellow-600" />
              Seed Owner Elite
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionModal({
                action: 'export_users',
                title: 'Export All Users',
                desc: 'Download a CSV of all user profiles.',
              })}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export Users CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionModal({
                action: 'export_subs',
                title: 'Export Subscriptions',
                desc: 'Download a CSV of all subscriptions with user emails.',
              })}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export Subs CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionModal({
                action: 'export_churn',
                title: 'Export Churn List',
                desc: 'Download a CSV of all canceled subscriptions.',
              })}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export Churn CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card className="border border-white/[0.08] bg-white/[0.03]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-white/70">Recent Admin Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentEvents.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-6">No admin events logged</p>
          ) : (
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {data.recentEvents.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between p-2 bg-white/[0.04] rounded text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded font-medium">{ev.event_type}</span>
                    {ev.payload && Object.keys(ev.payload).length > 0 && (
                      <span className="text-white/30 font-mono truncate max-w-xs">{JSON.stringify(ev.payload)}</span>
                    )}
                  </div>
                  <span className="text-white/40 shrink-0">{new Date(ev.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {actionModal && (
        <ConfirmModal
          open={!!actionModal}
          onClose={() => setActionModal(null)}
          title={actionModal.title}
          description={actionModal.desc}
          requireSecret
          loading={actionLoading}
          onConfirm={() => runToolAction(actionModal.action)}
        />
      )}
    </div>
  );
}
