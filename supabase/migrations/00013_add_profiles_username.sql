-- Migration: 00013_add_profiles_username.sql
-- Purpose: Ensure `profiles.username` exists to avoid missing-column errors
-- Usage: Run this SQL in your Supabase SQL editor or via psql against the database.

BEGIN;

-- 1) Add the column if it doesn't exist (nullable)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text;

-- 2) Backfill `username` for rows where it's empty using available name fields.
--    This PL/pgSQL block checks which source columns actually exist and builds
--    a safe dynamic UPDATE statement so the migration won't fail if some
--    expected columns are missing in older/newer schemas.
DO $$
DECLARE
  candidate_cols text[] := ARRAY['username','full_name','business_name','store_name'];
  present_cols text[] := ARRAY[]::text[];
  c text;
  coalesce_expr text;
BEGIN
  FOR i IN array_lower(candidate_cols,1)..array_upper(candidate_cols,1) LOOP
    c := candidate_cols[i];
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = c
    ) THEN
      present_cols := array_append(present_cols, format('COALESCE(%I, '''')', c));
    END IF;
  END LOOP;

  IF array_length(present_cols,1) IS NULL THEN
    RAISE NOTICE 'No source columns found for username backfill; skipping update.';
    RETURN;
  END IF;

  coalesce_expr := array_to_string(present_cols, ', ');

  EXECUTE format(
    'UPDATE public.profiles SET username = NULLIF(substring(lower(regexp_replace(coalesce(%s), ''[^a-z0-9]+'','''',''g'')) FROM 1 FOR 50), '''') WHERE username IS NULL OR username = ''''' ,
    coalesce_expr
  );
END$$;

-- 3) Create an index to speed lookups on username (non-unique, nullable)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);

COMMIT;

-- Notes:
-- - This migration is safe to run multiple times (`IF NOT EXISTS`).
-- - It avoids making `username` UNIQUE because existing values may collide; if you want uniqueness
--   enforce it later after manual review, create a UNIQUE index or ALTER COLUMN accordingly.
-- - If you prefer a different sanitization strategy (keep dots/underscores, transliteration, etc.),
--   adjust the regexp_replace expression before running.
