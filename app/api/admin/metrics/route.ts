import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminSecret } from '@/lib/isAdmin';

// Stripe price mapping for MRR calculation
const PRICE_MAP: Record<string, { amount: number; interval: 'week' | 'month' | 'year' }> = {
  'weekly': { amount: 9.99, interval: 'week' },
  'monthly': { amount: 29.99, interval: 'month' },
  'annual': { amount: 99.99, interval: 'year' },
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(request: NextRequest) {
  try {
    // Server-side admin auth
    const adminSecret = request.headers.get('x-admin-secret');
    if (!validateAdminSecret(adminSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = getSupabaseAdmin();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Daily Generations (last 24h)
    const { count: dailyGenerations } = await adminSupabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last24h);

    // 2. Total generations (all time)
    const { count: totalGenerations } = await adminSupabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true });

    // 3. Generations last 7 days
    const { count: weeklyGenerations } = await adminSupabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last7d);

    // 4. Get all active subscriptions for Pro usage & MRR
    const { data: activeSubscriptions } = await adminSupabase
      .from('subscriptions')
      .select('*')
      .in('status', ['active', 'trialing']);

    const activePaidUsers = activeSubscriptions?.length || 0;

    // 5. Calculate MRR from active subscriptions
    let mrr = 0;
    if (activeSubscriptions) {
      for (const sub of activeSubscriptions) {
        const planType = sub.plan_type || 'monthly';
        const priceInfo = PRICE_MAP[planType];
        if (priceInfo) {
          // Convert all to monthly equivalent
          if (priceInfo.interval === 'week') {
            mrr += priceInfo.amount * 4.33; // ~4.33 weeks per month
          } else if (priceInfo.interval === 'year') {
            mrr += priceInfo.amount / 12;
          } else {
            mrr += priceInfo.amount;
          }
        }
      }
    }

    // 6. Total registered users (profiles)
    const { count: totalUsers } = await adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 7. Conversion rate = paid users / total users
    const conversionRate = totalUsers && totalUsers > 0 
      ? ((activePaidUsers / totalUsers) * 100).toFixed(2)
      : '0.00';

    // 8. Free users (total - paid)
    const freeUsers = (totalUsers || 0) - activePaidUsers;

    // 9. Daily breakdown for chart (last 7 days)
    const { data: dailyBreakdown } = await adminSupabase
      .from('usage_logs')
      .select('created_at')
      .gte('created_at', last7d)
      .order('created_at', { ascending: true });

    // Group by day
    const dailyData: Record<string, number> = {};
    if (dailyBreakdown) {
      for (const log of dailyBreakdown) {
        const day = new Date(log.created_at).toISOString().split('T')[0];
        dailyData[day] = (dailyData[day] || 0) + 1;
      }
    }

    // 10. Subscription breakdown by plan type
    const planBreakdown: Record<string, number> = {};
    if (activeSubscriptions) {
      for (const sub of activeSubscriptions) {
        const plan = sub.plan_type || 'unknown';
        planBreakdown[plan] = (planBreakdown[plan] || 0) + 1;
      }
    }

    return NextResponse.json({
      // Core metrics
      dailyGenerations: dailyGenerations || 0,
      weeklyGenerations: weeklyGenerations || 0,
      totalGenerations: totalGenerations || 0,
      
      // User metrics
      totalUsers: totalUsers || 0,
      activePaidUsers,
      freeUsers,
      conversionRate: parseFloat(conversionRate),
      
      // Revenue
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(mrr * 12 * 100) / 100,
      
      // Breakdowns
      dailyData,
      planBreakdown,
      
      // Metadata
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Admin metrics error:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
