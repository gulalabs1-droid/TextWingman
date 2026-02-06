'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2, ArrowLeft, Shield, Crown, Zap, Trash2, Eye, EyeOff,
  UserX, Tag, RefreshCw,
} from 'lucide-react';
import { ConfirmModal } from '@/components/admin/confirm-modal';

type UserDetail = {
  profile: {
    id: string; email: string; full_name: string | null;
    created_at: string; onboarding_completed: boolean;
    plan: string; beta_group: string | null;
  };
  entitlement: { tier: string; source: string; expires_at: string | null } | null;
  subscription: {
    stripe_customer_id: string | null; stripe_subscription_id: string | null;
    plan_type: string; status: string; current_period_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
  recentReplies: { id: string; their_message: string; generated_replies: string; context: string | null; created_at: string }[];
  v2Runs: { id: string; all_passed: boolean; avg_confidence: number; latency_ms: number; revise_attempts: number; created_at: string }[];
  usage: { h24: number; d7: number; lifetime: number; uniqueIps24h: number };
  v2Stats: { passRate: number | null; avgConfidence: number | null };
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealContent, setRevealContent] = useState(false);
  const [modal, setModal] = useState<{ action: string; title: string; desc: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, [userId]);

  const runAction = async (action: string, extra: Record<string, unknown> = {}) => {
    setActionLoading(true);
    try {
      // For destructive actions, the ConfirmModal already verified the secret
      // We need to pass it through
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      if (res.ok) {
        setModal(null);
        await fetchUser();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const runDestructiveAction = async (action: string, secret: string, extra: Record<string, unknown> = {}) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, secret, ...extra }),
      });
      if (res.ok) {
        setModal(null);
        await fetchUser();
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-purple-600 animate-spin" /></div>;
  }

  if (!data) return <p className="text-center text-red-600 py-20">User not found</p>;

  const { profile: p, entitlement: e, subscription: s, usage: u, v2Stats, recentReplies, v2Runs } = data;

  const maskText = (text: string) => {
    if (revealContent) return text;
    if (text.length <= 10) return '***';
    return text.substring(0, 5) + '...' + '*'.repeat(Math.min(text.length - 5, 20));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/users')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{p.email}</h1>
          <p className="text-sm text-gray-500">ID: {p.id}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRevealContent(!revealContent)}>
          {revealContent ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
          {revealContent ? 'Mask' : 'Reveal'} Content
        </Button>
      </div>

      {/* Profile + Subscription + Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Name" value={p.full_name || '-'} />
            <Row label="Email" value={p.email} />
            <Row label="Joined" value={new Date(p.created_at).toLocaleDateString()} />
            <Row label="Onboarded" value={p.onboarding_completed ? 'Yes' : 'No'} />
            <Row label="Beta Group" value={p.beta_group || 'none'} />
            <Row label="Entitlement" value={e ? `${e.tier} (${e.source})` : 'none'} />
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {s ? (
              <>
                <Row label="Status" value={s.status} highlight={s.status === 'active' ? 'green' : 'red'} />
                <Row label="Plan" value={s.plan_type} />
                <Row label="Period End" value={s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : '-'} />
                <Row label="Cancel at End" value={s.cancel_at_period_end ? 'Yes' : 'No'} highlight={s.cancel_at_period_end ? 'red' : undefined} />
                <Row label="Stripe Cust" value={s.stripe_customer_id || '-'} mono />
                <Row label="Stripe Sub" value={s.stripe_subscription_id || '-'} mono />
              </>
            ) : (
              <p className="text-gray-400 py-4 text-center">No subscription</p>
            )}
          </CardContent>
        </Card>

        {/* Usage */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Last 24h" value={String(u.h24)} />
            <Row label="Last 7d" value={String(u.d7)} />
            <Row label="Lifetime" value={String(u.lifetime)} />
            <Row label="Unique IPs (24h)" value={String(u.uniqueIps24h)} highlight={u.uniqueIps24h > 3 ? 'red' : undefined} />
            {v2Stats.passRate !== null && (
              <>
                <Row label="V2 Pass Rate" value={`${v2Stats.passRate}%`} />
                <Row label="V2 Avg Confidence" value={`${v2Stats.avgConfidence}%`} />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setModal({
              action: 'grant_entitlement_elite',
              title: 'Grant Elite Access',
              desc: `Grant elite entitlement to ${p.email}. This gives full Pro+V2 access.`,
            })}>
              <Crown className="h-3.5 w-3.5 mr-1 text-yellow-600" />
              Grant Elite
            </Button>
            <Button size="sm" variant="outline" onClick={() => setModal({
              action: 'grant_entitlement_pro',
              title: 'Grant Pro Access',
              desc: `Grant pro entitlement to ${p.email}.`,
            })}>
              <Shield className="h-3.5 w-3.5 mr-1 text-purple-600" />
              Grant Pro
            </Button>
            {e && e.tier !== 'free' && (
              <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => setModal({
                action: 'revoke_entitlement',
                title: 'Revoke Entitlement',
                desc: `Revoke ${e.tier} access from ${p.email}. They will fall back to their Stripe subscription status.`,
              })}>
                Revoke Entitlement
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => runAction('set_beta_group', { beta_group: p.beta_group ? null : 'beta_v1' })}>
              <Tag className="h-3.5 w-3.5 mr-1" />
              {p.beta_group ? 'Remove Beta' : 'Set Beta'}
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => setModal({
              action: 'delete_history',
              title: 'Delete Reply History',
              desc: `Permanently delete all reply history for ${p.email}. This cannot be undone.`,
            })}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete History
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => setModal({
              action: 'disable_account',
              title: 'Disable Account',
              desc: `Soft-disable account for ${p.email}. Sets plan to 'disabled'.`,
            })}>
              <UserX className="h-3.5 w-3.5 mr-1" />
              Disable
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Replies */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-500" />
            Recent Replies ({recentReplies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentReplies.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No replies yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentReplies.map((r) => (
                <div key={r.id} className="p-3 bg-gray-50 rounded-lg text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500">{new Date(r.created_at).toLocaleString()}</span>
                    {r.context && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px]">{r.context}</span>}
                  </div>
                  <p className="text-gray-700 font-medium">{maskText(r.their_message)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* V2 Runs */}
      {v2Runs.length > 0 && (
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">V2 Runs ({v2Runs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-medium text-gray-500">Date</th>
                    <th className="text-center px-3 py-2 font-medium text-gray-500">Passed</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">Confidence</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">Latency</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">Revisions</th>
                  </tr>
                </thead>
                <tbody>
                  {v2Runs.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50">
                      <td className="px-3 py-2 text-gray-600">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-3 py-2 text-center">{r.all_passed ? <span className="text-green-600">Pass</span> : <span className="text-red-600">Fail</span>}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.avg_confidence}%</td>
                      <td className="px-3 py-2 text-right font-mono">{r.latency_ms}ms</td>
                      <td className="px-3 py-2 text-right font-mono">{r.revise_attempts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Modal */}
      {modal && (
        <ConfirmModal
          open={!!modal}
          onClose={() => setModal(null)}
          title={modal.title}
          description={modal.desc}
          requireSecret
          destructive={['revoke_entitlement', 'delete_history', 'disable_account'].includes(modal.action)}
          loading={actionLoading}
          onConfirm={async () => {
            // We need to get secret from the modal — the ConfirmModal validates it
            // but we also need to pass it to the API. Let's use a workaround:
            // fetch the secret input value via the verify endpoint, then send action
            const secretInput = document.querySelector<HTMLInputElement>('input[type="password"]');
            const secret = secretInput?.value || '';

            let action = modal.action;
            const extra: Record<string, unknown> = { secret };

            if (action === 'grant_entitlement_elite') {
              action = 'grant_entitlement';
              extra.tier = 'elite';
            } else if (action === 'grant_entitlement_pro') {
              action = 'grant_entitlement';
              extra.tier = 'pro';
            }

            await runDestructiveAction(action, secret, extra);
          }}
        />
      )}
    </div>
  );
}

function Row({ label, value, highlight, mono }: { label: string; value: string; highlight?: 'green' | 'red'; mono?: boolean }) {
  const colors = highlight === 'green' ? 'text-green-600' : highlight === 'red' ? 'text-red-600' : 'text-gray-900';
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${colors} ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
