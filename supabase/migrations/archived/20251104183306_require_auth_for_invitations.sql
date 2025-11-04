-- migration: 20251104183306_require_auth_for_invitations.sql
-- description: Requires authentication for viewing invitations - implements secure RLS policies
-- fixes: Security issue - invitations should only be viewable by authenticated users with proper access

begin;

-- Drop the public read policy that allowed unauthenticated access
drop policy if exists "anyone can read invitation by token" on public.invitations;

-- Drop old/duplicate tour owner policies if they exist
drop policy if exists "users can see invitations for tours they own" on public.invitations;
drop policy if exists "tour owners can view all invitations for their tours" on public.invitations;

-- Policy 1: Authenticated users can read invitations sent to their email
-- This allows users to see invitations they received (any status, including accepted/declined)
create policy "invited users can view their invitations"
  on public.invitations
  for select
  using (
    auth.uid() is not null
    and email = auth.email()
  );

-- Policy 2: Tour owners can view all invitations for their tours
-- This allows tour owners to manage and monitor all invitations they sent
create policy "tour owners can view tour invitations"
  on public.invitations
  for select
  using (
    auth.uid() is not null
    and exists (
      select 1
      from tours
      where tours.id = invitations.tour_id
        and tours.owner_id = auth.uid()
    )
  );

comment on policy "invited users can view their invitations" on public.invitations is
  E'SECURITY MODEL: Invited Users Can View Their Invitations

  This policy allows authenticated users to view invitations sent to their email address.
  Users can see their invitations regardless of status (pending, accepted, or declined).

  SECURITY FEATURES:
  1. Authentication Required: auth.uid() must be present (user logged in)
  2. Email Matching: User''s verified email must match the invitation email
  3. No Token Required: Users can see their invitations history even after accepting/declining

  ACCESS RULES:
  - Users can ONLY see invitations where the email matches their authenticated email
  - This includes pending, accepted, and declined invitations
  - Users cannot see invitations sent to other email addresses';

comment on policy "tour owners can view tour invitations" on public.invitations is
  E'SECURITY MODEL: Tour Owners Can View All Tour Invitations

  This policy allows tour owners to view all invitations for tours they own,
  regardless of invitation status or recipient.

  SECURITY FEATURES:
  1. Authentication Required: auth.uid() must be present (user logged in)
  2. Ownership Verification: User must be the owner of the tour
  3. Full Visibility: Can see all invitations (pending, accepted, declined, expired)

  ACCESS RULES:
  - Tour owners can see ALL invitations for their tours
  - This includes invitations to any email address
  - This allows tour owners to manage and monitor invitation status
  - Ownership is verified through the tours.owner_id foreign key';

commit;
