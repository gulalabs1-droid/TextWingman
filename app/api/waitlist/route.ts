import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/admin';
import { enforceSecurityRateLimit } from '@/lib/security-rate-limit';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Waitlist service is not configured' },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    const { email, ref } = body;

    // Validate email
    if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const limited = await enforceSecurityRateLimit(req, 'waitlist', 8, 900);
    if (limited) return limited;

    const { error } = await getAdminSupabase()
      .from('v2_waitlist')
      .insert([
        {
          email: normalizedEmail,
          referral_source: typeof ref === 'string' ? ref.slice(0, 128) : null,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: true, message: "Thanks! We'll notify you about updates." },
          { status: 200 }
        );
      }

      console.error('Waitlist insert error:', error);
      return NextResponse.json(
        { error: 'Failed to join waitlist' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Thanks! We'll notify you about updates." },
      { status: 200 }
    );
  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
