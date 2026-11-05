-- The signup trigger stores pending invites here; preserve existing profiles.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pending_invite_code TEXT;
