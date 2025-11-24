-- migration: 20251104190000_invitation_system_enhancements.sql
-- description: Comprehensive invitation system enhancements including token system,
--              accept/decline functions, and secure RLS policies
-- combines: 20251102184243, 20251103100000, 20251103211124, 20251104175657, 20251104183306

begin;

-- ============================================================================
-- SCHEMA CHANGES: Add token and expires_at columns
-- ============================================================================

alter table public.invitations
  add column if not exists token text unique,
  add column if not exists expires_at timestamptz not null default (now() + interval '7 days');

-- Index for fast token lookup (used during acceptance)
create index if not exists idx_invitations_token on public.invitations (token)
  where token is not null and status = 'pending';

-- Index for cleaning up expired invitations
create index if not exists idx_invitations_expires_at on public.invitations (expires_at)
  where status = 'pending';

-- Update existing invitations by setting expires_at for existing rows without it
update public.invitations
set expires_at = created_at + interval '7 days'
where expires_at is null;

-- Comments for documentation
comment on column public.invitations.token is
  'Unique token used in invitation link. Automatically generated as 32-character hex string.';
comment on column public.invitations.expires_at is
  'Expiration date of the invitation. Defaults to 7 days from creation.';

-- ============================================================================
-- FUNCTION: Automatic token generation (with 100 attempts for high-volume)
-- ============================================================================

create or replace function public.generate_invitation_token()
returns trigger
language plpgsql
as $$
declare
  token_value text;
  max_attempts int := 100; -- High limit for high-volume scenarios
  attempts int := 0;
begin
  -- Only generate if token is null
  if NEW.token is not null then
    return NEW;
  end if;

  -- Generate unique token (32 hex characters = 128 bits)
  loop
    token_value := encode(gen_random_bytes(16), 'hex');
    attempts := attempts + 1;

    -- Check uniqueness
    exit when not exists (select 1 from public.invitations where token = token_value);

    -- Safety check to prevent infinite loop
    if attempts >= max_attempts then
      raise exception 'Failed to generate unique invitation token after % attempts', max_attempts;
    end if;
  end loop;

  -- Set the token on the NEW record
  NEW.token := token_value;
  return NEW;
end;
$$;

comment on function public.generate_invitation_token() is
  'Generates a unique 32-character hexadecimal token for invitation links. Uses 100 max attempts for high-volume scenarios. Used by trigger before INSERT.';

-- Trigger to automatically generate token on INSERT if not provided
drop trigger if exists invitation_token_generator on public.invitations;
create trigger invitation_token_generator
  before insert on public.invitations
  for each row
  when (new.token is null)
  execute function public.generate_invitation_token();

-- ============================================================================
-- FUNCTION: Accept invitation
-- ============================================================================

create or replace function public.accept_invitation(
  invitation_token text,
  accepting_user_id uuid
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
  where id = accepting_user_id;

  if v_user_email is null then
    raise exception 'User not found';
  end if;

  -- Verify that invitation email matches user email
  -- (security: prevent someone from accepting invitation meant for another person)
  if v_invitee_email != v_user_email then
    raise exception 'Invitation email does not match user email';
  end if;

  -- Check if user is already a participant
  if exists (
    select 1
    from public.participants
    where tour_id = v_tour_id and user_id = accepting_user_id
  ) then
    raise exception 'User is already a participant';
  end if;

  -- Add user as participant
  insert into public.participants (tour_id, user_id)
  values (v_tour_id, accepting_user_id)
  on conflict do nothing;

  -- Mark invitation as accepted
  update public.invitations
  set status = 'accepted'
  where id = v_invitation_id;

  return v_tour_id;
end;
$$;

grant execute on function public.accept_invitation(text, uuid) to authenticated;

comment on function public.accept_invitation(text, uuid) is
  'Accepts an invitation by token and adds the user as a participant. Verifies email match and prevents duplicate participants. Returns tour_id on success.';

-- ============================================================================
-- FUNCTION: Decline invitation
-- ============================================================================

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

-- ============================================================================
-- RLS POLICIES: Secure invitation access
-- ============================================================================

-- Drop old/insecure policies
drop policy if exists "anyone can read invitation by token" on public.invitations;
drop policy if exists "users can see invitations for tours they own" on public.invitations;
drop policy if exists "tour owners can view all invitations for their tours" on public.invitations;

-- Policy 1: Invited users can view invitations sent to their email
create policy "invited users can view their invitations"
  on public.invitations
  for select
  using (
    auth.uid() is not null
    and email = auth.email()
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

-- Policy 2: Tour owners can view all invitations for their tours
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

-- Policy 3: Tour owners can update invitations (for resending)
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
