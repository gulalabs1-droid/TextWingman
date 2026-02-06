'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2, BarChart3, RefreshCw, Copy, Zap, MessageSquare, Clock,
} from 'lucide-react';

type ContentData = {
  contextCounts: Record<string, number>;
  toneCounts: Record<string, number>;
  copyRate: number;
  totalReplies: number;
  totalCopies: number;
  v2Stats: {
    total: number;
    passRate: number;
    avgLatency: number;
    avgConfidence: number;
    avgReviseAttempts: number;
  };
  hitLimitCount: number;
};

export default function ContentPage() {
  const [data, setData] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content');
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

  const sortedContexts = Object.entries(data.contextCounts).sort((a, b) => b[1] - a[1]);
  const maxContext = sortedContexts.length > 0 ? sortedContexts[0][1] : 1;

  const sortedTones = Object.entries(data.toneCounts).sort((a, b) => b[1] - a[1]);
  const maxTone = sortedTones.length > 0 ? sortedTones[0][1] : 1;

  const toneColors: Record<string, string> = {
    shorter: 'bg-blue-500',
    spicier: 'bg-red-500',
    softer: 'bg-pink-400',
    default: 'bg-gray-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content &amp; Growth</h1>
          <p className="text-sm text-gray-500">Usage patterns and engagement</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-1.5" />Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Replies', value: data.totalReplies, icon: MessageSquare, bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: 'Total Copies', value: data.totalCopies, icon: Copy, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Copy Rate', value: `${data.copyRate}%`, icon: BarChart3, bg: 'bg-green-50', color: 'text-green-600' },
          { label: 'Hit Free Limit', value: data.hitLimitCount, icon: Zap, bg: 'bg-orange-50', color: 'text-orange-600' },
        ].map(c => (
          <Card key={c.label} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{c.label}</span>
                <div className={`p-1.5 rounded-lg ${c.bg}`}><c.icon className={`h-3.5 w-3.5 ${c.color}`} /></div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{typeof c.value === 'number' ? c.value.toLocaleString() : c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Context Distribution */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-500" />
              Context Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedContexts.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No data</p>
            ) : (
              <div className="space-y-2">
                {sortedContexts.slice(0, 10).map(([ctx, count]) => (
                  <div key={ctx} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-20 shrink-0 truncate capitalize">{ctx}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-purple-400 rounded flex items-center justify-end pr-1.5"
                        style={{ width: `${Math.max((count / maxContext) * 100, 8)}%` }}
                      >
                        <span className="text-[10px] font-bold text-white">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tone Distribution */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Tone Distribution (copies)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedTones.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No data</p>
            ) : (
              <div className="space-y-2">
                {sortedTones.map(([tone, count]) => (
                  <div key={tone} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-20 shrink-0 capitalize">{tone}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                      <div
                        className={`h-full ${toneColors[tone] || toneColors.default} rounded flex items-center justify-end pr-1.5`}
                        style={{ width: `${Math.max((count / maxTone) * 100, 8)}%` }}
                      >
                        <span className="text-[10px] font-bold text-white">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* V2 Pipeline Stats */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            V2 Pipeline Stats ({data.v2Stats.total} runs)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.v2Stats.total === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No V2 runs yet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-green-600 font-medium">Pass Rate</p>
                <p className="text-xl font-bold text-green-800">{data.v2Stats.passRate}%</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-blue-600 font-medium">Avg Confidence</p>
                <p className="text-xl font-bold text-blue-800">{data.v2Stats.avgConfidence}%</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg text-center">
                <p className="text-xs text-orange-600 font-medium">Avg Latency</p>
                <p className="text-xl font-bold text-orange-800">{data.v2Stats.avgLatency}ms</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-xs text-purple-600 font-medium">Avg Revisions</p>
                <p className="text-xl font-bold text-purple-800">{data.v2Stats.avgReviseAttempts}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
