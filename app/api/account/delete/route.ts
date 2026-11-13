import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

// Statuses where Stripe can still bill (or resume billing for) the customer.
const BILLABLE_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid', 'incomplete', 'paused']);

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

    // Stop billing before anything is deleted. If we can't confirm the Stripe
    // subscription is canceled, keep the account so the user can still reach
    // the billing portal — deleting it would leave them charged with no login.
    const { data: subscriptions, error: subLookupError } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id, status')
      .eq('user_id', userId);

    if (subLookupError) {
      console.error('Account deletion: subscription lookup failed:', subLookupError.message);
      return NextResponse.json({ error: 'Could not verify your subscription. Please try again.' }, { status: 503 });
    }

    for (const sub of subscriptions || []) {
      if (!sub.stripe_subscription_id) continue;
      try {
        const live = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
        if (BILLABLE_STATUSES.has(live.status)) {
          await stripe.subscriptions.cancel(sub.stripe_subscription_id);
        }
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === 'resource_missing') continue; // already gone in Stripe
        console.error('Account deletion: Stripe cancel failed:', error);
        return NextResponse.json(
          { error: 'We could not cancel your subscription. Please cancel it from billing first, then try again.' },
          { status: 502 },
        );
      }
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
      'suggestions',
      'entitlements',
      'subscriptions',
    ];

    for (const table of tables) {
      const { error } = await admin.from(table).delete().eq('user_id', userId);
      if (error) {
        console.error(`Error deleting from ${table}:`, error.message);
      }
    }

    const { error: profileError } = await admin.from('profiles').delete().eq('id', userId);
    if (profileError) console.error('Error deleting profile:', profileError.message);

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
