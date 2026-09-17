-- Reply selection and outcome learning.
-- Stores only behavioral signals and never the user's raw conversation or reply text.
CREATE TABLE IF NOT EXISTS public.reply_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_id TEXT,
  session_id TEXT,
  generation_id TEXT NOT NULL,
  reply_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'generated', 'selected', 'copied', 'edited', 'sent_confirmed',
    'outcome_reported', 'style_signal_recorded'
  )),
  tone TEXT,
  context TEXT,
  outcome TEXT CHECK (outcome IS NULL OR outcome IN ('got_reply', 'no_reply', 'not_reported')),
  style_signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reply_outcomes_user_created
  ON public.reply_outcomes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reply_outcomes_generation
  ON public.reply_outcomes(generation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reply_outcomes_event
  ON public.reply_outcomes(event_type, created_at DESC);

ALTER TABLE public.reply_outcomes ENABLE ROW LEVEL SECURITY;

-- The route writes through service_role so anonymous learning events work too.
-- No client role receives direct read/write access to this behavioral table.
REVOKE ALL ON public.reply_outcomes FROM anon, authenticated;
