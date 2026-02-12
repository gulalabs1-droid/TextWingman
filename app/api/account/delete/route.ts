import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function DELETE() {
  try {
    // Verify the user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = user.id;

    // Use service role to delete user data and auth record
    const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!adminUrl || !adminKey) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const admin = createAdminClient(adminUrl, adminKey);

    // Delete user data from all tables (order matters for FK constraints)
    const tables = [
      'reply_history',
      'copy_logs',
      'usage_logs',
      'v2_runs',
      'suggestions',
      'entitlements',
      'subscriptions',
      'profiles',
    ];

    for (const table of tables) {
      const { error } = await admin.from(table).delete().eq('user_id', userId);
      if (error) {
        console.error(`Error deleting from ${table}:`, error.message);
      }
    }

    // Delete the auth user
    const { error: authError } = await admin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError.message);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
