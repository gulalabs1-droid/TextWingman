'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3, Users, DollarSign, TrendingUp, Zap, RefreshCw,
  Crown, Loader2, Activity, UserCheck, AlertTriangle,
} from 'lucide-react';

type OverviewData = {
  totalUsers: number;
  signups: { h24: number; d7: number; d30: number };
  generations: { total: number; h24: number; d7: number; d30: number };
  activatedUsers: number;
  paidUsers: number;
  freeUsers: number;
  mrr: number;
  arr: number;
  conversionRate: number;
  activationRate: number;
  planBreakdown: Record<string, number>;
  churn: { d7: number; d30: number };
  cancelingCount: number;
  genByDay: Record<string, number>;
  signupsByDay: Record<string, number>;
};

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
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
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Users', value: data.totalUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/15' },
    { label: 'Signups (24h)', value: data.signups.h24, sub: `${data.signups.d7} / 7d`, icon: UserCheck, color: 'text-green-400', bg: 'bg-green-500/15' },
    { label: 'Generations (24h)', value: data.generations.h24, sub: `${data.generations.d7} / 7d`, icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/15' },
    { label: 'Activated', value: data.activatedUsers, sub: `${data.activationRate}% rate`, icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/15' },
    { label: 'Paid Users', value: data.paidUsers, sub: `${data.conversionRate}% conv`, icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
    { label: 'MRR', value: `$${data.mrr}`, sub: `$${data.arr} ARR`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { label: 'Churn (7d)', value: data.churn.d7, sub: `${data.churn.d30} / 30d`, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/15' },
    { label: 'Canceling', value: data.cancelingCount, icon: TrendingUp, color: 'text-white/50', bg: 'bg-white/[0.06]' },
  ];

  const genDays = Object.keys(data.genByDay).sort();
  const maxGen = Math.max(...Object.values(data.genByDay), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="text-sm text-white/50">Key metrics at a glance</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border border-white/[0.08] bg-white/[0.03]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white/50 uppercase tracking-wide">{k.label}</span>
                <div className={`p-1.5 rounded-lg ${k.bg}`}>
                  <k.icon className={`h-3.5 w-3.5 ${k.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{typeof k.value === 'number' ? k.value.toLocaleString() : k.value}</p>
              {k.sub && <p className="text-xs text-white/40 mt-0.5">{k.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generations sparkline */}
        <Card className="border border-white/[0.08] bg-white/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white/70 flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-400" />
              Generations (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {genDays.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-6">No data</p>
              ) : genDays.map((day) => {
                const count = data.genByDay[day];
                const pct = (count / maxGen) * 100;
                const label = new Date(day + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <div key={day} className="flex items-center gap-2">
                    <span className="text-xs text-white/50 w-20 shrink-0">{label}</span>
                    <div className="flex-1 h-6 bg-white/[0.06] rounded overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded flex items-center justify-end pr-1.5 transition-all"
                        style={{ width: `${Math.max(pct, 8)}%` }}
                      >
                        <span className="text-[10px] font-bold text-white">{count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Plan breakdown */}
        <Card className="border border-white/[0.08] bg-white/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white/70 flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-400" />
              Plan Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/[0.04] rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                  <span className="text-sm font-medium text-white/70">Free</span>
                </div>
                <span className="text-lg font-bold text-white">{data.freeUsers}</span>
              </div>
              {Object.entries(data.planBreakdown).length === 0 ? (
                <p className="text-white/30 text-sm text-center py-4">No paid subscriptions</p>
              ) : Object.entries(data.planBreakdown).map(([plan, count]) => {
                const colors: Record<string, string> = { weekly: 'bg-purple-500', monthly: 'bg-blue-500', annual: 'bg-green-500' };
                return (
                  <div key={plan} className="flex items-center justify-between p-3 bg-white/[0.04] rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${colors[plan] || 'bg-yellow-500'}`} />
                      <span className="text-sm font-medium text-white/70 capitalize">{plan}</span>
                    </div>
                    <span className="text-lg font-bold text-white">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All-time stats */}
      <Card className="border border-white/[0.08] bg-white/[0.03]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-400" />
            All-Time Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total Gens', value: data.generations.total },
              { label: 'Gens (30d)', value: data.generations.d30 },
              { label: 'Signups (30d)', value: data.signups.d30 },
              { label: 'Activation Rate', value: `${data.activationRate}%` },
              { label: 'Conversion Rate', value: `${data.conversionRate}%` },
            ].map(s => (
              <div key={s.label} className="text-center p-3 bg-white/[0.04] rounded-lg">
                <p className="text-xs text-white/50">{s.label}</p>
                <p className="text-xl font-bold text-white">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
