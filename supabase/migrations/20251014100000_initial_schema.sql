-- migration: 20251014100000_initial_schema.sql
-- description: Complete database schema for the tour planner application.
-- This migration includes:
--   - Creation of all tables: profiles, tours, participants, comments, votes, invitations, tags, tour_tags, tour_activity, invitation_otp, auth_otp
--   - Definition of custom enum types for statuses
--   - Setup of row-level security (RLS) policies for all tables
--   - Creation of indexes for performance
--   - Implementation of triggers for automatic profile creation and handling user deletion
--   - Insertion of a special 'anonymized' user profile for maintaining comment integrity
--   - Helper functions for RLS, tour creation, invitation handling, and OTP management
--   - Supabase Storage bucket for user avatars

-- A note on the profiles table:
-- The foreign key constraint from 'public.profiles.id' to 'auth.users.id' has been omitted
-- to allow for the creation of a special 'anonymized' user record (uuid: 00000000-...).
-- Data integrity for regular users is maintained by a trigger that creates a profile
-- for each new user in 'auth.users'.

begin;

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

create type public.tour_status as enum ('active', 'archived');
create type public.invitation_status as enum ('pending', 'accepted', 'declined');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles table
create table public.profiles (
    id uuid primary key,
    display_name text,
    avatar_url text,
    language text not null default 'en-US',
    theme text not null default 'system',
    onboarding_completed boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Stores user profile information, extending the auth.users table.';
comment on column public.profiles.language is 'User preferred language in full locale format (e.g., en-US, pl-PL). Must match locale codes used in URLs and i18n configuration.';
comment on column public.profiles.avatar_url is 'URL to the user''s avatar image stored in Supabase Storage';

alter table public.profiles enable row level security;

-- Tours table
create table public.tours (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references public.profiles(id),
    title text not null check (length(title) > 0),
    destination text not null check (length(destination) > 0),
    description text,
    start_date timestamptz not null,
    end_date timestamptz not null,
    participant_limit integer check (participant_limit > 0),
    like_threshold integer check (like_threshold > 0),
    are_votes_hidden boolean not null default false,
    voting_locked boolean not null default false,
    status public.tour_status not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
comment on table public.tours is 'Contains all information about a tour.';
comment on column public.tours.voting_locked is 'When true, participants cannot vote or change their votes. Only owner can modify.';

alter table public.tours enable row level security;

-- Participants table
create table public.participants (
    tour_id uuid not null references public.tours(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    joined_at timestamptz not null default now(),
    primary key (tour_id, user_id)
);
comment on table public.participants is 'Joining table for the many-to-many relationship between profiles and tours.';

alter table public.participants enable row level security;

-- Comments table
create table public.comments (
    id uuid primary key default gen_random_uuid(),
    tour_id uuid not null references public.tours(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete set default default '00000000-0000-0000-0000-000000000000',
    content text not null check (length(content) > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
comment on table public.comments is 'Stores comments made by users on tours.';

alter table public.comments enable row level security;

-- Votes table
create table public.votes (
    tour_id uuid not null references public.tours(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (tour_id, user_id)
);
comment on table public.votes is 'Stores "likes" from users for a specific tour.';

alter table public.votes enable row level security;

-- Invitations table
create table public.invitations (
    id uuid primary key default gen_random_uuid(),
    tour_id uuid not null references public.tours(id) on delete cascade,
    inviter_id uuid not null references public.profiles(id) on delete cascade,
    email text not null,
    token text unique,
    status public.invitation_status not null default 'pending',
    expires_at timestamptz not null default (now() + interval '7 days'),
    created_at timestamptz not null default now()
);
comment on table public.invitations is 'Tracks invitations sent to users to join a tour.';
comment on column public.invitations.token is 'Unique token used in invitation link. Automatically generated as 32-character hex string.';
comment on column public.invitations.expires_at is 'Expiration date of the invitation. Defaults to 7 days from creation.';

alter table public.invitations enable row level security;

-- Tags table
create table public.tags (
    id bigint primary key generated by default as identity,
    name text not null unique check (length(name) > 0)
);
comment on table public.tags is 'Stores unique tags for categorizing archived tours.';

alter table public.tags enable row level security;

-- Tour tags table
create table public.tour_tags (
    tour_id uuid not null references public.tours(id) on delete cascade,
    tag_id bigint not null references public.tags(id) on delete cascade,
    primary key (tour_id, tag_id)
);
comment on table public.tour_tags is 'Joining table for the many-to-many relationship between tours and tags.';

alter table public.tour_tags enable row level security;

-- Tour activity table (for tracking when users last viewed tours)
create table public.tour_activity (
    id uuid primary key default gen_random_uuid(),
    tour_id uuid not null references public.tours(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    last_viewed_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    constraint tour_activity_unique_user_tour unique(tour_id, user_id)
);
comment on table public.tour_activity is 'Tracks when users last viewed each tour to determine if there is new activity (comments, votes, or tour updates)';
comment on column public.tour_activity.last_viewed_at is 'Timestamp when user last opened tour details page';

alter table public.tour_activity enable row level security;

-- Invitation OTP table (for invitation-based authentication)
create table public.invitation_otp (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    otp_token text not null unique,
    invitation_token text not null,
    expires_at timestamptz not null,
    used boolean default false,
    created_at timestamptz default now()
);
comment on table public.invitation_otp is 'Stores one-time tokens used for invitation-based authentication flow.';

alter table public.invitation_otp enable row level security;

-- Auth OTP table (for standard login/registration)
create table public.auth_otp (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    otp_token text not null unique,
    redirect_to text,
    expires_at timestamptz not null,
    used boolean default false,
    created_at timestamptz default now()
);
comment on table public.auth_otp is 'Stores one-time tokens used for standard authentication (login/registration).';
comment on column public.auth_otp.redirect_to is 'Optional redirect URL after authentication';

alter table public.auth_otp enable row level security;

-- ============================================================================
-- ANONYMIZED USER RECORD
-- ============================================================================

insert into public.profiles (id, display_name)
values ('00000000-0000-0000-0000-000000000000', 'Anonymized User');

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Participants indexes
create index on public.participants (user_id);

-- Comments indexes
create index on public.comments (tour_id, created_at desc);

-- Tour tags indexes
create index on public.tour_tags (tag_id);

-- Invitations indexes
create index on public.invitations (tour_id, email);
create index idx_invitations_token on public.invitations (token) where token is not null and status = 'pending';
create index idx_invitations_expires_at on public.invitations (expires_at) where status = 'pending';

-- Tours indexes
create index idx_tours_status on public.tours (status);
create index idx_tours_owner_id on public.tours (owner_id);

-- Tour activity indexes
create index idx_tour_activity_tour_id on public.tour_activity(tour_id);
create index idx_tour_activity_user_id on public.tour_activity(user_id);

-- OTP indexes
create index idx_invitation_otp_token on public.invitation_otp(otp_token);
create index idx_invitation_otp_expires_at on public.invitation_otp(expires_at);
create index idx_auth_otp_token on public.auth_otp(otp_token);
create index idx_auth_otp_expires_at on public.auth_otp(expires_at);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to create a profile for a new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

-- Function to handle user deletion
create or replace function public.handle_user_deletion()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  rec record;
  new_owner_id uuid;
begin
  -- Transfer ownership of tours or delete them
  for rec in select id from tours where owner_id = old.id loop
    new_owner_id := (
      select user_id from participants
      where tour_id = rec.id and user_id != old.id
      order by joined_at asc
      limit 1
    );
    if new_owner_id is not null then
      update tours set owner_id = new_owner_id where id = rec.id;
    else
      delete from tours where id = rec.id;
    end if;
  end loop;

  -- Delete the user's profile
  delete from public.profiles where id = old.id;
  
  return old;
end;
$$;

-- Function to check if a user is a participant in a tour
create or replace function public.is_participant(tour_id_to_check uuid, user_id_to_check uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.participants
    where tour_id = tour_id_to_check and user_id = user_id_to_check
  );
end;
$$;

-- Function to clean up unconfirmed users older than 24 hours
create or replace function public.cleanup_unconfirmed_users()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from auth.users
  where confirmed_at is null
    and created_at < now() - interval '24 hours';

  get diagnostics deleted_count = row_count;

  if deleted_count > 0 then
    raise notice 'Cleaned up % unconfirmed user(s)', deleted_count;
  end if;
end;
$$;

grant execute on function public.cleanup_unconfirmed_users() to postgres;
comment on function public.cleanup_unconfirmed_users() is 'Deletes unconfirmed users older than 24 hours to prevent database bloat from abandoned signups';

-- Function to create tours that bypasses RLS
create or replace function public.create_tour(
  p_title text,
  p_destination text,
  p_description text,
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_participant_limit integer default null,
  p_like_threshold integer default null
)
returns table (
  id uuid,
  owner_id uuid,
  title text,
  destination text,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  participant_limit integer,
  like_threshold integer,
  are_votes_hidden boolean,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_tour_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'User must be authenticated to create a tour';
  end if;

  insert into public.tours (
    owner_id,
    title,
    destination,
    description,
    start_date,
    end_date,
    participant_limit,
    like_threshold
  ) values (
    v_user_id,
    p_title,
    p_destination,
    p_description,
    p_start_date,
    p_end_date,
    p_participant_limit,
    p_like_threshold
  )
  returning tours.id into v_tour_id;

  insert into public.participants (tour_id, user_id)
  values (v_tour_id, v_user_id);

  return query
  select
    t.id,
    t.owner_id,
    t.title,
    t.destination,
    t.description,
    t.start_date,
    t.end_date,
    t.participant_limit,
    t.like_threshold,
    t.are_votes_hidden,
    t.status::text,
    t.created_at
  from public.tours t
  where t.id = v_tour_id;
end;
$$;

grant execute on function public.create_tour to authenticated;
comment on function public.create_tour is 'Creates a new tour and adds the creator as a participant. Uses SECURITY DEFINER to bypass RLS evaluation issues with server-side clients.';

-- Function for automatic invitation token generation
create or replace function public.generate_invitation_token()
returns trigger
language plpgsql
as $$
declare
  token_value text;
  max_attempts int := 100;
  attempts int := 0;
begin
  if NEW.token is not null then
    return NEW;
  end if;

  loop
    token_value := encode(gen_random_bytes(16), 'hex');
    attempts := attempts + 1;

    exit when not exists (select 1 from public.invitations where token = token_value);

    if attempts >= max_attempts then
      raise exception 'Failed to generate unique invitation token after % attempts', max_attempts;
    end if;
  end loop;

  NEW.token := token_value;
  return NEW;
end;
$$;

comment on function public.generate_invitation_token() is 'Generates a unique 32-character hexadecimal token for invitation links. Uses 100 max attempts for high-volume scenarios. Used by trigger before INSERT.';

-- Function to accept invitation
create or replace function public.accept_invitation(
  invitation_token text,
  accepting_user_id uuid
)
returns uuid
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
  select id, tour_id, email
  into v_invitation_id, v_tour_id, v_invitee_email
  from public.invitations
  where token = invitation_token
    and status = 'pending'
    and expires_at > now();

  if v_invitation_id is null then
    raise exception 'Invalid or expired invitation token';
  end if;

  select email into v_user_email
  from auth.users
  where id = accepting_user_id;

  if v_user_email is null then
    raise exception 'User not found';
  end if;

  if v_invitee_email != v_user_email then
    raise exception 'Invitation email does not match user email';
  end if;

  if exists (
    select 1
    from public.participants
    where tour_id = v_tour_id and user_id = accepting_user_id
  ) then
    raise exception 'User is already a participant';
  end if;

  insert into public.participants (tour_id, user_id)
  values (v_tour_id, accepting_user_id)
  on conflict do nothing;

  update public.invitations
  set status = 'accepted'
  where id = v_invitation_id;

  return v_tour_id;
end;
$$;

grant execute on function public.accept_invitation(text, uuid) to authenticated;
comment on function public.accept_invitation(text, uuid) is 'Accepts an invitation by token and adds the user as a participant. Verifies email match and prevents duplicate participants. Returns tour_id on success.';

-- Function to decline invitation
create or replace function public.decline_invitation(
  invitation_token text,
  declining_user_id uuid
)
returns uuid
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
  select id, tour_id, email
  into v_invitation_id, v_tour_id, v_invitee_email
  from public.invitations
  where token = invitation_token
    and status = 'pending'
    and expires_at > now();

  if v_invitation_id is null then
    raise exception 'Invalid or expired invitation token';
  end if;

  select email into v_user_email
  from auth.users
  where id = declining_user_id;

  if v_user_email is null then
    raise exception 'User not found';
  end if;

  if v_invitee_email != v_user_email then
    raise exception 'Invitation email does not match user email';
  end if;

  update public.invitations
  set status = 'declined'
  where id = v_invitation_id;

  return v_tour_id;
end;
$$;

grant execute on function public.decline_invitation(text, uuid) to authenticated;
comment on function public.decline_invitation(text, uuid) is 'Declines an invitation by token. Verifies email match and changes status to declined. Returns tour_id on success. Owner can re-invite the user later.';

-- Function to get user by email
create or replace function public.get_user_by_email(search_email text)
returns table (
  id uuid,
  email varchar(255),
  email_confirmed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  raw_user_meta_data jsonb,
  raw_app_meta_data jsonb
)
security definer
set search_path = public
language plpgsql
as $$
begin
  return query
  select
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    u.updated_at,
    u.raw_user_meta_data,
    u.raw_app_meta_data
  from auth.users u
  where lower(trim(u.email)) = lower(trim(search_email))
  limit 1;
end;
$$;

grant execute on function public.get_user_by_email(text) to authenticated, service_role;
comment on function public.get_user_by_email is 'Securely lookup user by email from auth.users table. Returns user data without exposing service_role key.';

-- Function to clean up expired invitation OTPs
create or replace function cleanup_expired_invitation_otps()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.invitation_otp
  where expires_at < now() - interval '24 hours';
end;
$$;

-- Function to clean up expired auth OTPs
create or replace function cleanup_expired_auth_otps()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.auth_otp
  where expires_at < now() - interval '24 hours';
end;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for new user profile creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger for user deletion
create trigger on_auth_user_deleted
  before delete on auth.users
  for each row execute procedure public.handle_user_deletion();

-- Trigger to automatically generate invitation token on INSERT
create trigger invitation_token_generator
  before insert on public.invitations
  for each row
  when (new.token is null)
  execute function public.generate_invitation_token();

-- ============================================================================
-- RLS POLICIES: PROFILES
-- ============================================================================

create policy "users can view profiles in their tours" on public.profiles
  for select using (
    auth.uid() = id
    or
    exists (
      select 1
      from public.participants p1
      inner join public.participants p2 on p1.tour_id = p2.tour_id
      where p1.user_id = auth.uid()
        and p2.user_id = profiles.id
    )
  );

comment on policy "users can view profiles in their tours" on public.profiles is
  'SECURITY MODEL: Profile Visibility in Tours. Allows users to view their own profile and profiles of other participants in tours they are part of. This enables displaying participant avatars and names in tour lists.';

create policy "users can update their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================================
-- RLS POLICIES: TOURS
-- ============================================================================

create policy "users can view tours they are a participant in" on public.tours
  for select using (exists (select 1 from participants where tour_id = tours.id and user_id = auth.uid()));

create policy "authenticated users can create tours" on public.tours
  for insert with check (auth.role() = 'authenticated');

create policy "tour owners can update their tours" on public.tours
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "tour owners can delete their tours" on public.tours
  for delete using (owner_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: PARTICIPANTS
-- ============================================================================

create policy "users can view participants of tours they are in" on public.participants
  for select using (public.is_participant(tour_id, auth.uid()));

create policy "tour owners can add new participants" on public.participants
  for insert with check (exists (select 1 from tours where id = participants.tour_id and owner_id = auth.uid()));

create policy "users can leave tours, and owners can remove participants" on public.participants
  for delete using (user_id = auth.uid() or exists (select 1 from tours where id = participants.tour_id and owner_id = auth.uid()));

-- ============================================================================
-- RLS POLICIES: COMMENTS
-- ============================================================================

create policy "users can read comments on tours they are a participant in" on public.comments
  for select using (exists (select 1 from participants where tour_id = comments.tour_id and user_id = auth.uid()));

create policy "users can create comments on tours they are a participant in" on public.comments
  for insert with check (exists (select 1 from participants where tour_id = comments.tour_id and user_id = auth.uid()));

create policy "users can only update their own comments" on public.comments
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users can only delete their own comments" on public.comments
  for delete using (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: VOTES
-- ============================================================================

create policy "users can view votes on tours they are a participant in" on public.votes
  for select using (exists (select 1 from participants where tour_id = votes.tour_id and user_id = auth.uid()));

create policy "users can vote on tours they participate in" on public.votes
  for insert with check (
    exists (select 1 from participants where tour_id = votes.tour_id and user_id = auth.uid()) and
    not (select are_votes_hidden from tours where id = votes.tour_id)
  );

create policy "users can remove their own vote" on public.votes
  for delete using (
    user_id = auth.uid() and
    not (select are_votes_hidden from tours where id = votes.tour_id)
  );

-- ============================================================================
-- RLS POLICIES: INVITATIONS
-- ============================================================================

create policy "invited users can view their invitations"
  on public.invitations
  for select
  using (
    auth.uid() is not null
    and email = auth.email()
  );

comment on policy "invited users can view their invitations" on public.invitations is
  E'SECURITY MODEL: Invited Users Can View Their Invitations. Allows authenticated users to view invitations sent to their email address.';

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
  E'SECURITY MODEL: Tour Owners Can View All Tour Invitations. Allows tour owners to view all invitations for tours they own.';

create policy "users can invite others to tours they own" on public.invitations
  for insert with check (inviter_id = auth.uid() and exists(select 1 from tours where id = invitations.tour_id and owner_id = auth.uid()));

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

create policy "users can delete invitations for tours they own" on public.invitations
  for delete using (exists(select 1 from tours where id = invitations.tour_id and owner_id = auth.uid()));

-- ============================================================================
-- RLS POLICIES: TAGS
-- ============================================================================

create policy "authenticated users can view tags" on public.tags
  for select using (auth.role() = 'authenticated');

-- ============================================================================
-- RLS POLICIES: TOUR_TAGS
-- ============================================================================

create policy "users can view tags for tours they participated in" on public.tour_tags
  for select using (exists (select 1 from participants where tour_id = tour_tags.tour_id and user_id = auth.uid()));

create policy "users can add tags to archived tours they participated in" on public.tour_tags
  for insert with check (
    exists (select 1 from participants where tour_id = tour_tags.tour_id and user_id = auth.uid()) and
    exists (select 1 from tours where id = tour_tags.tour_id and status = 'archived')
  );

-- ============================================================================
-- RLS POLICIES: TOUR_ACTIVITY
-- ============================================================================

create policy "Users can view own activity records"
  on public.tour_activity
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own activity records"
  on public.tour_activity
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own activity records"
  on public.tour_activity
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES: OTP TABLES (service role only)
-- ============================================================================

create policy "Service role only" on public.invitation_otp
  for all
  to authenticated
  using (false);

create policy "Service role only" on public.auth_otp
  for all
  to authenticated
  using (false);

-- ============================================================================
-- STORAGE: AVATARS BUCKET
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Anyone can view avatars"
on storage.objects for select
to public
using (bucket_id = 'avatars');

commit;
