import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminSupabase, logAdminEvent } from '@/lib/admin';
import { grantEntitlement, revokeEntitlement, Tier } from '@/lib/entitlements';
import { validateAdminSecret } from '@/lib/isAdmin';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getAdminSupabase();
  const userId = params.id;

  const [
    { data: profile },
    { data: entitlement },
    { data: subscription },
    { data: recentReplies },
    { data: v2Runs },
  ] = await Promise.all([
    db.from('profiles').select('*').eq('id', userId).single(),
    db.from('entitlements').select('*').eq('user_id', userId).single(),
    db.from('subscriptions').select('*').eq('user_id', userId).single(),
    db.from('reply_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    db.from('v2_runs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
  ]);

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Usage stats
  const h24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const d7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: usage24h },
    { count: usage7d },
    { count: usageLifetime },
    { data: usageLogs24h },
  ] = await Promise.all([
    db.from('usage_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', h24),
    db.from('usage_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', d7),
    db.from('usage_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    db.from('usage_logs').select('ip_address, created_at').eq('user_id', userId).gte('created_at', h24),
  ]);

  // IP conflicts: count unique IPs in last 24h
  const uniqueIps = new Set(usageLogs24h?.map(l => l.ip_address).filter(Boolean));

  // V2 stats
  const v2PassRate = v2Runs && v2Runs.length > 0
    ? Math.round((v2Runs.filter(r => r.all_passed).length / v2Runs.length) * 100)
    : null;
  const avgConfidence = v2Runs && v2Runs.length > 0
    ? Math.round(v2Runs.reduce((sum, r) => sum + (r.avg_confidence || 0), 0) / v2Runs.length)
    : null;

  return NextResponse.json({
    profile,
    entitlement,
    subscription,
    recentReplies: recentReplies || [],
    v2Runs: v2Runs || [],
    usage: {
      h24: usage24h || 0,
      d7: usage7d || 0,
      lifetime: usageLifetime || 0,
      uniqueIps24h: uniqueIps.size,
    },
    v2Stats: { passRate: v2PassRate, avgConfidence },
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { isAdmin, user: adminUser } = await requireAdmin();
  if (!isAdmin || !adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getAdminSupabase();
  const userId = params.id;
  const body = await req.json();
  const { action, secret, tier, beta_group } = body;

  // Destructive actions require secret
  const destructiveActions = ['grant_entitlement', 'revoke_entitlement', 'delete_history', 'disable_account'];
  if (destructiveActions.includes(action)) {
    if (!validateAdminSecret(secret)) {
      return NextResponse.json({ error: 'Invalid admin secret' }, { status: 403 });
    }
  }

  switch (action) {
    case 'grant_entitlement': {
      if (!tier || !['pro', 'elite'].includes(tier)) {
        return NextResponse.json({ error: 'Valid tier required' }, { status: 400 });
      }
      const result = await grantEntitlement(userId, tier as Tier, 'admin');
      await logAdminEvent(adminUser.id, 'grant_entitlement', userId, { tier });
      return NextResponse.json({ success: result.success });
    }
    case 'revoke_entitlement': {
      const result = await revokeEntitlement(userId);
      await logAdminEvent(adminUser.id, 'revoke_entitlement', userId);
      return NextResponse.json({ success: result.success });
    }
    case 'set_beta_group': {
      await db.from('profiles').update({ beta_group, updated_at: new Date().toISOString() }).eq('id', userId);
      await logAdminEvent(adminUser.id, 'set_beta_group', userId, { beta_group });
      return NextResponse.json({ success: true });
    }
    case 'delete_history': {
      await db.from('reply_history').delete().eq('user_id', userId);
      await logAdminEvent(adminUser.id, 'delete_history', userId);
      return NextResponse.json({ success: true });
    }
    case 'disable_account': {
      await db.from('profiles').update({ plan: 'disabled', updated_at: new Date().toISOString() }).eq('id', userId);
      await logAdminEvent(adminUser.id, 'disable_account', userId);
      return NextResponse.json({ success: true });
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
