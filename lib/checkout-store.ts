import type { SupabaseClient } from '@supabase/supabase-js';
import type { CheckoutAttempt, CheckoutGuardStore } from './checkout-guard';

/** All calls use the server-only service client and are scoped to the authenticated user. */
export function checkoutGuardStore(db: SupabaseClient): CheckoutGuardStore {
  return {
    async reserve(candidate) {
      const { error: insertError } = await db.from('checkout_guards').insert(candidate);
      if (insertError && insertError.code !== '23505') throw insertError;
      const { data, error } = await db.from('checkout_guards').select('*').eq('user_id', candidate.user_id).single();
      if (error || !data) throw error || new Error('Checkout guard unavailable');
      return data as CheckoutAttempt;
    },
    async saveSession(attempt, sessionId) {
      const { data, error } = await db.from('checkout_guards')
        .update({ stripe_session_id: sessionId })
        .eq('user_id', attempt.user_id).eq('attempt_id', attempt.attempt_id).select('attempt_id');
      if (error) throw error;
      return Boolean(data?.length);
    },
    async replace(previous, candidate) {
      const { data, error } = await db.from('checkout_guards')
        .update(candidate).eq('user_id', previous.user_id).eq('attempt_id', previous.attempt_id).select('attempt_id');
      if (error) throw error;
      return Boolean(data?.length);
    },
  };
}
