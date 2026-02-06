import { NextResponse } from 'next/server';
import { requireAdmin, getAdminSupabase } from '@/lib/admin';

export async function GET() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getAdminSupabase();

  const [
    { data: replyHistory },
    { data: copyLogs },
    { data: v2Runs },
    { data: usageLogs30d },
  ] = await Promise.all([
    db.from('reply_history').select('context, created_at').order('created_at', { ascending: false }).limit(2000),
    db.from('copy_logs').select('tone, is_v2, created_at'),
    db.from('v2_runs').select('rule_pass_rate, tone_pass_rate, avg_confidence, latency_ms, revise_attempts, all_passed, created_at').order('created_at', { ascending: false }).limit(500),
    db.from('usage_logs').select('user_id, created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  // Context distribution
  const contextCounts: Record<string, number> = {};
  replyHistory?.forEach(r => {
    const ctx = r.context || 'none';
    contextCounts[ctx] = (contextCounts[ctx] || 0) + 1;
  });

  // Tone distribution from copy logs
  const toneCounts: Record<string, number> = {};
  copyLogs?.forEach(l => {
    toneCounts[l.tone] = (toneCounts[l.tone] || 0) + 1;
  });

  // Copy rate
  const totalReplies = replyHistory?.length || 0;
  const totalCopies = copyLogs?.length || 0;
  const copyRate = totalReplies > 0 ? Math.round((totalCopies / totalReplies) * 100) : 0;

  // V2 stats
  const v2Total = v2Runs?.length || 0;
  const v2Passed = v2Runs?.filter(r => r.all_passed).length || 0;
  const v2PassRate = v2Total > 0 ? Math.round((v2Passed / v2Total) * 100) : 0;
  const avgLatency = v2Total > 0
    ? Math.round(v2Runs!.reduce((s, r) => s + (r.latency_ms || 0), 0) / v2Total)
    : 0;
  const avgConfidence = v2Total > 0
    ? Math.round(v2Runs!.reduce((s, r) => s + (r.avg_confidence || 0), 0) / v2Total)
    : 0;
  const avgReviseAttempts = v2Total > 0
    ? Math.round((v2Runs!.reduce((s, r) => s + (r.revise_attempts || 0), 0) / v2Total) * 10) / 10
    : 0;

  // Free limit upgrade funnel (approximate)
  // Users who hit free limit: generated >= 3 replies in a day
  const userDayCounts: Record<string, Set<string>> = {};
  usageLogs30d?.forEach(l => {
    if (!l.user_id) return;
    const day = l.created_at.split('T')[0];
    const key = `${l.user_id}_${day}`;
    if (!userDayCounts[key]) userDayCounts[key] = new Set();
    userDayCounts[key].add(l.created_at);
  });
  const hitLimitCount = Object.values(userDayCounts).filter(s => s.size >= 3).length;

  return NextResponse.json({
    contextCounts,
    toneCounts,
    copyRate,
    totalReplies,
    totalCopies,
    v2Stats: {
      total: v2Total,
      passRate: v2PassRate,
      avgLatency,
      avgConfidence,
      avgReviseAttempts,
    },
    hitLimitCount,
  });
}
