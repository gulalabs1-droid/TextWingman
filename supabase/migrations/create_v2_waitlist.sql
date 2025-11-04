-- Create v2_waitlist table
CREATE TABLE IF NOT EXISTS public.v2_waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  referral_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMP WITH TIME ZONE
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_v2_waitlist_email ON public.v2_waitlist(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_v2_waitlist_created_at ON public.v2_waitlist(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.v2_waitlist ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from anyone (for the waitlist form)
CREATE POLICY "Anyone can join waitlist"
  ON public.v2_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create policy to allow service role to read all
CREATE POLICY "Service role can read all waitlist entries"
  ON public.v2_waitlist
  FOR SELECT
  TO service_role
  USING (true);

-- Create policy to allow service role to update
CREATE POLICY "Service role can update waitlist entries"
  ON public.v2_waitlist
  FOR UPDATE
  TO service_role
  USING (true);

-- Add comment
COMMENT ON TABLE public.v2_waitlist IS 'V2 waitlist signups for Dual-Check AI launch';
