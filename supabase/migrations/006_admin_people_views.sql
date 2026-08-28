-- Admin "People" views: surface anonymous visitors alongside registered users.
-- Additive and safe to run more than once.
--
-- Anonymous identity = fingerprint + ip. This is an approximation: `fingerprint`
-- is only a hash of user-agent + accept-language, so two people on the same
-- device model and network can merge into one row, and one person switching
-- networks can split into two. Counts are close, not exact.

CREATE OR REPLACE VIEW public.admin_people AS
WITH e AS (
  SELECT
    l.*,
    CASE
      WHEN l.user_id IS NOT NULL THEN 'user:' || l.user_id::text
      ELSE 'anon:' || COALESCE(l.fingerprint, 'nofp') || ':' || COALESCE(l.ip_address, 'noip')
    END AS person_key
  FROM public.usage_logs l
)
SELECT
  person_key,
  bool_or(user_id IS NOT NULL) AS is_registered,
  (array_agg(user_id) FILTER (WHERE user_id IS NOT NULL))[1] AS user_id,
  min(created_at) AS first_seen,
  max(created_at) AS last_seen,
  count(*) AS events,
  count(*) FILTER (WHERE action = 'page_view') AS page_views,
  count(*) FILTER (WHERE action <> 'page_view') AS product_actions,
  count(*) FILTER (WHERE action = 'generate_reply') AS replies,
  count(DISTINCT ip_address) AS ips,
  -- first-touch attribution
  (array_agg(metadata->>'page' ORDER BY created_at) FILTER (WHERE metadata->>'page' IS NOT NULL))[1] AS landing_page,
  (array_agg(metadata->>'referrer' ORDER BY created_at) FILTER (WHERE metadata->>'referrer' IS NOT NULL))[1] AS first_referrer,
  (array_agg(metadata->'utm'->>'utm_source' ORDER BY created_at) FILTER (WHERE metadata->'utm'->>'utm_source' IS NOT NULL))[1] AS utm_source,
  (array_agg(metadata->'utm'->>'utm_medium' ORDER BY created_at) FILTER (WHERE metadata->'utm'->>'utm_medium' IS NOT NULL))[1] AS utm_medium,
  (array_agg(metadata->'utm'->>'utm_campaign' ORDER BY created_at) FILTER (WHERE metadata->'utm'->>'utm_campaign' IS NOT NULL))[1] AS utm_campaign,
  (array_agg(metadata->'utm'->>'src' ORDER BY created_at) FILTER (WHERE metadata->'utm'->>'src' IS NOT NULL))[1] AS utm_platform,
  (array_agg(metadata->'utm'->>'video_id' ORDER BY created_at) FILTER (WHERE metadata->'utm'->>'video_id' IS NOT NULL))[1] AS video_id,
  -- latest known device / geo
  (array_agg(metadata->>'device' ORDER BY created_at DESC) FILTER (WHERE metadata->>'device' IS NOT NULL))[1] AS device,
  (array_agg(metadata->>'os' ORDER BY created_at DESC) FILTER (WHERE metadata->>'os' IS NOT NULL))[1] AS os,
  (array_agg(metadata->>'browser' ORDER BY created_at DESC) FILTER (WHERE metadata->>'browser' IS NOT NULL))[1] AS browser,
  (array_agg(metadata->>'country' ORDER BY created_at DESC) FILTER (WHERE metadata->>'country' IS NOT NULL))[1] AS country,
  (array_agg(metadata->>'city' ORDER BY created_at DESC) FILTER (WHERE metadata->>'city' IS NOT NULL))[1] AS city,
  (array_agg(metadata->>'region' ORDER BY created_at DESC) FILTER (WHERE metadata->>'region' IS NOT NULL))[1] AS region,
  (array_agg(ip_address ORDER BY created_at DESC) FILTER (WHERE ip_address IS NOT NULL))[1] AS last_ip,
  (array_agg(user_agent ORDER BY created_at DESC) FILTER (WHERE user_agent IS NOT NULL))[1] AS user_agent
FROM e
GROUP BY person_key;

-- Weekly "new person" summary, driven off first_seen.
CREATE OR REPLACE VIEW public.admin_people_weekly AS
SELECT
  (date_trunc('week', first_seen))::date AS week_start,
  count(*) AS new_people,
  count(*) FILTER (WHERE is_registered) AS new_registered,
  count(*) FILTER (WHERE NOT is_registered) AS new_anonymous,
  count(*) FILTER (WHERE replies > 0) AS activated,
  count(*) FILTER (WHERE product_actions > 0) AS took_action,
  count(DISTINCT country) AS countries,
  sum(replies) AS total_replies,
  sum(page_views) AS total_page_views
FROM public.admin_people
GROUP BY 1
ORDER BY 1 DESC;

-- These views expose IP, geo and fingerprint data. Postgres views default to
-- the creator's privileges (SECURITY DEFINER), which would let any authenticated
-- caller read them and bypass RLS on usage_logs. security_invoker enforces the
-- querying role's permissions instead. The admin API uses service_role.
ALTER VIEW public.admin_people SET (security_invoker = true);
ALTER VIEW public.admin_people_weekly SET (security_invoker = true);

REVOKE ALL ON public.admin_people FROM anon, authenticated;
REVOKE ALL ON public.admin_people_weekly FROM anon, authenticated;
