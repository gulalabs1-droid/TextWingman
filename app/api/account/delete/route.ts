import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { hasUnfinishedBilling } from '@/lib/account-deletion';
import { stripe } from '@/lib/stripe';

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

    const admin = createAdminClient(adminUrl, adminKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (!user.email) {
      return NextResponse.json({ error: 'We could not verify billing. Please contact support before deleting your account.' }, { status: 503 });
    }

    const { data: subscriptions, error: subLookupError } = await admin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subLookupError) {
      console.error('Account deletion: subscription lookup failed:', subLookupError.message);
      return NextResponse.json({ error: 'Could not verify your subscription. Please try again.' }, { status: 503 });
    }

    try {
      if (await hasUnfinishedBilling(stripe, userId, user.email, subscriptions || [])) {
        return NextResponse.json({ error: 'Cancel your subscription and close any open checkout before deleting your account. Visit Billing or contact support for help.' }, { status: 409 });
      }
    } catch (error) {
      console.error('Account deletion: Stripe verification failed:', error);
      return NextResponse.json({ error: 'We could not verify billing. Please try again or contact support.' }, { status: 503 });
    }

    // Delete personal data. Most tables cascade from auth.users, but several
    // use ON DELETE SET NULL and would otherwise keep message content.
    const tables = [
      'reply_history',
      'reply_outcomes',
      'copy_logs',
      'usage_logs',
      'strategy_logs',
      'saved_threads',
      'v2_runs',
      'x2_runs',
      'suggestions',
      'entitlements',
      'subscriptions',
    ];

    for (const table of tables) {
      const { error } = await admin.from(table).delete().eq('user_id', userId);
      if (error) {
        console.error(`Error deleting from ${table}:`, error.message);
        return NextResponse.json({ error: 'We could not finish deleting your data. Please try again or contact support.' }, { status: 503 });
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
