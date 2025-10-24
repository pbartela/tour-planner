-- migration: 20251024000000_remove_profile_creation_trigger.sql
-- description: Removes the database trigger for profile creation on auth.users
--              Profile creation is now handled by a Supabase Database Webhook
--              which is more reliable and provides better error handling.

begin;

-- Drop the trigger first
drop trigger if exists on_auth_user_created on auth.users;

-- Drop the function (only if no other triggers are using it)
drop function if exists public.handle_new_user();

commit;
