-- ============================================================================
-- COMPLETE DATABASE SCHEMA (Clean Slate Migration)
-- ============================================================================
-- This migration represents the complete database schema for the tour planner application.
-- It includes:
--   - All tables with final schema (including profiles.email column)
--   - All custom types, functions, triggers, and RLS policies
--   - Storage bucket configuration
--   - Cron job scheduling for automated cleanup
--
-- IMPORTANT: This migration is idempotent and can be run on a fresh database.
-- ============================================================================

BEGIN;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

CREATE TYPE public.tour_status AS ENUM ('active', 'archived');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'declined');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles table (with email column for performance)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    language TEXT NOT NULL DEFAULT 'en-US',
    theme TEXT NOT NULL DEFAULT 'system',
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Stores user profile information, extending the auth.users table.';
COMMENT ON COLUMN public.profiles.email IS 'User email synced from auth.users. Used as fallback display when display_name is null. Eliminates N+1 queries by denormalizing email into profiles table.';
COMMENT ON COLUMN public.profiles.language IS 'User preferred language in full locale format (e.g., en-US, pl-PL). Must match locale codes used in URLs and i18n configuration.';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to the user''s avatar image stored in Supabase Storage';

-- Tours table
CREATE TABLE public.tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL CHECK (length(title) > 0),
    destination TEXT NOT NULL CHECK (length(destination) > 0),
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    participant_limit INTEGER CHECK (participant_limit > 0),
    like_threshold INTEGER CHECK (like_threshold > 0),
    are_votes_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    voting_locked BOOLEAN NOT NULL DEFAULT FALSE,
    status public.tour_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.tours IS 'Contains all information about a tour.';
COMMENT ON COLUMN public.tours.voting_locked IS 'When true, participants cannot vote or change their votes. Only owner can modify.';

-- Participants table
CREATE TABLE public.participants (
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tour_id, user_id)
);

COMMENT ON TABLE public.participants IS 'Joining table for the many-to-many relationship between profiles and tours.';

-- Comments table
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET DEFAULT DEFAULT '00000000-0000-0000-0000-000000000000',
    content TEXT NOT NULL CHECK (length(content) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.comments IS 'Stores comments made by users on tours.';

-- Votes table
CREATE TABLE public.votes (
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tour_id, user_id)
);

COMMENT ON TABLE public.votes IS 'Stores "likes" from users for a specific tour.';

-- Invitations table
CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT UNIQUE,
    status public.invitation_status NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.invitations IS 'Tracks invitations sent to users to join a tour.';
COMMENT ON COLUMN public.invitations.token IS 'Unique token used in invitation link. Automatically generated as 32-character hex string.';
COMMENT ON COLUMN public.invitations.expires_at IS 'Expiration date of the invitation. Defaults to 7 days from creation.';

-- Tags table
CREATE TABLE public.tags (
    id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    name TEXT NOT NULL UNIQUE CHECK (length(name) > 0)
);

COMMENT ON TABLE public.tags IS 'Stores unique tags for categorizing archived tours.';

-- Tour tags table
CREATE TABLE public.tour_tags (
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (tour_id, tag_id)
);

COMMENT ON TABLE public.tour_tags IS 'Joining table for the many-to-many relationship between tours and tags.';

-- Tour activity table
CREATE TABLE public.tour_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tour_activity_unique_user_tour UNIQUE(tour_id, user_id)
);

COMMENT ON TABLE public.tour_activity IS 'Tracks when users last viewed each tour to determine if there is new activity (comments, votes, or tour updates)';
COMMENT ON COLUMN public.tour_activity.last_viewed_at IS 'Timestamp when user last opened tour details page';

-- Invitation OTP table
CREATE TABLE public.invitation_otp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp_token TEXT NOT NULL UNIQUE,
    invitation_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.invitation_otp IS 'Stores one-time tokens used for invitation-based authentication flow.';

-- Auth OTP table
CREATE TABLE public.auth_otp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp_token TEXT NOT NULL UNIQUE,
    redirect_to TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.auth_otp IS 'Stores one-time tokens used for standard authentication (login/registration).';
COMMENT ON COLUMN public.auth_otp.redirect_to IS 'Optional redirect URL after authentication';

-- Cron job logs table
CREATE TABLE public.cron_job_logs (
    id BIGSERIAL PRIMARY KEY,
    job_name TEXT NOT NULL,
    execution_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    tours_archived INTEGER,
    invitations_expired INTEGER,
    profiles_deleted INTEGER
);

COMMENT ON TABLE public.cron_job_logs IS 'Tracks execution history of automated cron jobs including cleanup and archival operations.';
COMMENT ON COLUMN public.cron_job_logs.job_name IS 'Name of the cron job (e.g., archive_finished_tours, cleanup_expired_invitations, cleanup_orphaned_profiles).';
COMMENT ON COLUMN public.cron_job_logs.execution_time IS 'Timestamp when the job was executed.';
COMMENT ON COLUMN public.cron_job_logs.success IS 'Whether the job completed successfully or encountered an error.';
COMMENT ON COLUMN public.cron_job_logs.error_message IS 'Error message if the job failed (NULL on success).';
COMMENT ON COLUMN public.cron_job_logs.tours_archived IS 'Number of tours archived by archive_finished_tours job.';
COMMENT ON COLUMN public.cron_job_logs.invitations_expired IS 'Number of invitations expired by cleanup_expired_invitations job.';
COMMENT ON COLUMN public.cron_job_logs.profiles_deleted IS 'Number of orphaned profiles deleted by cleanup_orphaned_profiles job.';

-- ============================================================================
-- ANONYMIZED USER RECORD
-- ============================================================================

INSERT INTO public.profiles (id, email, display_name)
VALUES ('00000000-0000-0000-0000-000000000000', 'anonymized@example.com', 'Anonymized User')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles indexes
CREATE UNIQUE INDEX idx_profiles_email ON public.profiles(email);

-- Participants indexes
CREATE INDEX ON public.participants (user_id);

-- Comments indexes
CREATE INDEX ON public.comments (tour_id, created_at DESC);

-- Tour tags indexes
CREATE INDEX ON public.tour_tags (tag_id);

-- Invitations indexes
CREATE INDEX ON public.invitations (tour_id, email);
CREATE INDEX idx_invitations_token ON public.invitations (token) WHERE token IS NOT NULL AND status = 'pending';
CREATE INDEX idx_invitations_expires_at ON public.invitations (expires_at) WHERE status = 'pending';

-- Tours indexes
CREATE INDEX idx_tours_status ON public.tours (status);
CREATE INDEX idx_tours_owner_id ON public.tours (owner_id);

-- Tour activity indexes
CREATE INDEX idx_tour_activity_tour_id ON public.tour_activity(tour_id);
CREATE INDEX idx_tour_activity_user_id ON public.tour_activity(user_id);

-- OTP indexes
CREATE INDEX idx_invitation_otp_token ON public.invitation_otp(otp_token);
CREATE INDEX idx_invitation_otp_expires_at ON public.invitation_otp(expires_at);
CREATE INDEX idx_auth_otp_token ON public.auth_otp(otp_token);
CREATE INDEX idx_auth_otp_expires_at ON public.auth_otp(expires_at);

-- Cron job logs indexes
CREATE INDEX idx_cron_job_logs_job_name ON public.cron_job_logs(job_name);
CREATE INDEX idx_cron_job_logs_execution_time ON public.cron_job_logs(execution_time DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Create profile for new user (includes email sync)
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

-- Function: Sync email from auth.users to profiles
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

-- Function: Handle user deletion
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  new_owner_id UUID;
BEGIN
  -- Transfer ownership of tours or delete them
  FOR rec IN SELECT id FROM tours WHERE owner_id = OLD.id LOOP
    new_owner_id := (
      SELECT user_id FROM participants
      WHERE tour_id = rec.id AND user_id != OLD.id
      ORDER BY joined_at ASC
      LIMIT 1
    );
    IF new_owner_id IS NOT NULL THEN
      UPDATE tours SET owner_id = new_owner_id WHERE id = rec.id;
    ELSE
      DELETE FROM tours WHERE id = rec.id;
    END IF;
  END LOOP;

  -- Delete the user's profile
  DELETE FROM public.profiles WHERE id = OLD.id;

  RETURN OLD;
END;
$$;

-- Function: Check if user is a participant
CREATE OR REPLACE FUNCTION public.is_participant(tour_id_to_check UUID, user_id_to_check UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.participants
    WHERE tour_id = tour_id_to_check AND user_id = user_id_to_check
  );
END;
$$;

-- Function: Clean up unconfirmed users
CREATE OR REPLACE FUNCTION public.cleanup_unconfirmed_users()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM auth.users
  WHERE confirmed_at IS NULL
    AND created_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count > 0 THEN
    RAISE NOTICE 'Cleaned up % unconfirmed user(s)', deleted_count;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_unconfirmed_users() TO postgres;
COMMENT ON FUNCTION public.cleanup_unconfirmed_users() IS 'Deletes unconfirmed users older than 24 hours to prevent database bloat from abandoned signups';

-- Function: Create tour (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_tour(
  p_title TEXT,
  p_destination TEXT,
  p_description TEXT,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_participant_limit INTEGER DEFAULT NULL,
  p_like_threshold INTEGER DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    owner_id UUID,
    title TEXT,
    destination TEXT,
    description TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    participant_limit INTEGER,
    like_threshold INTEGER,
    are_votes_hidden BOOLEAN,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_tour_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create a tour';
  END IF;

  INSERT INTO public.tours (
    owner_id,
    title,
    destination,
    description,
    start_date,
    end_date,
    participant_limit,
    like_threshold
  ) VALUES (
    v_user_id,
    p_title,
    p_destination,
    p_description,
    p_start_date,
    p_end_date,
    p_participant_limit,
    p_like_threshold
  )
  RETURNING tours.id INTO v_tour_id;

  INSERT INTO public.participants (tour_id, user_id)
  VALUES (v_tour_id, v_user_id);

  RETURN QUERY
  SELECT
    t.id,
    t.owner_id,
    t.title,
    t.destination,
    t.description,
    t.start_date,
    t.end_date,
    t.participant_limit,
    t.like_threshold,
    t.are_votes_hidden,
    t.status::TEXT,
    t.created_at
  FROM public.tours t
  WHERE t.id = v_tour_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_tour TO authenticated;
COMMENT ON FUNCTION public.create_tour IS 'Creates a new tour and adds the creator as a participant. Uses SECURITY DEFINER to bypass RLS evaluation issues with server-side clients.';

-- Function: Generate invitation token
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  token_value TEXT;
  max_attempts INT := 100;
  attempts INT := 0;
BEGIN
  IF NEW.token IS NOT NULL THEN
    RETURN NEW;
  END IF;

  LOOP
    token_value := encode(gen_random_bytes(16), 'hex');
    attempts := attempts + 1;

    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.invitations WHERE token = token_value);

    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique invitation token after % attempts', max_attempts;
    END IF;
  END LOOP;

  NEW.token := token_value;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.generate_invitation_token() IS 'Generates a unique 32-character hexadecimal token for invitation links. Uses 100 max attempts for high-volume scenarios. Used by trigger before INSERT.';

-- Function: Accept invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(
  invitation_token TEXT,
  accepting_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation_id UUID;
  v_tour_id UUID;
  v_invitee_email TEXT;
  v_user_email TEXT;
BEGIN
  SELECT id, tour_id, email
  INTO v_invitation_id, v_tour_id, v_invitee_email
  FROM public.invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF v_invitation_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = accepting_user_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_invitee_email != v_user_email THEN
    RAISE EXCEPTION 'Invitation email does not match user email';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.participants
    WHERE tour_id = v_tour_id AND user_id = accepting_user_id
  ) THEN
    RAISE EXCEPTION 'User is already a participant';
  END IF;

  INSERT INTO public.participants (tour_id, user_id)
  VALUES (v_tour_id, accepting_user_id)
  ON CONFLICT DO NOTHING;

  UPDATE public.invitations
  SET status = 'accepted'
  WHERE id = v_invitation_id;

  RETURN v_tour_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT, UUID) TO authenticated;
COMMENT ON FUNCTION public.accept_invitation(TEXT, UUID) IS 'Accepts an invitation by token and adds the user as a participant. Verifies email match and prevents duplicate participants. Returns tour_id on success.';

-- Function: Decline invitation
CREATE OR REPLACE FUNCTION public.decline_invitation(
  invitation_token TEXT,
  declining_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation_id UUID;
  v_tour_id UUID;
  v_invitee_email TEXT;
  v_user_email TEXT;
BEGIN
  SELECT id, tour_id, email
  INTO v_invitation_id, v_tour_id, v_invitee_email
  FROM public.invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF v_invitation_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = declining_user_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_invitee_email != v_user_email THEN
    RAISE EXCEPTION 'Invitation email does not match user email';
  END IF;

  UPDATE public.invitations
  SET status = 'declined'
  WHERE id = v_invitation_id;

  RETURN v_tour_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decline_invitation(TEXT, UUID) TO authenticated;
COMMENT ON FUNCTION public.decline_invitation(TEXT, UUID) IS 'Declines an invitation by token. Verifies email match and changes status to declined. Returns tour_id on success. Owner can re-invite the user later.';

-- Function: Get user by email
CREATE OR REPLACE FUNCTION public.get_user_by_email(search_email TEXT)
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  raw_user_meta_data JSONB,
  raw_app_meta_data JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    u.updated_at,
    u.raw_user_meta_data,
    u.raw_app_meta_data
  FROM auth.users u
  WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(search_email))
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_by_email(TEXT) TO authenticated, service_role;
COMMENT ON FUNCTION public.get_user_by_email IS 'Securely lookup user by email from auth.users table. Returns user data without exposing service_role key.';

-- Function: Cleanup expired invitation OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_invitation_otps()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.invitation_otp
  WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Function: Cleanup expired auth OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_auth_otps()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.auth_otp
  WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Function: Archive finished tours
CREATE OR REPLACE FUNCTION public.archive_finished_tours()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    archived_count INTEGER := 0;
    error_msg TEXT;
BEGIN
    UPDATE public.tours
    SET status = 'archived'
    WHERE status = 'active'
        AND end_date < NOW();

    GET DIAGNOSTICS archived_count = ROW_COUNT;

    INSERT INTO public.cron_job_logs (job_name, tours_archived, success)
    VALUES ('archive_finished_tours', archived_count, TRUE);

    RETURN archived_count;

EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
    INSERT INTO public.cron_job_logs (job_name, tours_archived, success, error_message)
    VALUES ('archive_finished_tours', 0, FALSE, error_msg);

    RAISE;
END;
$$;

COMMENT ON FUNCTION public.archive_finished_tours IS 'Automatically archives tours that have passed their end_date. Returns count of archived tours.';

-- Function: Cleanup expired invitations
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    expired_count INTEGER := 0;
    error_msg TEXT;
BEGIN
    UPDATE public.invitations
    SET status = 'expired'
    WHERE status = 'pending'
        AND expires_at < NOW();

    GET DIAGNOSTICS expired_count = ROW_COUNT;

    INSERT INTO public.cron_job_logs (job_name, invitations_expired, success)
    VALUES ('cleanup_expired_invitations', expired_count, TRUE);

    RETURN expired_count;

EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
    INSERT INTO public.cron_job_logs (job_name, invitations_expired, success, error_message)
    VALUES ('cleanup_expired_invitations', 0, FALSE, error_msg);

    RAISE;
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_invitations IS
    'Automatically marks pending invitations as expired when their expires_at date has passed. Returns count of expired invitations.';

-- Function: Cleanup orphaned profiles
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_profiles()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER := 0;
    orphaned_ids TEXT;
    error_msg TEXT;
BEGIN
    -- Get list of orphaned profile IDs for logging
    SELECT STRING_AGG(id::TEXT, ', ') INTO orphaned_ids
    FROM public.profiles p
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users u WHERE u.id = p.id
    );

    -- Delete orphaned profiles (those without corresponding auth.users entries)
    DELETE FROM public.profiles p
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users u WHERE u.id = p.id
    );

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Log the cleanup operation
    INSERT INTO public.cron_job_logs (job_name, profiles_deleted, success)
    VALUES ('cleanup_orphaned_profiles', deleted_count, TRUE);

    -- Output for manual execution visibility
    IF deleted_count > 0 THEN
        RAISE NOTICE 'Orphaned profiles cleanup: Deleted % profile(s)', deleted_count;
        RAISE NOTICE 'Deleted profile IDs: %', orphaned_ids;
    ELSE
        RAISE NOTICE 'No orphaned profiles found';
    END IF;

    RETURN deleted_count;

EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
    INSERT INTO public.cron_job_logs (job_name, profiles_deleted, success, error_message)
    VALUES ('cleanup_orphaned_profiles', 0, FALSE, error_msg);

    RAISE;
END;
$$;

COMMENT ON FUNCTION public.cleanup_orphaned_profiles IS
    'Deletes orphaned profiles that exist without corresponding auth.users entries.
    This handles edge cases where profile records persist after user deletion.
    Returns count of deleted profiles and logs results to cron_job_logs.

    WHEN ORPHANED PROFILES OCCUR:
    - Manual database manipulation
    - Failed cascade deletes during user deletion
    - Race conditions during signup (very rare)

    SECURITY MODEL:
    - Uses SECURITY DEFINER for elevated privileges
    - SET search_path prevents schema injection
    - Safe to run periodically as it only deletes invalid data';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Create profile for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger: Sync email changes from auth.users to profiles
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_user_email();

-- Trigger: Handle user deletion
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_deletion();

-- Trigger: Generate invitation token
CREATE TRIGGER invitation_token_generator
  BEFORE INSERT ON public.invitations
  FOR EACH ROW
  WHEN (NEW.token IS NULL)
  EXECUTE FUNCTION public.generate_invitation_token();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_otp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_otp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "users can view profiles in their tours" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id
        OR
        EXISTS (
            SELECT 1
            FROM public.participants p1
            INNER JOIN public.participants p2 ON p1.tour_id = p2.tour_id
            WHERE p1.user_id = auth.uid()
                AND p2.user_id = profiles.id
        )
    );

COMMENT ON POLICY "users can view profiles in their tours" ON public.profiles IS
    'SECURITY MODEL: Profile Visibility in Tours. Allows users to view their own profile and profiles of other participants in tours they are part of. This enables displaying participant avatars and names in tour lists.';

CREATE POLICY "users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Tours policies
CREATE POLICY "users can view tours they are a participant in" ON public.tours
    FOR SELECT USING (EXISTS (SELECT 1 FROM participants WHERE tour_id = tours.id AND user_id = auth.uid()));

CREATE POLICY "authenticated users can create tours" ON public.tours
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "tour owners can update their tours" ON public.tours
    FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "tour owners can delete their tours" ON public.tours
    FOR DELETE USING (owner_id = auth.uid());

-- Participants policies
CREATE POLICY "users can view participants of tours they are in" ON public.participants
    FOR SELECT USING (public.is_participant(tour_id, auth.uid()));

CREATE POLICY "tour owners can add new participants" ON public.participants
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM tours WHERE id = participants.tour_id AND owner_id = auth.uid()));

CREATE POLICY "users can leave tours, and owners can remove participants" ON public.participants
    FOR DELETE USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM tours WHERE id = participants.tour_id AND owner_id = auth.uid()));

-- Comments policies
CREATE POLICY "users can read comments on tours they are a participant in" ON public.comments
    FOR SELECT USING (EXISTS (SELECT 1 FROM participants WHERE tour_id = comments.tour_id AND user_id = auth.uid()));

CREATE POLICY "users can create comments on tours they are a participant in" ON public.comments
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM participants WHERE tour_id = comments.tour_id AND user_id = auth.uid()));

CREATE POLICY "users can only update their own comments" ON public.comments
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users can only delete their own comments" ON public.comments
    FOR DELETE USING (user_id = auth.uid());

-- Votes policies
CREATE POLICY "users can view votes on tours they are a participant in" ON public.votes
    FOR SELECT USING (EXISTS (SELECT 1 FROM participants WHERE tour_id = votes.tour_id AND user_id = auth.uid()));

CREATE POLICY "users can vote on tours they participate in" ON public.votes
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM participants WHERE tour_id = votes.tour_id AND user_id = auth.uid()) AND
        NOT (SELECT are_votes_hidden FROM tours WHERE id = votes.tour_id)
    );

CREATE POLICY "users can remove their own vote" ON public.votes
    FOR DELETE USING (
        user_id = auth.uid() AND
        NOT (SELECT are_votes_hidden FROM tours WHERE id = votes.tour_id)
    );

-- Invitations policies
CREATE POLICY "invited users can view their invitations"
    ON public.invitations
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND email = auth.email()
    );

COMMENT ON POLICY "invited users can view their invitations" ON public.invitations IS
    'SECURITY MODEL: Invited Users Can View Their Invitations. This policy allows authenticated users to view invitations sent to their email address. Users can see their invitations regardless of status (pending, accepted, or declined).';

CREATE POLICY "tour owners can view tour invitations"
    ON public.invitations
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM tours
            WHERE tours.id = invitations.tour_id
                AND tours.owner_id = auth.uid()
        )
    );

COMMENT ON POLICY "tour owners can view tour invitations" ON public.invitations IS
    'SECURITY MODEL: Tour Owners Can View All Tour Invitations. This policy allows tour owners to view all invitations for tours they own, regardless of invitation status or recipient.';

CREATE POLICY "users can update invitations for tours they own"
    ON public.invitations
    FOR UPDATE
    USING (
        EXISTS(
            SELECT 1
            FROM tours
            WHERE id = invitations.tour_id
                AND owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS(
            SELECT 1
            FROM tours
            WHERE id = invitations.tour_id
                AND owner_id = auth.uid()
        )
    );

COMMENT ON POLICY "users can update invitations for tours they own" ON public.invitations IS
    'Allows tour owners to update invitations for their tours. Used for resending declined or expired invitations.';

CREATE POLICY "users can invite others to tours they own" ON public.invitations
    FOR INSERT WITH CHECK (inviter_id = auth.uid() AND EXISTS(SELECT 1 FROM tours WHERE id = invitations.tour_id AND owner_id = auth.uid()));

CREATE POLICY "users can delete invitations for tours they own" ON public.invitations
    FOR DELETE USING (EXISTS(SELECT 1 FROM tours WHERE id = invitations.tour_id AND owner_id = auth.uid()));

-- Tags policies
CREATE POLICY "authenticated users can view tags" ON public.tags
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated users can create tags"
    ON public.tags
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

COMMENT ON POLICY "authenticated users can create tags" ON public.tags IS
    'Allows any authenticated user to create new tag names. Tags are shared globally across all tours.';

-- Tour_tags policies
CREATE POLICY "users can view tags for tours they participated in" ON public.tour_tags
    FOR SELECT USING (EXISTS (SELECT 1 FROM participants WHERE tour_id = tour_tags.tour_id AND user_id = auth.uid()));

CREATE POLICY "users can remove tags from archived tours they participated in"
    ON public.tour_tags
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.participants
            WHERE tour_id = tour_tags.tour_id AND user_id = auth.uid()
        ) AND
        EXISTS (
            SELECT 1
            FROM public.tours
            WHERE id = tour_tags.tour_id AND status = 'archived'
        )
    );

COMMENT ON POLICY "users can remove tags from archived tours they participated in" ON public.tour_tags IS
    'Allows participants to remove tags from archived tours they were part of. Only works on archived tours.';

CREATE POLICY "users can add tags only to archived tours they participated in"
    ON public.tour_tags
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.participants
            WHERE tour_id = tour_tags.tour_id AND user_id = auth.uid()
        ) AND
        EXISTS (
            SELECT 1
            FROM public.tours
            WHERE id = tour_tags.tour_id AND status = 'archived'
        )
    );

COMMENT ON POLICY "users can add tags only to archived tours they participated in" ON public.tour_tags IS
    'Allows participants to add tags only to tours they participated in and that are archived.';

-- Tour activity policies
CREATE POLICY "Users can view own activity records"
    ON public.tour_activity
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity records"
    ON public.tour_activity
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity records"
    ON public.tour_activity
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- OTP policies (service role only)
CREATE POLICY "Service role only" ON public.invitation_otp
    FOR ALL
    TO authenticated
    USING (FALSE);

CREATE POLICY "Service role only" ON public.auth_otp
    FOR ALL
    TO authenticated
    USING (FALSE);

-- Cron job logs policies (no policies needed - managed by SECURITY DEFINER functions)

-- ============================================================================
-- STORAGE BUCKET FOR AVATARS
-- ============================================================================

-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload their own avatar (INSERT)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- Policy: Users can update their own avatar (UPDATE)
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- Policy: Users can delete their own avatar (DELETE)
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- Policy: Anyone can view avatars (SELECT) since bucket is public
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================================================
-- CRON JOBS FOR AUTOMATION
-- ============================================================================

-- Schedule: Archive finished tours (daily at 03:00 UTC)
DO $$
BEGIN
    PERFORM cron.unschedule('archive-finished-tours');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'pg_cron extension not available - skipping job scheduling. Function can be called manually.';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error while trying to unschedule job: %', SQLERRM;
END;
$$;

DO $$
BEGIN
    PERFORM cron.schedule(
        'archive-finished-tours',
        '0 3 * * *',
        'SELECT public.archive_finished_tours();'
    );
    RAISE NOTICE 'Successfully scheduled archive-finished-tours job';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'pg_cron extension not available - job not scheduled. Use manual execution: SELECT archive_finished_tours();';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error scheduling cron job: %', SQLERRM;
END;
$$;

-- Schedule: Cleanup expired invitations (daily at 04:00 UTC)
DO $$
BEGIN
    PERFORM cron.unschedule('cleanup-expired-invitations');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'pg_cron extension not available - skipping job scheduling. Function can be called manually.';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error while trying to unschedule job: %', SQLERRM;
END;
$$;

DO $$
BEGIN
    PERFORM cron.schedule(
        'cleanup-expired-invitations',
        '0 4 * * *',
        'SELECT public.cleanup_expired_invitations();'
    );
    RAISE NOTICE 'Successfully scheduled cleanup-expired-invitations job';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'pg_cron extension not available - job not scheduled. Use manual execution: SELECT cleanup_expired_invitations();';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error scheduling cron job: %', SQLERRM;
END;
$$;

COMMIT;
