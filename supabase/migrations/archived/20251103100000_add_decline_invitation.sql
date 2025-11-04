-- migration: 20251103100000_add_decline_invitation.sql
-- description: Adds decline_invitation function to allow users to decline tour invitations.

begin;

-- Function to safely decline an invitation
create or replace function public.decline_invitation(
  invitation_token text,
  declining_user_id uuid
)
returns uuid -- returns tour_id
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation_id uuid;
  v_tour_id uuid;
  v_invitee_email text;
  v_user_email text;
begin
  -- Find the invitation
  select
    id,
    tour_id,
    email
  into
    v_invitation_id,
    v_tour_id,
    v_invitee_email
  from public.invitations
  where token = invitation_token
    and status = 'pending'
    and expires_at > now();

  if v_invitation_id is null then
    raise exception 'Invalid or expired invitation token';
  end if;

  -- Get user email for verification
  select email into v_user_email
  from auth.users
  where id = declining_user_id;

  if v_user_email is null then
    raise exception 'User not found';
  end if;

  -- Verify that invitation email matches user email
  -- (security: prevent someone from declining invitation meant for another person)
  if v_invitee_email != v_user_email then
    raise exception 'Invitation email does not match user email';
  end if;

  -- Mark invitation as declined
  update public.invitations
  set status = 'declined'
  where id = v_invitation_id;

  return v_tour_id;
end;
$$;

grant execute on function public.decline_invitation(text, uuid) to authenticated;

comment on function public.decline_invitation(text, uuid) is
  'Declines an invitation by token. Verifies email match and changes status to declined. Returns tour_id on success. Owner can re-invite the user later.';

commit;
