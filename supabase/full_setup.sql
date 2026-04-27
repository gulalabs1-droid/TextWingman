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
  status TEXT NOT NULL DEFAULT 'active',
  plan_type TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_ip ON public.usage_logs(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_fingerprint ON public.usage_logs(fingerprint);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON public.usage_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_strategy_logs_user_id ON public.strategy_logs(user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- v2_runs  (V2 pipeline analytics)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.v2_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scenario TEXT,
  tone TEXT,
  candidate_count INT,
  winner_score INT,
  duration_ms INT,
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
