-- Reply history table for Pro users
CREATE TABLE IF NOT EXISTS reply_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  their_message TEXT NOT NULL,
  generated_replies JSONB NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_reply_history_user_created 
ON reply_history (user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE reply_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own history
CREATE POLICY "Users can view own history" ON reply_history
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own history
CREATE POLICY "Users can insert own history" ON reply_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own history
CREATE POLICY "Users can delete own history" ON reply_history
  FOR DELETE USING (auth.uid() = user_id);
