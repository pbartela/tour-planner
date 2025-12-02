-- Create tour_activity table for tracking when users last viewed tours
-- This enables the "new activity" indicator feature

CREATE TABLE IF NOT EXISTS public.tour_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tour_activity_unique_user_tour UNIQUE(tour_id, user_id)
);

-- Add index for performance on common queries
CREATE INDEX idx_tour_activity_tour_id ON public.tour_activity(tour_id);
CREATE INDEX idx_tour_activity_user_id ON public.tour_activity(user_id);

-- Add comment explaining the table purpose
COMMENT ON TABLE public.tour_activity IS 'Tracks when users last viewed each tour to determine if there is new activity (comments, votes, or tour updates)';
COMMENT ON COLUMN public.tour_activity.last_viewed_at IS 'Timestamp when user last opened tour details page';

-- Enable Row Level Security
ALTER TABLE public.tour_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own activity records
CREATE POLICY "Users can view own activity records"
  ON public.tour_activity
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own activity records
CREATE POLICY "Users can insert own activity records"
  ON public.tour_activity
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own activity records
CREATE POLICY "Users can update own activity records"
  ON public.tour_activity
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users cannot delete activity records (they should only be updated)
-- We don't create a DELETE policy, which means deletes are blocked by default
