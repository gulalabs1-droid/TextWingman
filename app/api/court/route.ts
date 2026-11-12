import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { COURT_POLL_ID, isCourtChoice } from '@/lib/court';
import { courtVoterHash, readCourtResults, saveCourtVote } from '@/lib/court-server';
import { publishedCourtCases } from '@/lib/culture-content';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const COOKIE_NAME = 'tw_court_voter';
const NO_STORE = { 'Cache-Control': 'no-store' };

function validPollId(value: unknown): string | null {
  if (value === undefined || value === null) return COURT_POLL_ID;
  if (typeof value !== 'string') return null;
  return value === COURT_POLL_ID || publishedCourtCases().some(item => item.id === value) ? value : null;
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

export async function GET(request: NextRequest) {
  const pollId = validPollId(request.nextUrl.searchParams.get('poll'));
  if (!pollId) return NextResponse.json({ error: 'Case not found.' }, { status: 404, headers: NO_STORE });
  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: 'Voting is temporarily unavailable.' }, { status: 503, headers: NO_STORE });
  const hash = courtVoterHash(request.cookies.get(COOKIE_NAME)?.value || '');
  try {
    return NextResponse.json(await readCourtResults(admin, hash, pollId), { headers: NO_STORE });
  } catch (error) {
    console.error('Court results unavailable:', error);
    return NextResponse.json({ error: 'Voting is temporarily unavailable.' }, { status: 503, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403, headers: NO_STORE });
  }
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 415, headers: NO_STORE });
  }
  const body = await request.json().catch(() => null);
  const pollId = validPollId(body?.pollId);
  if (!pollId) return NextResponse.json({ error: 'Case not found.' }, { status: 404, headers: NO_STORE });
  if (!body || !isCourtChoice(body.choice) || (pollId !== COURT_POLL_ID && body.choice === 'C')) {
    return NextResponse.json({ error: 'Choose one of the listed replies.' }, { status: 400, headers: NO_STORE });
  }
  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: 'Voting is temporarily unavailable.' }, { status: 503, headers: NO_STORE });

  const existingToken = request.cookies.get(COOKIE_NAME)?.value || '';
  const token = courtVoterHash(existingToken) ? existingToken : randomBytes(32).toString('hex');
  const hash = courtVoterHash(token)!;
  try {
    await saveCourtVote(admin, hash, body.choice, pollId);
    const response = NextResponse.json({ saved: true, selected: body.choice }, { headers: NO_STORE });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    console.error('Court vote unavailable:', error);
    return NextResponse.json({ error: 'Your vote could not be saved. Please try again.' }, { status: 503, headers: NO_STORE });
  }
}
