/**
 * Entitlements System
 * Manages user access tiers separate from Stripe subscriptions
 * 
 * Tiers: free | pro | elite
 * Sources: stripe | admin | beta
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isAdminEmail } from './isAdmin';

let supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

export type Tier = 'free' | 'pro' | 'elite';
export type Source = 'stripe' | 'admin' | 'beta';

export interface Entitlement {
  user_id: string;
  tier: Tier;
  source: Source;
  created_at: string;
  updated_at: string;
}

/**
 * Get user's entitlement tier
 * Priority: admin/beta entitlements > stripe subscriptions > free
 */
export async function getUserTier(userId: string, userEmail?: string): Promise<{
  tier: Tier;
  source: Source;
  isAdmin: boolean;
}> {
  // Check if user is admin by email
  const isAdmin = isAdminEmail(userEmail);
  
  // First check entitlements table
  const { data: entitlement } = await getSupabase()
    .from('entitlements')
    .select('tier, source')
    .eq('user_id', userId)
    .single();
  
  if (entitlement) {
    return {
      tier: entitlement.tier as Tier,
      source: entitlement.source as Source,
      isAdmin,
    };
  }
  
  // Fall back to checking Stripe subscriptions (active or trialing)
  const { data: subscription } = await getSupabase()
    .from('subscriptions')
    .select('status, plan_type')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .single();
  
  if (subscription) {
    return {
      tier: 'pro',
      source: 'stripe',
      isAdmin,
    };
  }
  
  // Default to free
  return {
    tier: 'free',
    source: 'stripe',
    isAdmin,
  };
}

/**
 * Grant entitlement to a user (admin only)
 */
export async function grantEntitlement(
  userId: string,
  tier: Tier,
  source: Source = 'admin'
): Promise<{ success: boolean; error?: string }> {
  const { error } = await getSupabase()
    .from('entitlements')
    .upsert({
      user_id: userId,
      tier,
      source,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  
  if (error) {
    console.error('Error granting entitlement:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

/**
 * Revoke entitlement (set back to free)
 */
export async function revokeEntitlement(userId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await getSupabase()
    .from('entitlements')
    .delete()
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error revoking entitlement:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

/**
 * Ensure admin user has elite access
 * Called on login/dashboard load for admin emails
 */
export async function ensureAdminAccess(userId: string, email: string): Promise<void> {
  if (!isAdminEmail(email)) return;
  
  // Check if already has admin entitlement
  const { data: existing } = await getSupabase()
    .from('entitlements')
    .select('tier, source')
    .eq('user_id', userId)
    .single();
  
  // Only create/update if not already elite from admin
  if (!existing || existing.source !== 'admin' || existing.tier !== 'elite') {
    await grantEntitlement(userId, 'elite', 'admin');
    console.log('Auto-granted elite access to admin:', email);
  }
}

/**
 * Check if user has Pro or higher access
 */
export function hasPro(tier: Tier): boolean {
  return tier === 'pro' || tier === 'elite';
}

/**
 * Check if user has Elite access
 */
export function hasElite(tier: Tier): boolean {
  return tier === 'elite';
}
