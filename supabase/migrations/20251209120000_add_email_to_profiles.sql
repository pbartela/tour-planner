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
DELETE FROM public.profiles
WHERE email IS NULL;

-- Make email NOT NULL after backfill and cleanup
ALTER TABLE public.profiles
ALTER COLUMN email SET NOT NULL;

-- Create trigger function to sync email changes from auth.users to profiles
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile email when auth.users email changes
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users for email updates
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_user_email();

-- Update existing profile creation trigger to include email
-- (Replace the existing handle_new_user function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN public.profiles.email IS 'User email synced from auth.users. Used as fallback display when display_name is null. Eliminates N+1 queries by denormalizing email into profiles table.';
