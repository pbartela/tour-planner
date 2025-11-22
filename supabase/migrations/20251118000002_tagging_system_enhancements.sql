-- Tagging System Enhancements
-- This migration adds missing RLS policies for the tagging system
-- to allow participants to manage tags on archived tours

BEGIN;

-- ============================================================================
-- RLS Policy: Allow authenticated users to create new tags
-- ============================================================================

CREATE POLICY "authenticated users can create tags"
  ON public.tags
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

COMMENT ON POLICY "authenticated users can create tags" ON public.tags IS
  'Allows any authenticated user to create new tag names. Tags are shared globally across all tours.';

-- ============================================================================
-- RLS Policy: Allow participants to remove tags from archived tours
-- ============================================================================

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

-- ============================================================================
-- Add index for tag name lookup (case-insensitive search)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tags_name_lower ON public.tags (LOWER(name));

COMMENT ON INDEX idx_tags_name_lower IS
  'Enables fast case-insensitive tag name lookups for autocomplete and search.';

-- ============================================================================
-- Function: Get or create tag by name (case-insensitive)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_or_create_tag(tag_name TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tag_id BIGINT;
  normalized_name TEXT;
BEGIN
  -- Normalize: trim and lowercase
  normalized_name := LOWER(TRIM(tag_name));

  -- Validate: must not be empty
  IF normalized_name = '' THEN
    RAISE EXCEPTION 'Tag name cannot be empty';
  END IF;

  -- Validate: max length 50 characters
  IF LENGTH(normalized_name) > 50 THEN
    RAISE EXCEPTION 'Tag name cannot exceed 50 characters';
  END IF;

  -- Try to find existing tag (case-insensitive)
  SELECT id INTO tag_id
  FROM public.tags
  WHERE LOWER(name) = normalized_name;

  -- If not found, create it
  IF tag_id IS NULL THEN
    INSERT INTO public.tags (name)
    VALUES (normalized_name)
    RETURNING id INTO tag_id;
  END IF;

  RETURN tag_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_tag(TEXT) TO authenticated;

COMMENT ON FUNCTION public.get_or_create_tag(TEXT) IS
  'Gets existing tag ID by name (case-insensitive) or creates a new tag if it does not exist. Returns tag ID. Validates length (max 50 chars) and non-empty.';

COMMIT;
