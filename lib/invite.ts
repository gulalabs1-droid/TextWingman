import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Valid invite codes and their config
export const INVITE_CODES: Record<string, { days: number; tier: string; maxUses: number }> = {
  'FAMILYV2': { days: 7, tier: 'pro', maxUses: 50 },
  'FRIENDSV2': { days: 7, tier: 'pro', maxUses: 50 },
  'BETAV2': { days: 14, tier: 'pro', maxUses: 100 },
};

let adminClient: SupabaseClient | null = null;

function getSupabaseAdmin() {
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    adminClient = createClient(url, key);
  }
  return adminClient;
}

export type RedeemResult = {
  success: boolean;
  error?: string;
  alreadyPro?: boolean;
  tier?: string;
  days?: number;
  expiresAt?: string;
};

/**
 * Redeem an invite code for a given user. Works server-side only.
 * Returns a result object — never throws.
 */
export async function redeemInviteCode(userId: string, code: string): Promise<RedeemResult> {
  try {
    const upperCode = code.toUpperCase().trim();
    const config = INVITE_CODES[upperCode];

    if (!config) {
      return { success: false, error: 'Invalid invite code' };
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return { success: false, error: 'Service unavailable' };
    }

    // Check if user already has an active entitlement
    const { data: existing } = await supabase
      .from('entitlements')
      .select('tier, source, expires_at')
      .eq('user_id', userId)
      .single();

    if (existing && existing.tier !== 'free') {
      if (!existing.expires_at || new Date(existing.expires_at) > new Date()) {
        return { success: false, error: 'You already have Pro access!', alreadyPro: true };
      }
    }

    // Check active Stripe subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .single();

    if (sub) {
      return { success: false, error: 'You already have an active subscription!', alreadyPro: true };
    }

    // Check how many times this code has been used
    const { count } = await supabase
      .from('entitlements')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'beta')
      .like('metadata->>invite_code', upperCode);

    if (count !== null && count >= config.maxUses) {
      return { success: false, error: 'This invite code has reached its limit' };
    }

    // Grant time-limited pro entitlement
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.days);

    const { error } = await supabase
      .from('entitlements')
      .upsert({
        user_id: userId,
        tier: config.tier,
        source: 'beta',
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { invite_code: upperCode },
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error granting invite entitlement:', error);
      return { success: false, error: 'Failed to activate invite' };
    }

    return {
      success: true,
      tier: config.tier,
      days: config.days,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('Invite redeem error:', error);
    return { success: false, error: 'Something went wrong' };
  }
}
