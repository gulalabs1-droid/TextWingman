import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

// Admin-only configuration check. Never exposes the admin list or secrets —
// only whether the pieces an admin session needs are configured.
export async function GET() {
  const { user, isAdmin } = await requireAdmin();
  if (!isAdmin || !user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    userEmail: user.email,
    userId: user.id,
    adminEmailsConfigured: Boolean(process.env.ADMIN_EMAILS?.trim()),
    hasAdminSecret: Boolean(process.env.ADMIN_SECRET),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
