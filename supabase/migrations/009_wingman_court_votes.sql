-- Separate, service-only ballot storage. No personal messages or account data are stored.
BEGIN;

CREATE TABLE IF NOT EXISTS public.wingman_court_votes (
  poll_id TEXT NOT NULL,
  voter_hash TEXT NOT NULL CHECK (voter_hash ~ '^[a-f0-9]{64}$'),
  choice TEXT NOT NULL CHECK (choice IN ('A', 'B', 'C')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (poll_id, voter_hash)
);

CREATE INDEX IF NOT EXISTS idx_wingman_court_poll_choice
  ON public.wingman_court_votes (poll_id, choice);

ALTER TABLE public.wingman_court_votes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.wingman_court_votes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.wingman_court_votes TO service_role;

COMMENT ON TABLE public.wingman_court_votes IS 'Court ballots keyed by a hashed random browser token; no chat or account data.';

COMMIT;
NOTIFY pgrst, 'reload schema';
