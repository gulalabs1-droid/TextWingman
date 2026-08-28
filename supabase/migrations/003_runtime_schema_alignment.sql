-- Align existing databases with the fields used by the current runtime.
-- Safe to run more than once.

ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS plan TEXT;
UPDATE public.entitlements SET tier = COALESCE(tier, plan, 'pro') WHERE tier IS NULL;
ALTER TABLE public.entitlements ALTER COLUMN tier SET DEFAULT 'pro';

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS price_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN DEFAULT FALSE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS subscription_id TEXT;
UPDATE public.subscriptions
SET stripe_customer_id = COALESCE(stripe_customer_id, customer_id),
    stripe_subscription_id = COALESCE(stripe_subscription_id, subscription_id)
WHERE stripe_customer_id IS NULL OR stripe_subscription_id IS NULL;

ALTER TABLE public.usage_logs ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.copy_logs ADD COLUMN IF NOT EXISTS is_v2 BOOLEAN DEFAULT FALSE;
ALTER TABLE public.strategy_logs ADD COLUMN IF NOT EXISTS one_liner TEXT;
ALTER TABLE public.strategy_logs ADD COLUMN IF NOT EXISTS risk TEXT;
ALTER TABLE public.strategy_logs ADD COLUMN IF NOT EXISTS constraints JSONB;
ALTER TABLE public.strategy_logs ADD COLUMN IF NOT EXISTS latency_ms INT;

ALTER TABLE public.v2_runs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.v2_runs ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE public.v2_runs ADD COLUMN IF NOT EXISTS message_preview TEXT;
ALTER TABLE public.v2_runs ADD COLUMN IF NOT EXISTS rule_pass_rate INT;
ALTER TABLE public.v2_runs ADD COLUMN IF NOT EXISTS tone_pass_rate INT;
ALTER TABLE public.v2_runs ADD COLUMN IF NOT EXISTS avg_confidence INT;
ALTER TABLE public.v2_runs ADD COLUMN IF NOT EXISTS latency_ms INT;
ALTER TABLE public.v2_runs ADD COLUMN IF NOT EXISTS revise_attempts INT;
ALTER TABLE public.v2_runs ADD COLUMN IF NOT EXISTS all_passed BOOLEAN DEFAULT FALSE;

ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Older builds called these audit columns event_type/payload. Keep both names
-- during migration and backfill the canonical fields for the current UI.
ALTER TABLE public.admin_events ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE public.admin_events ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.admin_events ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE public.admin_events ADD COLUMN IF NOT EXISTS payload JSONB;
UPDATE public.admin_events
SET action = COALESCE(action, event_type, 'admin_event'),
    metadata = COALESCE(metadata, payload, '{}'::jsonb)
WHERE action IS NULL OR metadata IS NULL;
