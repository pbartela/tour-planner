-- Migration: Add voting_locked field to tours table
-- Description: Allows tour owners to lock/unlock voting to prevent changes after decision
-- Related US: US-019 (Managing voting by the owner)

BEGIN;

-- Add voting_locked column to tours table
ALTER TABLE public.tours
ADD COLUMN voting_locked BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.tours.voting_locked IS 'When true, participants cannot vote or change their votes. Only owner can modify.';

COMMIT;
