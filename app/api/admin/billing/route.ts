import { NextResponse } from 'next/server';
import { requireAdmin, getAdminSupabase } from '@/lib/admin';

export async function GET() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getAdminSupabase();
  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: allSubs },
    { data: cancelingSubs },
    { data: upcomingRenewals },
  ] = await Promise.all([
    db.from('subscriptions').select('*'),
    db.from('subscriptions').select('*, profiles!inner(email)').eq('cancel_at_period_end', true),
    db.from('subscriptions').select('*, profiles!inner(email)').in('status', ['active', 'trialing']).lte('current_period_end', in7d).gte('current_period_end', now.toISOString()),
  ]);

  // Orphaned: active/trialing but missing stripe ids
  const orphaned = allSubs?.filter(s =>
    ['active', 'trialing'].includes(s.status) &&
    (!s.stripe_subscription_id || !s.stripe_customer_id)
  ) || [];

  // Mismatch: profile.plan doesn't match derived plan
  const activeUserIds = new Set(allSubs?.filter(s => s.status === 'active' || s.status === 'trialing').map(s => s.user_id));
  const { data: profiles } = await db.from('profiles').select('id, plan, email');
  const mismatches = profiles?.filter(p => {
    const hasActiveSub = activeUserIds.has(p.id);
    // plan column is stale — just flag if someone has plan='disabled'
    return p.plan === 'disabled';
  }) || [];

  // Recent admin events (last 50)
  const { data: recentEvents } = await db.from('admin_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({
    totalSubs: allSubs?.length || 0,
    activeSubs: allSubs?.filter(s => s.status === 'active' || s.status === 'trialing').length || 0,
    canceledSubs: allSubs?.filter(s => s.status === 'canceled').length || 0,
    orphaned,
    cancelingSubs: cancelingSubs || [],
    upcomingRenewals: upcomingRenewals || [],
    mismatches,
    recentEvents: recentEvents || [],
  });
}
