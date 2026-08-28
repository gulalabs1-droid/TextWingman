-- Index the first-party identity and canonical event fields used by the admin
-- funnel. Safe to run more than once.

CREATE INDEX IF NOT EXISTS idx_usage_logs_metadata_visitor_id
  ON public.usage_logs ((metadata ->> 'visitor_id'));
CREATE INDEX IF NOT EXISTS idx_usage_logs_metadata_session_id
  ON public.usage_logs ((metadata ->> 'session_id'));
CREATE INDEX IF NOT EXISTS idx_usage_logs_metadata_event
  ON public.usage_logs ((metadata ->> 'event'), created_at);

