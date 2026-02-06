import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    const adminEmails = process.env.ADMIN_EMAILS || '(NOT SET)';
    const adminList = adminEmails.split(',').map(e => e.trim().toLowerCase());

    return NextResponse.json({
      userEmail: user?.email || '(no user / not logged in)',
      userId: user?.id || null,
      authError: error?.message || null,
      adminEmailsEnvRaw: adminEmails,
      adminEmailsParsed: adminList,
      emailMatch: user?.email ? adminList.includes(user.email.toLowerCase()) : false,
      hasAdminSecret: !!process.env.ADMIN_SECRET,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
