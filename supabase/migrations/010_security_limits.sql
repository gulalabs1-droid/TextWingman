-- Additive, server-only counters. Apply before deploying code that calls them.
CREATE TABLE IF NOT EXISTS public.security_rate_limits (
  bucket text PRIMARY KEY,
  hits integer NOT NULL,
  expires_at timestamptz NOT NULL
);

ALTER TABLE public.security_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.security_rate_limits FROM PUBLIC, anon, authenticated;
CREATE INDEX IF NOT EXISTS security_rate_limits_expiry_idx ON public.security_rate_limits(expires_at);

CREATE OR REPLACE FUNCTION public.take_security_rate_limit(p_bucket text, p_limit integer, p_window_seconds integer)
RETURNS TABLE(allowed boolean, retry_after_seconds integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  current_hits integer;
  current_expiry timestamptz;
BEGIN
  IF p_bucket IS NULL OR length(p_bucket) > 160 OR p_limit < 1 OR p_limit > 1000 OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'invalid rate limit parameters';
  END IF;

  INSERT INTO public.security_rate_limits AS limits (bucket, hits, expires_at)
  VALUES (p_bucket, 1, now() + make_interval(secs => p_window_seconds))
  ON CONFLICT (bucket) DO UPDATE SET
    hits = CASE WHEN limits.expires_at <= now() THEN 1 ELSE least(limits.hits + 1, p_limit + 1) END,
    expires_at = CASE WHEN limits.expires_at <= now() THEN now() + make_interval(secs => p_window_seconds) ELSE limits.expires_at END
  RETURNING limits.hits, limits.expires_at INTO current_hits, current_expiry;

  IF random() < 0.01 THEN
    DELETE FROM public.security_rate_limits WHERE bucket IN (
      SELECT bucket FROM public.security_rate_limits WHERE expires_at < now() - interval '1 day' LIMIT 200 FOR UPDATE SKIP LOCKED
    );
  END IF;

  RETURN QUERY SELECT current_hits <= p_limit, greatest(1, ceil(extract(epoch FROM current_expiry - now()))::integer);
END;
$$;

REVOKE ALL ON FUNCTION public.take_security_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.take_security_rate_limit(text, integer, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.reserve_reply_usage(
  p_user_id uuid, p_ip text, p_fingerprint text, p_user_agent text, p_metadata jsonb, p_limit integer
)
RETURNS TABLE(reserved boolean, log_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  used_count bigint;
  new_id uuid;
BEGIN
  IF p_limit < 1 OR p_limit > 100 OR p_ip IS NULL OR p_fingerprint IS NULL THEN
    RAISE EXCEPTION 'invalid usage reservation';
  END IF;

  IF p_user_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('tw-user:' || p_user_id::text, 0));
  ELSE
    PERFORM pg_advisory_xact_lock(hashtextextended('tw-ip:' || p_ip, 0));
    PERFORM pg_advisory_xact_lock(hashtextextended('tw-fingerprint:' || p_fingerprint, 0));
  END IF;

  SELECT count(*) INTO used_count FROM public.usage_logs
  WHERE action = 'generate_reply' AND created_at >= now() - interval '24 hours'
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id)
      OR (p_user_id IS NULL AND user_id IS NULL AND (ip_address = p_ip OR fingerprint = p_fingerprint))
    );

  IF used_count >= p_limit THEN
    RETURN QUERY SELECT false, NULL::uuid;
    RETURN;
  END IF;

  INSERT INTO public.usage_logs(user_id, ip_address, fingerprint, user_agent, action, metadata)
  VALUES (p_user_id, p_ip, p_fingerprint, p_user_agent, 'generate_reply', coalesce(p_metadata, '{}'::jsonb))
  RETURNING id INTO new_id;
  RETURN QUERY SELECT true, new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_reply_usage(uuid, text, text, text, jsonb, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_reply_usage(uuid, text, text, text, jsonb, integer) TO service_role;
