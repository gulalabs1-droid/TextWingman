import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminSupabase, logAdminEvent } from '@/lib/admin';
import { validateAdminSecret } from '@/lib/isAdmin';
import { grantEntitlement } from '@/lib/entitlements';

export async function GET() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // System status checks
  const checks = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabase_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    openai_key: !!process.env.OPENAI_API_KEY,
    stripe_secret: !!process.env.STRIPE_SECRET_KEY,
    stripe_webhook_secret: !!process.env.STRIPE_WEBHOOK_SECRET,
    admin_emails: !!process.env.ADMIN_EMAILS,
    admin_secret: !!process.env.ADMIN_SECRET,
    app_url: process.env.NEXT_PUBLIC_APP_URL || 'not set',
  };

  // Recent admin events
  const db = getAdminSupabase();
  const { data: recentEvents } = await db.from('admin_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({ checks, recentEvents: recentEvents || [] });
}

export async function POST(request: NextRequest) {
  const { isAdmin, user } = await requireAdmin();
  if (!isAdmin || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, secret, ...params } = await request.json();

  if (!validateAdminSecret(secret)) {
    return NextResponse.json({ error: 'Invalid admin secret' }, { status: 403 });
  }

  const db = getAdminSupabase();

  switch (action) {
    case 'seed_owner_elite': {
      const result = await grantEntitlement(user.id, 'elite', 'admin');
      await logAdminEvent(user.id, 'seed_owner_elite', user.id);
      return NextResponse.json({ success: result.success });
    }
    case 'export_users': {
      const { data: users } = await db.from('profiles').select('id, email, created_at, plan, beta_group');
      await logAdminEvent(user.id, 'export_users');
      return NextResponse.json({ data: users || [] });
    }
    case 'export_subs': {
      const { data: subs } = await db.from('subscriptions').select('*, profiles!inner(email)');
      await logAdminEvent(user.id, 'export_subs');
      return NextResponse.json({ data: subs || [] });
    }
    case 'export_churn': {
      const { data: churned } = await db.from('subscriptions').select('*, profiles!inner(email)').eq('status', 'canceled');
      await logAdminEvent(user.id, 'export_churn');
      return NextResponse.json({ data: churned || [] });
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
