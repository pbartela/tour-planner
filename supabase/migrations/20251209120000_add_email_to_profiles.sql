-- Migration: Add email to profiles table
-- Purpose: Eliminate N+1 query problem when fetching user emails
-- This denormalizes email from auth.users into profiles for better performance

-- Add email column to profiles table
ALTER TABLE public.profiles
ADD COLUMN email TEXT;

-- Create unique index for email lookup performance
CREATE UNIQUE INDEX idx_profiles_email ON public.profiles(email);

-- Backfill existing emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- Delete any orphaned profiles that don't have corresponding auth.users entries
-- (This handles edge cases where profiles exist without auth users)
-- Log orphaned profiles atomically during deletion to prevent race conditions
DO $$
DECLARE
  orphaned_count INTEGER;
  orphaned_ids TEXT;
BEGIN
  -- Atomically delete orphaned profiles and capture their IDs
  -- This prevents race conditions between checking and deleting
  WITH deleted AS (
    DELETE FROM public.profiles
    WHERE email IS NULL
    RETURNING id
  )
  SELECT COUNT(*), STRING_AGG(id::TEXT, ', ')
  INTO orphaned_count, orphaned_ids
  FROM deleted;

  -- Log results
  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Orphaned profiles cleanup: Deleted % orphaned profile(s)', orphaned_count;
    RAISE NOTICE 'Orphaned profile IDs: %', orphaned_ids;
  ELSE
    RAISE NOTICE 'No orphaned profiles found - all profiles have corresponding auth.users entries';
  END IF;
END $$;

-- Make email NOT NULL after backfill and cleanup
ALTER TABLE public.profiles
ALTER COLUMN email SET NOT NULL;

-- Create trigger function to sync email changes from auth.users to profiles
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Defensive validation
  IF NEW.id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  IF NEW.email IS NULL OR NEW.email = '' THEN
    RAISE EXCEPTION 'Email cannot be null or empty';
  END IF;

  -- Update profile email when auth.users email changes
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_user_email IS
  'Syncs email from auth.users to profiles.email when user email changes.

   SECURITY MODEL:
   - Uses SECURITY DEFINER because trigger executes in system context (no auth.uid())
   - Input (NEW) comes from Supabase Auth, not user-supplied data
   - UPDATE constrained by WHERE id = NEW.id (prevents cross-user updates)
   - SET search_path prevents schema injection attacks

   This function has elevated privileges but is only callable by Supabase Auth triggers.';

-- Create trigger on auth.users for email updates
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_user_email();

-- Update existing profile creation trigger to include email
-- (Replace the existing handle_new_user function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Defensive validation
  IF NEW.id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  IF NEW.email IS NULL OR NEW.email = '' THEN
    RAISE EXCEPTION 'Email cannot be null or empty';
  END IF;

  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS
  'Creates a profile record when a new user signs up via Supabase Auth.

   SECURITY MODEL:
   - Uses SECURITY DEFINER because trigger executes in system context (no auth.uid())
   - Input (NEW) comes from Supabase Auth during user creation, not user-supplied
   - Validates NEW.id and NEW.email before insertion
   - SET search_path prevents schema injection attacks

   This function has elevated privileges but is only callable by Supabase Auth triggers.';

COMMENT ON COLUMN public.profiles.email IS 'User email synced from auth.users. Used as fallback display when display_name is null. Eliminates N+1 queries by denormalizing email into profiles table.';
