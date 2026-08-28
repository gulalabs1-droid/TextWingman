-- Growth Command Center tables.
-- Additive and safe to run more than once. The admin API uses service_role.

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

CREATE INDEX IF NOT EXISTS idx_marketing_creatives_status
  ON public.marketing_creatives(status, updated_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_social_creative_metrics_date
  ON public.social_creative_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_social_creative_metrics_video
  ON public.social_creative_metrics(video_id, platform, metric_date DESC);

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

CREATE INDEX IF NOT EXISTS idx_marketing_leads_status
  ON public.marketing_leads(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_video
  ON public.marketing_leads(source_video_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_person
  ON public.marketing_leads(person_key);

ALTER TABLE public.marketing_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_creative_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.marketing_creatives IS 'Canonical metadata for each short-form creative and its hook/avatar/CTA variant.';
COMMENT ON TABLE public.social_creative_metrics IS 'Dated, manually imported native platform metrics. Site outcomes are calculated from first-party events.';
COMMENT ON TABLE public.marketing_leads IS 'Manual social comment/DM lead queue; platform APIs are not assumed.';
