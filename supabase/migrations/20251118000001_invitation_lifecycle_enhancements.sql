-- Invitation Lifecycle Enhancements
-- This migration extends the invitation system with:
-- 1. 'expired' status for audit trail (instead of deleting expired invitations)
-- 2. Extended TTL from 7 days to 14 days
-- 3. Automated cleanup cron job to mark expired invitations

BEGIN;

-- ============================================================================
-- Add 'expired' status to invitation_status ENUM
-- ============================================================================

-- Add new value to existing ENUM type
ALTER TYPE public.invitation_status ADD VALUE IF NOT EXISTS 'expired';

COMMENT ON TYPE public.invitation_status IS 'Invitation statuses: pending (awaiting response), accepted (user joined), declined (user rejected), expired (invitation TTL exceeded)';

-- ============================================================================
-- Update default expiration from 7 to 14 days
-- ============================================================================

-- Update the default for new invitations
ALTER TABLE public.invitations
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '14 days');

COMMENT ON COLUMN public.invitations.expires_at IS
  'Expiration date of the invitation. Defaults to 14 days from creation.';

-- ============================================================================
-- Function: Cleanup expired invitations
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER := 0;
  error_msg TEXT;
BEGIN
  -- Mark pending invitations as expired if they passed their expires_at date
  UPDATE public.invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();

  -- Get the count of expired invitations
  GET DIAGNOSTICS expired_count = ROW_COUNT;

  -- Log successful execution
  INSERT INTO public.cron_job_logs (job_name, tours_archived, success)
  VALUES ('cleanup_expired_invitations', expired_count, true);

  RETURN expired_count;

EXCEPTION WHEN OTHERS THEN
  -- Log error
  GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
  INSERT INTO public.cron_job_logs (job_name, tours_archived, success, error_message)
  VALUES ('cleanup_expired_invitations', 0, false, error_msg);

  -- Re-raise the error
  RAISE;
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_invitations IS
  'Automatically marks pending invitations as expired when their expires_at date has passed. Returns count of expired invitations.';

-- ============================================================================
-- Schedule cron job for invitation cleanup (04:00 UTC daily)
-- ============================================================================

DO $$
BEGIN
  -- Remove any existing job with the same name
  PERFORM cron.unschedule('cleanup-expired-invitations');
EXCEPTION
  WHEN undefined_table THEN
    -- pg_cron not available (local development), skip scheduling
    RAISE NOTICE 'pg_cron extension not available - skipping job scheduling. Function can be called manually.';
  WHEN OTHERS THEN
    -- Other error, log it
    RAISE NOTICE 'Error while trying to unschedule job: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  -- Schedule the job
  PERFORM cron.schedule(
    'cleanup-expired-invitations',
    '0 4 * * *', -- Every day at 04:00 UTC (1 hour after archive job)
    'SELECT public.cleanup_expired_invitations();'
  );
  RAISE NOTICE 'Successfully scheduled cleanup-expired-invitations job';
EXCEPTION
  WHEN undefined_table THEN
    -- pg_cron not available (local development)
    RAISE NOTICE 'pg_cron extension not available - job not scheduled. Use manual execution: SELECT cleanup_expired_invitations();';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error scheduling cron job: %', SQLERRM;
END;
$$;

-- ============================================================================
-- Update accept/decline functions to check for expired status
-- ============================================================================

-- Update accept_invitation function to reject expired invitations
CREATE OR REPLACE FUNCTION public.accept_invitation(
  invitation_token text,
  accepting_user_id uuid
)
RETURNS uuid -- returns tour_id
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation_id uuid;
  v_tour_id uuid;
  v_invitee_email text;
  v_user_email text;
  v_invitation_status invitation_status;
BEGIN
  -- Find the invitation
  SELECT
    id,
    tour_id,
    email,
    status
  INTO
    v_invitation_id,
    v_tour_id,
    v_invitee_email,
    v_invitation_status
  FROM public.invitations
  WHERE token = invitation_token;

  -- Check if invitation exists
  IF v_invitation_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invitation token';
  END IF;

  -- Check if invitation is pending (not accepted, declined, or expired)
  IF v_invitation_status != 'pending' THEN
    IF v_invitation_status = 'expired' THEN
      RAISE EXCEPTION 'This invitation has expired';
    ELSIF v_invitation_status = 'accepted' THEN
      RAISE EXCEPTION 'This invitation has already been accepted';
    ELSIF v_invitation_status = 'declined' THEN
      RAISE EXCEPTION 'This invitation has been declined';
    END IF;
  END IF;

  -- Get user email for verification
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = accepting_user_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Verify that invitation email matches user email
  -- (security: prevent someone from accepting invitation meant for another person)
  IF v_invitee_email != v_user_email THEN
    RAISE EXCEPTION 'Invitation email does not match user email';
  END IF;

  -- Check if user is already a participant
  IF EXISTS (
    SELECT 1
    FROM public.participants
    WHERE tour_id = v_tour_id AND user_id = accepting_user_id
  ) THEN
    RAISE EXCEPTION 'User is already a participant';
  END IF;

  -- Add user as participant
  INSERT INTO public.participants (tour_id, user_id)
  VALUES (v_tour_id, accepting_user_id)
  ON CONFLICT DO NOTHING;

  -- Mark invitation as accepted
  UPDATE public.invitations
  SET status = 'accepted'
  WHERE id = v_invitation_id;

  RETURN v_tour_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_invitation(text, uuid) TO authenticated;

COMMENT ON FUNCTION public.accept_invitation(text, uuid) IS
  'Accepts an invitation by token and adds the user as a participant. Verifies email match, checks expiration, and prevents duplicate participants. Returns tour_id on success.';

-- Update decline_invitation function to check for expired status
CREATE OR REPLACE FUNCTION public.decline_invitation(
  invitation_token text,
  declining_user_id uuid
)
RETURNS uuid -- returns tour_id
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation_id uuid;
  v_tour_id uuid;
  v_invitee_email text;
  v_user_email text;
  v_invitation_status invitation_status;
BEGIN
  -- Find the invitation
  SELECT
    id,
    tour_id,
    email,
    status
  INTO
    v_invitation_id,
    v_tour_id,
    v_invitee_email,
    v_invitation_status
  FROM public.invitations
  WHERE token = invitation_token;

  -- Check if invitation exists
  IF v_invitation_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invitation token';
  END IF;

  -- Check if invitation is pending (not accepted, declined, or expired)
  IF v_invitation_status != 'pending' THEN
    IF v_invitation_status = 'expired' THEN
      RAISE EXCEPTION 'This invitation has expired';
    ELSIF v_invitation_status = 'accepted' THEN
      RAISE EXCEPTION 'This invitation has already been accepted';
    ELSIF v_invitation_status = 'declined' THEN
      RAISE EXCEPTION 'This invitation has already been declined';
    END IF;
  END IF;

  -- Get user email for verification
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = declining_user_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Verify that invitation email matches user email
  -- (security: prevent someone from declining invitation meant for another person)
  IF v_invitee_email != v_user_email THEN
    RAISE EXCEPTION 'Invitation email does not match user email';
  END IF;

  -- Mark invitation as declined
  UPDATE public.invitations
  SET status = 'declined'
  WHERE id = v_invitation_id;

  RETURN v_tour_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decline_invitation(text, uuid) TO authenticated;

COMMENT ON FUNCTION public.decline_invitation(text, uuid) IS
  'Declines an invitation by token. Verifies email match, checks expiration, and changes status to declined. Returns tour_id on success. Owner can re-invite the user later.';

COMMIT;
