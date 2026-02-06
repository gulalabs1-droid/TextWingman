'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, RefreshCw, ArrowDown } from 'lucide-react';

type FunnelData = {
  totalUsers: number;
  signups: { d30: number };
  activatedUsers: number;
  generations: { d30: number };
  paidUsers: number;
  freeUsers: number;
};

export default function FunnelPage() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-purple-600 animate-spin" /></div>;
  }

  if (!data) return <p className="text-center text-red-600 py-20">Failed to load</p>;

  const steps = [
    { label: 'Total Signups (30d)', count: data.signups.d30, color: 'bg-blue-500' },
    { label: 'Activated (1+ reply)', count: data.activatedUsers, color: 'bg-purple-500' },
    { label: 'Free Users (active)', count: data.freeUsers, color: 'bg-orange-500' },
    { label: 'Paid Users', count: data.paidUsers, color: 'bg-green-500' },
  ];

  const maxCount = Math.max(...steps.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funnel</h1>
          <p className="text-sm text-gray-500">User conversion journey</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      <Card className="border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {steps.map((step, i) => {
              const pct = (step.count / maxCount) * 100;
              const prevCount = i > 0 ? steps[i - 1].count : null;
              const dropRate = prevCount && prevCount > 0
                ? Math.round(((prevCount - step.count) / prevCount) * 100)
                : null;
              const convRate = prevCount && prevCount > 0
                ? Math.round((step.count / prevCount) * 100)
                : null;

              return (
                <div key={step.label}>
                  {i > 0 && (
                    <div className="flex items-center justify-center gap-2 py-1.5 text-xs text-gray-400">
                      <ArrowDown className="h-3 w-3" />
                      <span>{convRate !== null ? `${convRate}% converted` : ''}</span>
                      {dropRate !== null && dropRate > 0 && (
                        <span className="text-red-400">({dropRate}% drop)</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-44 shrink-0 font-medium">{step.label}</span>
                    <div className="flex-1 h-10 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className={`h-full ${step.color} rounded-lg flex items-center px-3 transition-all duration-500`}
                        style={{ width: `${Math.max(pct, 10)}%` }}
                      >
                        <span className="text-sm font-bold text-white">{step.count.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">Activation Rate</p>
                <p className="text-xl font-bold text-blue-800">
                  {data.signups.d30 > 0 ? Math.round((data.activatedUsers / data.signups.d30) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-600 font-medium">Free→Paid</p>
                <p className="text-xl font-bold text-purple-800">
                  {data.freeUsers > 0 ? Math.round((data.paidUsers / (data.freeUsers + data.paidUsers)) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 font-medium">Overall Conv.</p>
                <p className="text-xl font-bold text-green-800">
                  {data.signups.d30 > 0 ? Math.round((data.paidUsers / data.signups.d30) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
