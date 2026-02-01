'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Zap, 
  RefreshCw,
  Crown,
  ArrowUpRight,
  Loader2,
  Lock
} from 'lucide-react';

// Simple admin password - change this to something secure
const ADMIN_PASSWORD = 'textwingman2025';

type Metrics = {
  dailyGenerations: number;
  weeklyGenerations: number;
  totalGenerations: number;
  totalUsers: number;
  activePaidUsers: number;
  freeUsers: number;
  conversionRate: number;
  mrr: number;
  arr: number;
  dailyData: Record<string, number>;
  planBreakdown: Record<string, number>;
  generatedAt: string;
};

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Check if already authenticated via localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const savedAuth = localStorage.getItem('admin_auth');
      if (savedAuth === 'true') {
        setAuthorized(true);
      }
    } catch (e) {
      console.error('localStorage error:', e);
    }
  }, []);

  // Fetch metrics when authorized
  useEffect(() => {
    if (authorized && mounted) {
      fetchMetrics();
    }
  }, [authorized, mounted]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('admin_auth', 'true');
      setAuthorized(true);
      setError(null);
      await fetchMetrics();
    } else {
      setError('Wrong password');
    }
    setLoading(false);
  };

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/metrics');
      
      if (!res.ok) {
        if (res.status === 401) {
          setError('Unauthorized');
          return;
        }
        throw new Error('Failed to fetch metrics');
      }
      
      const data = await res.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError('Failed to load metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // SSR guard
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  // Show password login form if not authorized
  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="bg-gray-900 border-purple-500/50 w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Lock className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-400 mt-2">Enter password to access</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
              <Button 
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 h-12 font-bold"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Access Dashboard'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center flex-col gap-4">
        {refreshing ? (
          <>
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
            <p className="text-gray-400">Loading metrics...</p>
          </>
        ) : error ? (
          <>
            <p className="text-red-400 text-lg">{error}</p>
            <Button onClick={fetchMetrics} className="bg-purple-600 hover:bg-purple-700">
              Retry
            </Button>
          </>
        ) : (
          <>
            <p className="text-gray-400">No data loaded</p>
            <Button onClick={fetchMetrics} className="bg-purple-600 hover:bg-purple-700">
              Load Metrics
            </Button>
          </>
        )}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Daily Generations',
      value: metrics.dailyGenerations.toLocaleString(),
      subtitle: `${metrics.weeklyGenerations.toLocaleString()} this week`,
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Active Paid Users',
      value: metrics.activePaidUsers.toLocaleString(),
      subtitle: `${metrics.freeUsers.toLocaleString()} free users`,
      icon: Crown,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'MRR',
      value: `$${metrics.mrr.toLocaleString()}`,
      subtitle: `$${metrics.arr.toLocaleString()} ARR`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Conversion Rate',
      value: `${metrics.conversionRate}%`,
      subtitle: `${metrics.totalUsers.toLocaleString()} total users`,
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  // Prepare chart data
  const chartDays = Object.keys(metrics.dailyData).sort();
  const maxGenerations = Math.max(...Object.values(metrics.dailyData), 1);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-purple-500" />
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              Internal metrics • Last updated: {new Date(metrics.generatedAt).toLocaleString()}
            </p>
          </div>
          <Button 
            onClick={fetchMetrics} 
            disabled={refreshing}
            variant="outline" 
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.title} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                    <p className={`text-3xl font-bold mt-1 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                      {stat.value}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 text-white`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Generations Chart */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                Generations (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {chartDays.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No data yet</p>
                ) : (
                  chartDays.map((day) => {
                    const count = metrics.dailyData[day];
                    const percentage = (count / maxGenerations) * 100;
                    const dayLabel = new Date(day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm w-24 shrink-0">{dayLabel}</span>
                        <div className="flex-1 h-8 bg-gray-800 rounded-lg overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(percentage, 10)}%` }}
                          >
                            <span className="text-white text-xs font-bold">{count}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Plan Breakdown */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Crown className="h-5 w-5 text-purple-500" />
                Subscription Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Free users */}
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gray-500" />
                    <span className="text-gray-300 font-medium">Free</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-400">{metrics.freeUsers}</span>
                </div>
                
                {/* Paid plans */}
                {Object.entries(metrics.planBreakdown).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No paid subscriptions yet</p>
                ) : (
                  Object.entries(metrics.planBreakdown).map(([plan, count]) => {
                    const colors: Record<string, string> = {
                      weekly: 'bg-purple-500',
                      monthly: 'bg-blue-500',
                      annual: 'bg-green-500',
                    };
                    return (
                      <div key={plan} className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${colors[plan] || 'bg-yellow-500'}`} />
                          <span className="text-gray-300 font-medium capitalize">{plan}</span>
                        </div>
                        <span className="text-2xl font-bold text-white">{count}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              All-Time Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-800 rounded-xl">
                <p className="text-gray-400 text-sm">Total Generations</p>
                <p className="text-2xl font-bold text-white">{metrics.totalGenerations.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-xl">
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{metrics.totalUsers.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-xl">
                <p className="text-gray-400 text-sm">Paid Users</p>
                <p className="text-2xl font-bold text-green-400">{metrics.activePaidUsers.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-xl">
                <p className="text-gray-400 text-sm">Avg Gen/Day (7d)</p>
                <p className="text-2xl font-bold text-blue-400">
                  {chartDays.length > 0 ? Math.round(metrics.weeklyGenerations / chartDays.length) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>🔒 Admin access only</p>
        </div>
      </div>
    </div>
  );
}
