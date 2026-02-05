-- V2 Runs Analytics Table
-- Tracks V2 pipeline performance and usage

CREATE TABLE IF NOT EXISTS v2_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address VARCHAR(255),
  user_id UUID REFERENCES auth.users(id),
  context VARCHAR(50),
  message_preview TEXT,
  rule_pass_rate INTEGER,
  tone_pass_rate INTEGER,
  avg_confidence INTEGER,
  latency_ms INTEGER,
  revise_attempts INTEGER DEFAULT 0,
  all_passed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_v2_runs_created_at ON v2_runs(created_at);
CREATE INDEX IF NOT EXISTS idx_v2_runs_context ON v2_runs(context);
CREATE INDEX IF NOT EXISTS idx_v2_runs_all_passed ON v2_runs(all_passed);

-- Enable RLS
ALTER TABLE v2_runs ENABLE ROW LEVEL SECURITY;

-- Policy for service role
CREATE POLICY "Allow service role full access to v2_runs"
  ON v2_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
