-- Automatic Tour Archiving System
-- This migration creates a function and cron job to automatically archive tours
-- that have passed their end_date

-- Create a logging table for cron job execution
CREATE TABLE IF NOT EXISTS public.cron_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  execution_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  tours_archived INTEGER,
  invitations_expired INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for querying logs
CREATE INDEX idx_cron_job_logs_job_name ON public.cron_job_logs(job_name);
CREATE INDEX idx_cron_job_logs_execution_time ON public.cron_job_logs(execution_time DESC);

COMMENT ON TABLE public.cron_job_logs IS 'Logs execution of automated cron jobs for monitoring and debugging';

-- Create function to archive finished tours
CREATE OR REPLACE FUNCTION public.archive_finished_tours()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  archived_count INTEGER := 0;
  error_msg TEXT;
BEGIN
  -- Update tours where end_date has passed and status is still 'active'
  UPDATE public.tours
  SET status = 'archived'
  WHERE status = 'active'
    AND end_date < now();

  -- Get the count of archived tours
  GET DIAGNOSTICS archived_count = ROW_COUNT;

  -- Log successful execution
  INSERT INTO public.cron_job_logs (job_name, tours_archived, success)
  VALUES ('archive_finished_tours', archived_count, true);

  RETURN archived_count;

EXCEPTION WHEN OTHERS THEN
  -- Log error
  GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
  INSERT INTO public.cron_job_logs (job_name, tours_archived, success, error_message)
  VALUES ('archive_finished_tours', 0, false, error_msg);

  -- Re-raise the error
  RAISE;
END;
$$;

COMMENT ON FUNCTION public.archive_finished_tours IS 'Automatically archives tours that have passed their end_date. Returns count of archived tours.';

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the archiving job to run daily at 03:00 UTC
-- Note: In local development, pg_cron may not be available
-- The function can still be called manually via: SELECT archive_finished_tours();
DO $$
BEGIN
  -- Remove any existing job with the same name
  PERFORM cron.unschedule('archive-finished-tours');
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
    'archive-finished-tours',
    '0 3 * * *', -- Every day at 03:00 UTC
    'SELECT public.archive_finished_tours();'
  );
  RAISE NOTICE 'Successfully scheduled archive-finished-tours job';
EXCEPTION
  WHEN undefined_table THEN
    -- pg_cron not available (local development)
    RAISE NOTICE 'pg_cron extension not available - job not scheduled. Use manual execution: SELECT archive_finished_tours();';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error scheduling cron job: %', SQLERRM;
END;
$$;

-- Add index on tours(status, end_date) for efficient archiving queries
CREATE INDEX IF NOT EXISTS idx_tours_status_end_date ON public.tours(status, end_date)
WHERE status = 'active';

COMMENT ON INDEX idx_tours_status_end_date IS 'Optimizes the automatic archiving query by indexing active tours by end_date';
