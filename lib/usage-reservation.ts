import type { SupabaseClient } from '@supabase/supabase-js';
import type { RequestAnalytics } from '@/lib/analytics-server';
import { freeLimitReached, replyUsageCutoff } from '@/lib/usage-limits';

type Reservation = { status: 'reserved'; logId: string } | { status: 'limit' } | { status: 'unavailable' };

export async function reserveCoachUse(admin: SupabaseClient, userId: string, analytics: RequestAnalytics): Promise<Reservation> {
  const { count, error: countError } = await admin.from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', 'generate_reply')
    .gte('created_at', replyUsageCutoff());
  if (countError) return { status: 'unavailable' };
  if (freeLimitReached(count || 0)) return { status: 'limit' };

  const { ip, userAgent, fingerprint } = analytics.identity;
  const { data: log, error: insertError } = await admin.from('usage_logs').insert({
    ip_address: ip,
    user_id: userId,
    user_agent: userAgent,
    action: 'generate_reply',
    fingerprint,
    metadata: analytics.metadata,
  }).select('id').single();
  if (insertError || !log?.id) return { status: 'unavailable' };
  return { status: 'reserved', logId: log.id };
}
