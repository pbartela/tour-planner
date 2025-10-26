-- migration: 20251026130516_cleanup_unconfirmed_users.sql
-- description: Creates a function and scheduled job to clean up unconfirmed users
--              Deletes auth.users records that were created but never confirmed via magic link
--              Runs daily to prevent database bloat from abandoned signup attempts

begin;

-- Create function to clean up unconfirmed users older than 24 hours
-- Note: Function is in public schema because we don't have permission to create in auth schema
create or replace function public.cleanup_unconfirmed_users()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  -- Delete users who:
  -- 1. Have not confirmed their email (confirmed_at IS NULL)
  -- 2. Were created more than 24 hours ago
  -- Note: This will also cascade delete to public.profiles due to ON DELETE CASCADE
  delete from auth.users
  where confirmed_at is null
    and created_at < now() - interval '24 hours';

  -- Get the number of deleted rows
  get diagnostics deleted_count = row_count;

  -- Log the cleanup operation
  if deleted_count > 0 then
    raise notice 'Cleaned up % unconfirmed user(s)', deleted_count;
  end if;
end;
$$;

-- Grant execute permission to postgres role
grant execute on function public.cleanup_unconfirmed_users() to postgres;

-- Comment on the function
comment on function public.cleanup_unconfirmed_users() is
  'Deletes unconfirmed users older than 24 hours to prevent database bloat from abandoned signups';

-- Note: Automated scheduling using pg_cron
-- To enable automated cleanup, you need to:
-- 1. Enable pg_cron extension in Supabase dashboard (Database > Extensions)
-- 2. Run the following SQL to schedule daily cleanup at 2 AM UTC:
--
-- select cron.schedule(
--   'cleanup-unconfirmed-users',
--   '0 2 * * *',  -- Run at 2 AM UTC every day
--   $$select public.cleanup_unconfirmed_users()$$
-- );
--
-- To verify the scheduled job:
-- select * from cron.job where jobname = 'cleanup-unconfirmed-users';
--
-- To manually run the cleanup (for testing):
-- select public.cleanup_unconfirmed_users();
--
-- To unschedule (if needed):
-- select cron.unschedule('cleanup-unconfirmed-users');

commit;
