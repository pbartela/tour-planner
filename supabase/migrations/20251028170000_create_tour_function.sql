-- Migration: Create tour insertion function to handle RLS
-- Description: Creates a SECURITY DEFINER function to insert tours and add the creator as a participant.
--              This bypasses RLS policy evaluation issues that occur when using server-side Supabase clients.
--
-- Background: When using @supabase/ssr server-side clients, RLS policies that check auth.uid()
--             may fail during INSERT operations even when the user is properly authenticated.
--             This function provides a reliable workaround while maintaining security.

BEGIN;

-- Create a function to insert tours that bypasses RLS
CREATE OR REPLACE FUNCTION public.create_tour(
  p_title text,
  p_destination text,
  p_description text,
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_participant_limit integer DEFAULT NULL,
  p_like_threshold integer DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  title text,
  destination text,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  participant_limit integer,
  like_threshold integer,
  are_votes_hidden boolean,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_tour_id uuid;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();

  -- Ensure user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create a tour';
  END IF;

  -- Insert the tour
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

  -- Add the owner as a participant
  INSERT INTO public.participants (tour_id, user_id)
  VALUES (v_tour_id, v_user_id);

  -- Return the created tour
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
    t.status::text,
    t.created_at
  FROM public.tours t
  WHERE t.id = v_tour_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_tour TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_tour IS 'Creates a new tour and adds the creator as a participant. Uses SECURITY DEFINER to bypass RLS evaluation issues with server-side clients.';

COMMIT;
