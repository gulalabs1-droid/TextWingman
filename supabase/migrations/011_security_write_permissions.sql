-- Apply only after the application writes usage and waitlist events server-side.
DROP POLICY IF EXISTS "Anon can insert anonymous usage logs" ON public.usage_logs;
DROP POLICY IF EXISTS "auth usage insert" ON public.usage_logs;
REVOKE INSERT ON public.usage_logs FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "anyone can join waitlist" ON public.v2_waitlist;
REVOKE INSERT ON public.v2_waitlist FROM PUBLIC, anon, authenticated;
