import { NextResponse } from 'next/server';
import { requireAdmin, getAdminSupabase } from '@/lib/admin';

const PRICE_MAP: Record<string, { amount: number; interval: 'week' | 'month' | 'year' }> = {
  weekly: { amount: 9.99, interval: 'week' },
  monthly: { amount: 29.99, interval: 'month' },
  annual: { amount: 99.99, interval: 'year' },
};

export async function GET() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getAdminSupabase();
  const now = new Date();
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: signups24h },
    { count: signups7d },
    { count: signups30d },
    { count: totalGenerations },
    { count: gen24h },
    { count: gen7d },
    { count: gen30d },
    { data: activeSubs },
    { data: cancelingSubs },
    { count: churned7d },
    { count: churned30d },
    { data: dailyGen },
    { data: dailySignups },
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', h24),
    db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', d7),
    db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', d30),
    db.from('usage_logs').select('*', { count: 'exact', head: true }),
    db.from('usage_logs').select('*', { count: 'exact', head: true }).gte('created_at', h24),
    db.from('usage_logs').select('*', { count: 'exact', head: true }).gte('created_at', d7),
    db.from('usage_logs').select('*', { count: 'exact', head: true }).gte('created_at', d30),
    db.from('subscriptions').select('*').in('status', ['active', 'trialing']),
    db.from('subscriptions').select('*').eq('cancel_at_period_end', true),
    db.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'canceled').gte('updated_at', d7),
    db.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'canceled').gte('updated_at', d30),
    db.from('usage_logs').select('created_at').gte('created_at', d7).order('created_at', { ascending: true }),
    db.from('profiles').select('created_at').gte('created_at', d30).order('created_at', { ascending: true }),
  ]);

  // Activated users (generated >= 1 reply)
  const { data: activatedRows } = await db.from('usage_logs').select('user_id').not('user_id', 'is', null);
  const activatedUsers = new Set(activatedRows?.map(r => r.user_id)).size;

  // MRR calculation
  let mrr = 0;
  const planBreakdown: Record<string, number> = {};
  if (activeSubs) {
    for (const sub of activeSubs) {
      const plan = sub.plan_type || 'monthly';
      planBreakdown[plan] = (planBreakdown[plan] || 0) + 1;
      const p = PRICE_MAP[plan];
      if (p) {
        if (p.interval === 'week') mrr += p.amount * 4.33;
        else if (p.interval === 'year') mrr += p.amount / 12;
        else mrr += p.amount;
      }
    }
  }

  // Daily breakdown for sparklines
  const genByDay: Record<string, number> = {};
  dailyGen?.forEach(r => {
    const day = r.created_at.split('T')[0];
    genByDay[day] = (genByDay[day] || 0) + 1;
  });

  const signupsByDay: Record<string, number> = {};
  dailySignups?.forEach(r => {
    const day = r.created_at.split('T')[0];
    signupsByDay[day] = (signupsByDay[day] || 0) + 1;
  });

  const paidUsers = activeSubs?.length || 0;
  const freeUsers = (totalUsers || 0) - paidUsers;
  const conversionRate = totalUsers && totalUsers > 0 ? ((paidUsers / totalUsers) * 100) : 0;
  const activationRate = totalUsers && totalUsers > 0 ? ((activatedUsers / totalUsers) * 100) : 0;

  return NextResponse.json({
    totalUsers: totalUsers || 0,
    signups: { h24: signups24h || 0, d7: signups7d || 0, d30: signups30d || 0 },
    generations: { total: totalGenerations || 0, h24: gen24h || 0, d7: gen7d || 0, d30: gen30d || 0 },
    activatedUsers,
    paidUsers,
    freeUsers,
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(mrr * 12 * 100) / 100,
    conversionRate: Math.round(conversionRate * 100) / 100,
    activationRate: Math.round(activationRate * 100) / 100,
    planBreakdown,
    churn: { d7: churned7d || 0, d30: churned30d || 0 },
    cancelingCount: cancelingSubs?.length || 0,
    genByDay,
    signupsByDay,
  });
}
