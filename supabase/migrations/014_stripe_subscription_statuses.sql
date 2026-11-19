-- Preserve existing accepted statuses while allowing all current Stripe states.
-- This only changes the allowed values; it does not change any subscription.
DO $$
DECLARE
  old_check text;
  accepts_stripe_statuses boolean;
BEGIN
  SELECT pg_get_expr(c.conbin, c.conrelid) INTO old_check
  FROM pg_constraint c
  WHERE c.conrelid = 'public.subscriptions'::regclass
    AND c.conname = 'subscriptions_status_check'
    AND c.contype = 'c';

  IF old_check IS NULL THEN
    RAISE EXCEPTION 'Expected subscriptions_status_check was not found; inspect the live schema before continuing';
  END IF;

  EXECUTE format(
    'SELECT bool_and(COALESCE((%s), false)) FROM (VALUES (''incomplete''), (''incomplete_expired''), (''trialing''), (''active''), (''past_due''), (''canceled''), (''unpaid''), (''paused'')) AS current_statuses(status)',
    old_check
  ) INTO accepts_stripe_statuses;

  IF NOT accepts_stripe_statuses THEN
    ALTER TABLE public.subscriptions DROP CONSTRAINT subscriptions_status_check;
    EXECUTE format(
      'ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check CHECK ((%s) OR status IN (''incomplete'', ''incomplete_expired'', ''trialing'', ''active'', ''past_due'', ''canceled'', ''unpaid'', ''paused''))',
      old_check
    );
  END IF;
END;
$$;
