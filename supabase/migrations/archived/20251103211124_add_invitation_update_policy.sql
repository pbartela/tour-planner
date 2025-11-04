-- migration: 20251103211124_add_invitation_update_policy.sql
-- description: Adds UPDATE RLS policy for invitations table to allow tour owners to update invitations (for resending).

begin;

-- Allow tour owners to update invitations for tours they own
-- This is needed for resending invitations (updating status, token, expires_at)
create policy "users can update invitations for tours they own" 
  on public.invitations
  for update
  using (
    exists(
      select 1 
      from tours 
      where id = invitations.tour_id 
        and owner_id = auth.uid()
    )
  )
  with check (
    exists(
      select 1 
      from tours 
      where id = invitations.tour_id 
        and owner_id = auth.uid()
    )
  );

comment on policy "users can update invitations for tours they own" on public.invitations is
  'Allows tour owners to update invitations for their tours. Used for resending declined or expired invitations.';

commit;


