import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminSupabase } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getAdminSupabase();
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const plan = url.searchParams.get('plan') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  // Fetch all profiles
  let query = db.from('profiles').select('*', { count: 'exact' });

  if (search) {
    query = query.or(`email.ilike.%${search}%,id.eq.${search.length === 36 ? search : '00000000-0000-0000-0000-000000000000'}`);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  const { data: profiles, count } = await query;

  if (!profiles) return NextResponse.json({ users: [], total: 0 });

  const userIds = profiles.map(p => p.id);

  // Batch fetch related data
  const [
    { data: entitlements },
    { data: subscriptions },
  ] = await Promise.all([
    db.from('entitlements').select('*').in('user_id', userIds),
    db.from('subscriptions').select('*').in('user_id', userIds),
  ]);

  // Usage counts (7d, 30d, lifetime) per user
  const d7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: usage7d } = await db.from('usage_logs').select('user_id').in('user_id', userIds).gte('created_at', d7);
  const { data: usage30d } = await db.from('usage_logs').select('user_id').in('user_id', userIds).gte('created_at', d30);
  const { data: usageAll } = await db.from('usage_logs').select('user_id').in('user_id', userIds);

  // Last reply time per user
  const { data: lastReplies } = await db.from('reply_history').select('user_id, created_at').in('user_id', userIds).order('created_at', { ascending: false });

  // Build lookup maps
  const entMap = new Map(entitlements?.map(e => [e.user_id, e]) || []);
  const subMap = new Map(subscriptions?.map(s => [s.user_id, s]) || []);

  const countBy = (arr: { user_id: string }[] | null, uid: string) =>
    arr?.filter(r => r.user_id === uid).length || 0;

  const lastReplyMap = new Map<string, string>();
  lastReplies?.forEach(r => {
    if (!lastReplyMap.has(r.user_id)) lastReplyMap.set(r.user_id, r.created_at);
  });

  const users = profiles.map(p => {
    const ent = entMap.get(p.id);
    const sub = subMap.get(p.id);
    let planLabel = 'free';
    let planSource = 'none';
    if (ent && ent.tier !== 'free') {
      planLabel = ent.tier;
      planSource = ent.source;
    } else if (sub?.status === 'active') {
      planLabel = 'pro';
      planSource = 'stripe';
    }

    return {
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      created_at: p.created_at,
      onboarding_completed: p.onboarding_completed,
      beta_group: p.beta_group,
      plan: planLabel,
      plan_source: planSource,
      replies_7d: countBy(usage7d, p.id),
      replies_30d: countBy(usage30d, p.id),
      replies_lifetime: countBy(usageAll, p.id),
      last_reply_at: lastReplyMap.get(p.id) || null,
      subscription_status: sub?.status || null,
    };
  });

  // Apply plan filter after enrichment
  const filtered = plan ? users.filter(u => u.plan === plan) : users;

  return NextResponse.json({ users: filtered, total: count || 0, page, limit });
}
