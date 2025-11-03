-- migration: 20251102184243_add_invitation_token_expiry.sql
-- description: Adds token and expires_at columns to invitations table, creates indexes,
--              trigger for automatic token generation, and accept_invitation function.

begin;

-- Add token and expires_at columns to invitations table
alter table public.invitations 
  add column if not exists token text unique,
  add column if not exists expires_at timestamptz not null default (now() + interval '7 days');

-- Index for fast token lookup (used during acceptance)
create index if not exists idx_invitations_token on public.invitations (token) 
  where token is not null and status = 'pending';

-- Index for cleaning up expired invitations
create index if not exists idx_invitations_expires_at on public.invitations (expires_at) 
  where status = 'pending';

-- Function to automatically generate unique invitation token
-- This function is called by trigger and must return type 'trigger'
create or replace function public.generate_invitation_token()
returns trigger
language plpgsql
as $$
declare
  token_value text;
  max_attempts int := 10;
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
  'Generates a unique 32-character hexadecimal token for invitation links. Used by trigger before INSERT.';

-- Trigger to automatically generate token on INSERT if not provided
create trigger invitation_token_generator
  before insert on public.invitations
  for each row
  when (new.token is null)
  execute function public.generate_invitation_token();

-- Function to safely accept an invitation and add user as participant
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

-- New RLS policy: public access to invitation by token (for acceptance page)
create policy "anyone can read invitation by token" 
  on public.invitations
  for select
  using (
    token is not null 
    and status = 'pending' 
    and expires_at > now()
  );

-- Update existing invitation by setting expires_at for existing rows without it
update public.invitations
set expires_at = created_at + interval '7 days'
where expires_at is null;

-- Comments for documentation
comment on column public.invitations.token is 
  'Unique token used in invitation link. Automatically generated as 32-character hex string.';
comment on column public.invitations.expires_at is 
  'Expiration date of the invitation. Defaults to 7 days from creation.';

commit;

