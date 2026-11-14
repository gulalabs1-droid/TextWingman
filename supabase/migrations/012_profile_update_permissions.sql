-- Customers may update only their own editable profile fields. RLS still
-- decides which row they can update; privileged fields remain server-owned.
REVOKE UPDATE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

-- Remove any pre-existing column-specific grants as well as table grants.
DO $$
DECLARE
  profile_columns text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
  INTO profile_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles';

  IF profile_columns IS NULL THEN
    RAISE EXCEPTION 'public.profiles is missing';
  END IF;

  EXECUTE format(
    'REVOKE UPDATE (%s) ON TABLE public.profiles FROM PUBLIC, anon, authenticated',
    profile_columns
  );
END;
$$;

GRANT UPDATE (full_name, avatar_url, onboarding_completed, updated_at)
  ON TABLE public.profiles TO authenticated;
