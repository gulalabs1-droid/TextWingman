-- Keep one durable checkout attempt per account. Only the server may read or write it.
CREATE TABLE IF NOT EXISTS public.checkout_guards (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL UNIQUE,
  plan text NOT NULL CHECK (plan IN ('monthly', 'weekly', 'annual')),
  session_params jsonb NOT NULL,
  stripe_session_id text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checkout_guards ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.checkout_guards FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.checkout_guards TO service_role;
