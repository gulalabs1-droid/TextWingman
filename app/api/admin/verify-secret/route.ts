import { NextRequest, NextResponse } from 'next/server';
import { validateAdminSecret } from '@/lib/isAdmin';
import { requireAdmin } from '@/lib/admin';

export async function POST(request: NextRequest) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { secret } = await request.json();
  if (!validateAdminSecret(secret)) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 });
  }

  return NextResponse.json({ valid: true });
}
