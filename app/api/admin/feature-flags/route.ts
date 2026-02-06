import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminSupabase, logAdminEvent } from '@/lib/admin';
import { validateAdminSecret } from '@/lib/isAdmin';

export async function GET() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getAdminSupabase();
  const { data: flags } = await db.from('feature_flags').select('*').order('key');
  return NextResponse.json({ flags: flags || [] });
}

export async function POST(request: NextRequest) {
  const { isAdmin, user } = await requireAdmin();
  if (!isAdmin || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { key, value, secret } = await request.json();
  if (!validateAdminSecret(secret)) {
    return NextResponse.json({ error: 'Invalid admin secret' }, { status: 403 });
  }

  const db = getAdminSupabase();
  const { error } = await db.from('feature_flags')
    .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: user.id }, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminEvent(user.id, 'update_feature_flag', undefined, { key, value });
  return NextResponse.json({ success: true });
}
