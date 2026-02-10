import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getUserTier, ensureAdminAccess, hasPro } from '@/lib/entitlements';

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

const FREE_LIMIT = 3; // 3 free replies per day for regular users
const BETA_LIMIT = 20; // 20 free replies per day for FAMTEST7 beta testers
const RESET_HOURS = 24;

// VPN/Abuse Detection - Moderate tolerance
const VPN_ABUSE_THRESHOLD = 5; // Max different IPs per fingerprint in 1 hour
const VPN_CHECK_WINDOW_HOURS = 1;

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return '127.0.0.1';
}

// Get browser fingerprint from headers (lightweight)
function getFingerprint(request: NextRequest): string {
  const ua = request.headers.get('user-agent') || '';
  const lang = request.headers.get('accept-language') || '';
  // Create a simple fingerprint from stable headers (hex to avoid +/= breaking Supabase .or() filter)
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(`${ua}-${lang}`).digest('hex').substring(0, 32);
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const cutoffTime = new Date(Date.now() - RESET_HOURS * 60 * 60 * 1000).toISOString();

    // Check if user is logged in
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    const userId = user?.id || null;

    // Check entitlements (includes admin, beta, and Stripe users)
    let isPro = false;
    let isBetaTester = false;
    let isAdmin = false;
    let tier = 'free';
    
    let trialDaysLeft: number | null = null;
    
    if (userId && user?.email) {
      // Auto-grant elite access for admin emails
      await ensureAdminAccess(userId, user.email);
      
      // Get user's tier from entitlements system
      const entitlement = await getUserTier(userId, user.email);
      tier = entitlement.tier;
      isAdmin = entitlement.isAdmin;
      isPro = hasPro(entitlement.tier);
      
      // Check for trial entitlement expiry
      const { data: ent } = await getSupabase()
        .from('entitlements')
        .select('expires_at')
        .eq('user_id', userId)
        .single();
      if (ent?.expires_at) {
        const diffMs = new Date(ent.expires_at).getTime() - Date.now();
        trialDaysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }
      
      // Check if beta tester (from subscriptions table for FAMTEST7 users)
      const { data: subscription } = await getSupabase()
        .from('subscriptions')
        .select('is_beta_tester')
        .eq('user_id', userId)
        .single();
      isBetaTester = subscription?.is_beta_tester === true;
    }
    
    // Determine user's limit
    const userLimit = isBetaTester ? BETA_LIMIT : FREE_LIMIT;

    // Pro/Elite users get unlimited - skip usage check
    if (isPro) {
      return NextResponse.json({
        usageCount: 0,
        remaining: 999,
        limit: FREE_LIMIT,
        canGenerate: true,
        resetHours: RESET_HOURS,
        isPro: true,
        isAdmin,
        tier,
        userId: userId,
        userEmail: user?.email || null,
        trialDaysLeft,
      });
    }

    // Build query - for logged-in users, count BOTH user_id matches AND ip_address matches
    // This ensures old logs (before user_id tracking) still count
    let query = getSupabase()
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', cutoffTime);
    
    if (userId) {
      // Logged-in user: count only their own usage (not shared IP)
      query = query.eq('user_id', userId);
    } else {
      // Anonymous: check by IP OR fingerprint (catches incognito/VPN)
      const fp = getFingerprint(request);
      query = query.or(`ip_address.eq.${ip},fingerprint.eq.${fp}`);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Usage check error:', error);
      return NextResponse.json({ error: 'Failed to check usage' }, { status: 500 });
    }

    const usageCount = count || 0;
    const remaining = Math.max(0, userLimit - usageCount);
    const canGenerate = usageCount < userLimit;

    return NextResponse.json({
      usageCount,
      remaining,
      limit: userLimit,
      canGenerate,
      resetHours: RESET_HOURS,
      isPro: false,
      isBetaTester,
      userId: userId,
      userEmail: user?.email || null,
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const fingerprint = getFingerprint(request);
    const cutoffTime = new Date(Date.now() - RESET_HOURS * 60 * 60 * 1000).toISOString();
    const vpnCheckTime = new Date(Date.now() - VPN_CHECK_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

    // Check if user is logged in
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    const userId = user?.id || null;

    // Check entitlements and beta tester status
    let isBetaTester = false;
    let isPro = false;
    
    if (userId && user?.email) {
      // Auto-grant elite access for admin emails
      await ensureAdminAccess(userId, user.email);
      
      // Get user's tier
      const entitlement = await getUserTier(userId, user.email);
      isPro = hasPro(entitlement.tier);
      
      // If Pro/Elite, skip usage tracking entirely
      if (isPro) {
        return NextResponse.json({
          usageCount: 0,
          remaining: 999,
          limit: 999,
          canGenerate: true,
        });
      }
      
      // Check beta tester status
      const { data: subscription } = await getSupabase()
        .from('subscriptions')
        .select('is_beta_tester')
        .eq('user_id', userId)
        .single();
      isBetaTester = subscription?.is_beta_tester === true;
    }
    const userLimit = isBetaTester ? BETA_LIMIT : FREE_LIMIT;

    // VPN/Abuse check: Count unique IPs for this fingerprint in last hour (skip for logged-in users)
    if (!userId) {
      const { data: recentLogs } = await getSupabase()
        .from('usage_logs')
        .select('ip_address')
        .eq('fingerprint', fingerprint)
        .gte('created_at', vpnCheckTime);

      if (recentLogs) {
        const uniqueIPs = new Set(recentLogs.map(log => log.ip_address));
        uniqueIPs.add(ip); // Include current IP
        
        if (uniqueIPs.size >= VPN_ABUSE_THRESHOLD) {
          return NextResponse.json({
            error: 'vpn_abuse_detected',
            message: 'Unusual activity detected. Upgrade to Pro for unlimited access.',
            upgradeUrl: '/#pricing',
            usageCount: FREE_LIMIT,
            remaining: 0,
            canGenerate: false,
          }, { status: 429 });
        }
      }
    }

    // Build query - for logged-in users, count BOTH user_id matches AND ip_address matches
    // This ensures old logs (before user_id tracking) still count
    let countQuery = getSupabase()
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', cutoffTime);
    
    if (userId) {
      // Logged-in user: count only their own usage (not shared IP)
      countQuery = countQuery.eq('user_id', userId);
    } else {
      // Anonymous: check by IP OR fingerprint (catches incognito/VPN)
      countQuery = countQuery.or(`ip_address.eq.${ip},fingerprint.eq.${fingerprint}`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Usage count error:', countError);
      return NextResponse.json({ error: 'Failed to check usage' }, { status: 500 });
    }

    const usageCount = count || 0;

    if (usageCount >= userLimit) {
      return NextResponse.json({
        error: 'Free limit reached',
        usageCount,
        remaining: 0,
        limit: userLimit,
        canGenerate: false,
      }, { status: 429 });
    }

    const { error: insertError } = await getSupabase()
      .from('usage_logs')
      .insert({
        ip_address: ip,
        user_id: userId,
        user_agent: userAgent,
        action: 'generate_reply',
        fingerprint: fingerprint,
      });

    if (insertError) {
      console.error('Usage log insert error:', insertError);
      return NextResponse.json({ error: 'Failed to log usage' }, { status: 500 });
    }

    const newCount = usageCount + 1;
    const remaining = Math.max(0, userLimit - newCount);

    return NextResponse.json({
      usageCount: newCount,
      remaining,
      limit: userLimit,
      canGenerate: newCount < userLimit,
    });
  } catch (error) {
    console.error('Usage POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
