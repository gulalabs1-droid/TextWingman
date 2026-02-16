'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Beaker, RefreshCw, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { ConfirmModal } from '@/components/admin/confirm-modal';

type Flag = {
  key: string;
  value: { enabled: boolean; rollout_pct: number };
  description: string | null;
  updated_at: string;
};

export default function ExperimentsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, { enabled: boolean; rollout_pct: number }>>({});
  const [confirmFlag, setConfirmFlag] = useState<string | null>(null);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/feature-flags');
      if (res.ok) {
        const data = await res.json();
        setFlags(data.flags);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFlags(); }, []);

  const getLocalValue = (key: string) => {
    if (pendingChanges[key]) return pendingChanges[key];
    const flag = flags.find(f => f.key === key);
    return flag?.value || { enabled: false, rollout_pct: 0 };
  };

  const updateLocal = (key: string, partial: Partial<{ enabled: boolean; rollout_pct: number }>) => {
    const current = getLocalValue(key);
    setPendingChanges(prev => ({ ...prev, [key]: { ...current, ...partial } }));
  };

  const hasPendingChange = (key: string) => {
    const pending = pendingChanges[key];
    if (!pending) return false;
    const original = flags.find(f => f.key === key)?.value;
    return JSON.stringify(pending) !== JSON.stringify(original);
  };

  const saveFlag = async (key: string) => {
    setConfirmFlag(key);
  };

  const doSave = async (key: string) => {
    setSaving(key);
    try {
      const secretInput = document.querySelector<HTMLInputElement>('input[type="password"]');
      const secret = secretInput?.value || '';
      const value = getLocalValue(key);
      const res = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, secret }),
      });
      if (res.ok) {
        setConfirmFlag(null);
        setPendingChanges(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        await fetchFlags();
      }
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-purple-600 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Experiments</h1>
          <p className="text-sm text-white/50">Feature flags and rollout controls</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFlags}>
          <RefreshCw className="h-4 w-4 mr-1.5" />Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {flags.length === 0 ? (
          <p className="text-white/30 text-center py-12">No feature flags configured</p>
        ) : flags.map((flag) => {
          const val = getLocalValue(flag.key);
          const changed = hasPendingChange(flag.key);

          return (
            <Card key={flag.key} className={`border ${changed ? 'border-purple-500/40 bg-purple-500/10' : 'border-white/[0.08] bg-white/[0.03]'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Beaker className="h-4 w-4 text-purple-500 shrink-0" />
                      <span className="font-mono text-sm font-semibold text-white">{flag.key}</span>
                    </div>
                    {flag.description && (
                      <p className="text-xs text-white/50 ml-6">{flag.description}</p>
                    )}
                    <p className="text-[10px] text-white/30 ml-6 mt-0.5">
                      Updated: {new Date(flag.updated_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Toggle */}
                    <button
                      onClick={() => updateLocal(flag.key, { enabled: !val.enabled })}
                      className="flex items-center gap-1.5"
                    >
                      {val.enabled ? (
                        <ToggleRight className="h-6 w-6 text-green-400" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-white/30" />
                      )}
                      <span className={`text-xs font-medium ${val.enabled ? 'text-green-400' : 'text-white/30'}`}>
                        {val.enabled ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {/* Rollout % */}
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={val.rollout_pct}
                        onChange={(e) => updateLocal(flag.key, { rollout_pct: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                        className="w-16 h-8 text-xs text-center"
                      />
                      <span className="text-xs text-white/50">%</span>
                    </div>

                    {/* Save */}
                    <Button
                      size="sm"
                      variant={changed ? 'default' : 'outline'}
                      disabled={!changed || saving === flag.key}
                      onClick={() => saveFlag(flag.key)}
                      className="text-xs"
                    >
                      {saving === flag.key ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {confirmFlag && (
        <ConfirmModal
          open={!!confirmFlag}
          onClose={() => setConfirmFlag(null)}
          title="Update Feature Flag"
          description={`Save changes to ${confirmFlag}? This will take effect immediately.`}
          requireSecret
          loading={!!saving}
          onConfirm={() => doSave(confirmFlag)}
        />
      )}
    </div>
  );
}
