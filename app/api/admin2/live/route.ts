import { NextResponse } from 'next/server';
import { requireAdmin, getAdminSupabase } from '@/lib/admin';

export const dynamic = 'force-dynamic';

type UsageLog = {
  user_id: string | null;
  ip_address: string | null;
  action: string | null;
  created_at: string;
};

type Profile = { id: string; email: string | null; full_name: string | null; created_at: string };
type CopyLog = { user_id: string | null; tone: string | null; created_at: string };
type SubEvent = { user_id: string; status: string; plan_type: string | null; updated_at: string; created_at: string };

export async function GET() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getAdminSupabase();
  const now = Date.now();
  const m5  = new Date(now - 5 * 60_000).toISOString();
  const m15 = new Date(now - 15 * 60_000).toISOString();
  const m60 = new Date(now - 60 * 60_000).toISOString();
  const h24 = new Date(now - 24 * 60 * 60_000).toISOString();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const [
    { data: usage24h },
    { data: signups24h },
    { data: copies24h },
    { data: subEvents24h },
  ] = await Promise.all([
    db.from('usage_logs').select('user_id, ip_address, action, created_at').gte('created_at', h24).order('created_at', { ascending: false }).limit(2000),
    db.from('profiles').select('id, email, full_name, created_at').gte('created_at', h24).order('created_at', { ascending: false }).limit(200),
    db.from('copy_logs').select('user_id, tone, created_at').gte('created_at', h24).order('created_at', { ascending: false }).limit(500),
    db.from('subscriptions').select('user_id, status, plan_type, updated_at, created_at').gte('updated_at', h24).order('updated_at', { ascending: false }).limit(100),
  ]);

  const logs = (usage24h || []) as UsageLog[];
  const signups = (signups24h || []) as Profile[];
  const copies = (copies24h || []) as CopyLog[];
  const subs = (subEvents24h || []) as SubEvent[];

  // ── Online buckets ──
  const onlineUserSet = (cutoff: string) => new Set(logs.filter(l => l.created_at >= cutoff && l.user_id).map(l => l.user_id!));
  const onlineIpSet   = (cutoff: string) => new Set(logs.filter(l => l.created_at >= cutoff && !l.user_id && l.ip_address).map(l => l.ip_address!));
  const online5  = onlineUserSet(m5).size  + onlineIpSet(m5).size;
  const online15 = onlineUserSet(m15).size + onlineIpSet(m15).size;
  const online60 = onlineUserSet(m60).size + onlineIpSet(m60).size;

  // ── Today counts ──
  const todayLogs = logs.filter(l => l.created_at >= todayIso);
  const todaySignups = signups.filter(s => s.created_at >= todayIso).length;
  const todayActions = todayLogs.length;
  const todayCopies  = copies.filter(c => c.created_at >= todayIso).length;
  const todayUpgrades = subs.filter(s => s.status === 'active' && s.updated_at >= todayIso).length;
  const todayCancels  = subs.filter(s => s.status === 'canceled' && s.updated_at >= todayIso).length;

  // ── Action breakdown today ──
  const actionBreakdown: Record<string, number> = {};
  for (const l of todayLogs) {
    const a = l.action || 'unknown';
    actionBreakdown[a] = (actionBreakdown[a] || 0) + 1;
  }

  // ── 24h hourly heatmap (hour 0-23, action → count) ──
  const heatmap: { hour: number; total: number; actions: Record<string, number> }[] = [];
  for (let h = 0; h < 24; h++) {
    heatmap.push({ hour: h, total: 0, actions: {} });
  }
  for (const l of logs) {
    const date = new Date(l.created_at);
    // Distance from "now" in hours, ago. 0 = current hour, 23 = 23h ago.
    const hoursAgo = Math.floor((now - date.getTime()) / (60 * 60_000));
    if (hoursAgo < 0 || hoursAgo > 23) continue;
    const slot = 23 - hoursAgo; // left = oldest, right = now
    heatmap[slot].total++;
    const a = l.action || 'unknown';
    heatmap[slot].actions[a] = (heatmap[slot].actions[a] || 0) + 1;
  }

  // ── Active users RIGHT NOW (last 15min) ──
  const userActivityMap: Record<string, { user_id: string; count: number; lastAction: string; lastSeen: string; ips: Set<string> }> = {};
  for (const l of logs) {
    if (l.created_at < m15 || !l.user_id) continue;
    if (!userActivityMap[l.user_id]) {
      userActivityMap[l.user_id] = { user_id: l.user_id, count: 0, lastAction: l.action || 'unknown', lastSeen: l.created_at, ips: new Set() };
    }
    userActivityMap[l.user_id].count++;
    if (l.ip_address) userActivityMap[l.user_id].ips.add(l.ip_address);
    if (l.created_at > userActivityMap[l.user_id].lastSeen) {
      userActivityMap[l.user_id].lastSeen = l.created_at;
      userActivityMap[l.user_id].lastAction = l.action || 'unknown';
    }
  }
  const activeUserIds = Object.keys(userActivityMap);

  // Look up emails for active + activity-feed users
  const allIdsToFetch = new Set<string>([
    ...activeUserIds,
    ...logs.slice(0, 60).map(l => l.user_id).filter(Boolean) as string[],
    ...copies.slice(0, 30).map(c => c.user_id).filter(Boolean) as string[],
  ]);
  const { data: profilesData } = allIdsToFetch.size > 0
    ? await db.from('profiles').select('id, email, full_name').in('id', Array.from(allIdsToFetch))
    : { data: [] as { id: string; email: string | null; full_name: string | null }[] };
  const profileMap: Record<string, { email: string | null; full_name: string | null }> = {};
  for (const p of profilesData || []) profileMap[p.id] = { email: p.email, full_name: p.full_name };

  // Active users now (top 20 by count)
  const activeUsersNow = Object.values(userActivityMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map(u => ({
      user_id: u.user_id,
      email: profileMap[u.user_id]?.email || '—',
      lastAction: u.lastAction,
      lastSeen: u.lastSeen,
      count: u.count,
      ipCount: u.ips.size,
    }));

  // ── Live activity feed: merge usage, signups, copies, sub events into single stream (last 50) ──
  type FeedItem = { kind: string; at: string; userId: string | null; email: string | null; meta?: string };
  const feed: FeedItem[] = [];
  for (const l of logs.slice(0, 80)) {
    feed.push({
      kind: l.action || 'action',
      at: l.created_at,
      userId: l.user_id,
      email: l.user_id ? (profileMap[l.user_id]?.email || null) : null,
      meta: l.ip_address && !l.user_id ? `anon · ${l.ip_address.slice(-6)}` : undefined,
    });
  }
  for (const s of signups.slice(0, 30)) {
    feed.push({ kind: 'signup', at: s.created_at, userId: s.id, email: s.email });
  }
  for (const c of copies.slice(0, 30)) {
    feed.push({
      kind: 'copy',
      at: c.created_at,
      userId: c.user_id,
      email: c.user_id ? (profileMap[c.user_id]?.email || null) : null,
      meta: c.tone || undefined,
    });
  }
  for (const s of subs) {
    feed.push({
      kind: s.status === 'canceled' ? 'cancel' : 'upgrade',
      at: s.updated_at,
      userId: s.user_id,
      email: profileMap[s.user_id]?.email || null,
      meta: s.plan_type || undefined,
    });
  }
  feed.sort((a, b) => b.at.localeCompare(a.at));

  // ── Top users today by # actions ──
  const todayUserCounts: Record<string, number> = {};
  for (const l of todayLogs) {
    if (!l.user_id) continue;
    todayUserCounts[l.user_id] = (todayUserCounts[l.user_id] || 0) + 1;
  }
  const topUsersToday = Object.entries(todayUserCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([uid, count]) => ({
      user_id: uid,
      email: profileMap[uid]?.email || '—',
      count,
    }));

  // Need emails for top users not yet in profileMap
  const missingTopIds = topUsersToday.filter(u => u.email === '—').map(u => u.user_id);
  if (missingTopIds.length > 0) {
    const { data: extra } = await db.from('profiles').select('id, email').in('id', missingTopIds);
    for (const p of (extra || [])) {
      const idx = topUsersToday.findIndex(u => u.user_id === p.id);
      if (idx >= 0) topUsersToday[idx].email = (p as { email: string | null }).email || '—';
    }
  }

  return NextResponse.json({
    serverTime: new Date().toISOString(),
    online: { m5: online5, m15: online15, h1: online60 },
    today: {
      signups: todaySignups,
      actions: todayActions,
      copies: todayCopies,
      upgrades: todayUpgrades,
      cancels: todayCancels,
    },
    actionBreakdown,
    heatmap,
    activeUsersNow,
    feed: feed.slice(0, 60),
    topUsersToday,
    recentSignups: signups.slice(0, 15),
  });
}
