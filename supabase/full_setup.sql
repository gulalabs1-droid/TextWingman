-- ============================================================================
-- TEXT WINGMAN — FULL DATABASE SETUP
-- Paste this into Supabase Dashboard → SQL Editor → Run
-- Idempotent: safe to re-run.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- profiles  (1:1 with auth.users; auto-created via trigger)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  plan TEXT DEFAULT 'free',
  beta_group TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  pending_invite_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, pending_invite_code)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'pending_invite_code'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────
-- entitlements  (admin-granted Pro access, separate from Stripe subs)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'pro',
  -- Legacy alias retained for older installs; runtime reads tier.
  plan TEXT NOT NULL DEFAULT 'pro',
  source TEXT,
  granted_by TEXT,
  notes TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_entitlements_user_id ON public.entitlements(user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- subscriptions  (Stripe-synced)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT UNIQUE,
  subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  price_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  plan_type TEXT,
  is_beta_tester BOOLEAN DEFAULT FALSE,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- ─────────────────────────────────────────────────────────────────────────
-- usage_logs  (rate-limit + analytics)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  fingerprint TEXT,
  action TEXT,
  message TEXT,
  tone TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_ip ON public.usage_logs(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_fingerprint ON public.usage_logs(fingerprint);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON public.usage_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_metadata_visitor_id ON public.usage_logs ((metadata ->> 'visitor_id'));
CREATE INDEX IF NOT EXISTS idx_usage_logs_metadata_session_id ON public.usage_logs ((metadata ->> 'session_id'));
CREATE INDEX IF NOT EXISTS idx_usage_logs_metadata_event ON public.usage_logs ((metadata ->> 'event'), created_at);

-- ─────────────────────────────────────────────────────────────────────────
-- saved_threads  (Coach + Reply sessions)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  context TEXT,
  platform TEXT,
  type TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saved_threads_user_id ON public.saved_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_threads_updated_at ON public.saved_threads(updated_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- reply_history  (Pro: every generated reply)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reply_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  their_message TEXT,
  generated_replies JSONB,
  context TEXT,
  tone TEXT,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reply_history_user_id ON public.reply_history(user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- suggestions  (user-submitted feedback)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  suggestion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON public.suggestions(user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- copy_logs  (which tones/replies users actually copy)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.copy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tone TEXT,
  reply_text TEXT,
  context TEXT,
  is_v2 BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_copy_logs_user_id ON public.copy_logs(user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- strategy_logs  (V2 strategy outputs)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.strategy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  thread_preview TEXT,
  momentum TEXT,
  balance TEXT,
  energy TEXT,
  one_liner TEXT,
  risk TEXT,
  constraints JSONB,
  latency_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_strategy_logs_user_id ON public.strategy_logs(user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- v2_runs  (V2 pipeline analytics)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.v2_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  context TEXT,
  message_preview TEXT,
  scenario TEXT,
  tone TEXT,
  candidate_count INT,
  winner_score INT,
  duration_ms INT,
  rule_pass_rate INT,
  tone_pass_rate INT,
  avg_confidence INT,
  latency_ms INT,
  revise_attempts INT,
  all_passed BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_v2_runs_user_id ON public.v2_runs(user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- v2_waitlist  (early access signups)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.v2_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  referral_source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────
-- feature_flags  (admin-toggled)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  rollout_percentage INT DEFAULT 0,
  enabled BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────
-- admin_events  (audit log)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_events_created_at ON public.admin_events(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- Growth Command Center (creative metrics + social lead queue)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketing_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL UNIQUE,
  title TEXT,
  hook TEXT,
  avatar TEXT,
  cta TEXT,
  format TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_marketing_creatives_status ON public.marketing_creatives(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.social_creative_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
  profile_visits INTEGER NOT NULL DEFAULT 0 CHECK (profile_visits >= 0),
  bio_clicks INTEGER NOT NULL DEFAULT 0 CHECK (bio_clicks >= 0),
  likes INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0),
  comments INTEGER NOT NULL DEFAULT 0 CHECK (comments >= 0),
  shares INTEGER NOT NULL DEFAULT 0 CHECK (shares >= 0),
  saves INTEGER NOT NULL DEFAULT 0 CHECK (saves >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(video_id, platform, metric_date)
);
CREATE INDEX IF NOT EXISTS idx_social_creative_metrics_date ON public.social_creative_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_social_creative_metrics_video ON public.social_creative_metrics(video_id, platform, metric_date DESC);

CREATE TABLE IF NOT EXISTS public.marketing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_key TEXT,
  platform TEXT NOT NULL,
  handle TEXT,
  source_video_id TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'replied', 'clicked', 'tried', 'signed_up', 'paid', 'closed')),
  comment_text TEXT,
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_status ON public.marketing_leads(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_video ON public.marketing_leads(source_video_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_person ON public.marketing_leads(person_key);

-- Runtime compatibility for databases created before the current app schema.
-- These are additive and safe to re-run.
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

-- ============================================================================
-- ROW LEVEL SECURITY  (enabled on all user-data tables; service_role bypasses)
-- ============================================================================
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_threads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reply_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v2_runs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v2_waitlist      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_creative_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
DROP POLICY IF EXISTS "own profile read"   ON public.profiles;
DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile read"   ON public.profiles FOR SELECT TO authenticated USING ((select auth.uid()) = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = id);

-- Users can read their own subscription / entitlement
DROP POLICY IF EXISTS "own entitlement"  ON public.entitlements;
DROP POLICY IF EXISTS "own subscription" ON public.subscriptions;
CREATE POLICY "own entitlement"  ON public.entitlements  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "own subscription" ON public.subscriptions FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

-- Users can manage their own threads, history, copies
DROP POLICY IF EXISTS "own threads"     ON public.saved_threads;
DROP POLICY IF EXISTS "own replies"     ON public.reply_history;
DROP POLICY IF EXISTS "own copies"      ON public.copy_logs;
DROP POLICY IF EXISTS "own suggestions" ON public.suggestions;
CREATE POLICY "own threads"     ON public.saved_threads FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "own replies"     ON public.reply_history FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "own copies"      ON public.copy_logs     FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "own suggestions" ON public.suggestions   FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

-- Anonymous can insert usage_logs (for rate-limiting non-logged-in users) but only with null user_id
DROP POLICY IF EXISTS "anon usage insert" ON public.usage_logs;
DROP POLICY IF EXISTS "auth usage insert" ON public.usage_logs;
CREATE POLICY "anon usage insert" ON public.usage_logs FOR INSERT TO anon          WITH CHECK (user_id IS NULL);
CREATE POLICY "auth usage insert" ON public.usage_logs FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()) OR user_id IS NULL);

-- Public waitlist signup
DROP POLICY IF EXISTS "anyone can join waitlist" ON public.v2_waitlist;
CREATE POLICY "anyone can join waitlist" ON public.v2_waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);

-- service_role bypasses RLS automatically; no policies needed for it.

-- ============================================================================
-- DONE.  Verify with:  SELECT tablename FROM pg_tables WHERE schemaname='public';
-- ============================================================================
