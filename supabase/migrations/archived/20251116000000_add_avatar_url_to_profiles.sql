-- migration: 20251116000000_add_avatar_url_to_profiles.sql
-- description: Add avatar_url field to profiles table for user avatars

begin;

-- Add avatar_url column to profiles table
alter table public.profiles
add column avatar_url text;

comment on column public.profiles.avatar_url is 'URL to the user''s avatar image stored in Supabase Storage';

commit;
