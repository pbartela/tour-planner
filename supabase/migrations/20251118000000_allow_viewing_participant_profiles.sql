-- Migration: Allow users to view profiles of participants in their tours
-- Description: Updates the profiles RLS policy to allow users to see profiles
--              of other participants in tours they're part of, enabling proper
--              display of participant avatars and names.

begin;

-- Drop the old restrictive policy
drop policy if exists "users can view their own profile" on public.profiles;

-- Create new policy that allows:
-- 1. Users to view their own profile
-- 2. Users to view profiles of participants in tours they're in
create policy "users can view profiles in their tours" on public.profiles
  for select using (
    -- User can see their own profile
    auth.uid() = id
    or
    -- User can see profiles of participants in tours they're in
    exists (
      select 1
      from public.participants p1
      inner join public.participants p2 on p1.tour_id = p2.tour_id
      where p1.user_id = auth.uid()  -- Current user is a participant
        and p2.user_id = profiles.id  -- This profile belongs to another participant in same tour
    )
  );

comment on policy "users can view profiles in their tours" on public.profiles is
  E'SECURITY MODEL: Profile Visibility in Tours

  This policy allows users to view:
  1. Their own profile (full access)
  2. Profiles of other participants in tours they are part of

  SECURITY FEATURES:
  1. Authentication Required: auth.uid() must be present (user logged in)
  2. Tour-based Access: Can only see profiles of users in shared tours
  3. Participant Verification: Uses participants table to verify shared tours

  ACCESS RULES:
  - Users can ALWAYS see their own profile
  - Users can see profiles of other participants in tours they are in
  - This enables displaying participant avatars and names in tour lists
  - Users cannot see profiles of users not in their tours';

commit;
