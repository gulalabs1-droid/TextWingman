import { NextRequest, NextResponse } from 'next/server';
import { publishedCourtCases } from '@/lib/culture-content';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('case');
  const item = publishedCourtCases().find(candidate => candidate.id === id);
  if (!item) return NextResponse.json({ error: 'Case not found.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  const context = item.docket === 'Dating' ? 'crush' : item.docket === 'Friends' ? 'friend' : 'work';
  return NextResponse.json({ message: item.message, context }, { headers: { 'Cache-Control': 'no-store' } });
}
