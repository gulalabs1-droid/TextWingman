'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Users, Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  plan: string;
  plan_source: string;
  replies_7d: number;
  replies_30d: number;
  replies_lifetime: number;
  last_reply_at: string | null;
  subscription_status: string | null;
  beta_group: string | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUsers = async (p = page, s = search, pf = planFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (s) params.set('search', s);
      if (pf) params.set('plan', pf);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, search, planFilter);
  };

  const handlePlanFilter = (plan: string) => {
    const newPlan = plan === planFilter ? '' : plan;
    setPlanFilter(newPlan);
    setPage(1);
    fetchUsers(1, search, newPlan);
  };

  const planBadge = (plan: string, source: string) => {
    const colors: Record<string, string> = {
      elite: 'bg-yellow-500/20 text-yellow-300',
      pro: 'bg-purple-500/20 text-purple-300',
      free: 'bg-white/[0.08] text-white/60',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[plan] || 'bg-white/[0.08] text-white/60'}`}>
        {plan}
        {source !== 'none' && source !== 'stripe' && (
          <span className="text-[10px] opacity-60">({source})</span>
        )}
      </span>
    );
  };

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-sm text-white/50">{total} total users</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[250px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search by email or user ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" size="sm">Search</Button>
        </form>
        <div className="flex gap-1.5">
          {['free', 'pro', 'elite'].map((p) => (
            <Button
              key={p}
              variant={planFilter === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePlanFilter(p)}
              className="capitalize text-xs"
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="border border-white/[0.08] bg-white/[0.03] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.04]">
                <th className="text-left px-4 py-3 font-medium text-white/50">Email</th>
                <th className="text-left px-4 py-3 font-medium text-white/50">Plan</th>
                <th className="text-right px-4 py-3 font-medium text-white/50">7d</th>
                <th className="text-right px-4 py-3 font-medium text-white/50">30d</th>
                <th className="text-right px-4 py-3 font-medium text-white/50">Total</th>
                <th className="text-left px-4 py-3 font-medium text-white/50">Last Reply</th>
                <th className="text-left px-4 py-3 font-medium text-white/50">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12"><Loader2 className="h-6 w-6 text-purple-600 animate-spin mx-auto" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-white/30">No users found</td></tr>
              ) : users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-white/[0.06] hover:bg-white/[0.04] cursor-pointer transition-colors"
                  onClick={() => router.push(`/admin/users/${u.id}`)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{u.email}</p>
                      {u.full_name && <p className="text-xs text-white/40">{u.full_name}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">{planBadge(u.plan, u.plan_source)}</td>
                  <td className="px-4 py-3 text-right font-mono text-white/70">{u.replies_7d}</td>
                  <td className="px-4 py-3 text-right font-mono text-white/70">{u.replies_30d}</td>
                  <td className="px-4 py-3 text-right font-mono text-white/70">{u.replies_lifetime}</td>
                  <td className="px-4 py-3 text-white/50 text-xs">{timeAgo(u.last_reply_at)}</td>
                  <td className="px-4 py-3 text-white/50 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <ExternalLink className="h-3.5 w-3.5 text-white/30" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.08] bg-white/[0.04]">
          <p className="text-xs text-white/50">Page {page} of {Math.ceil(total / 50) || 1}</p>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(page - 1); fetchUsers(page - 1); }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page * 50 >= total} onClick={() => { setPage(page + 1); fetchUsers(page + 1); }}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
