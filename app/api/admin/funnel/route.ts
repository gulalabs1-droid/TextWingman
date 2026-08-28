import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase, requireAdmin } from '@/lib/admin';
import { getCanonicalFunnel } from '@/lib/admin-funnel';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { user, isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requestedDays = Number(new URL(request.url).searchParams.get('days') || 30);
  const days = Number.isFinite(requestedDays) ? Math.min(Math.max(Math.round(requestedDays), 1), 90) : 30;

  try {
    const funnel = await getCanonicalFunnel(getAdminSupabase(), {
      rangeDays: days,
      currentAdminId: user?.id,
    });
    return NextResponse.json(funnel);
  } catch (error) {
    console.error('Admin funnel error:', error);
    return NextResponse.json({ error: 'Unable to load funnel data' }, { status: 500 });
  }
}

