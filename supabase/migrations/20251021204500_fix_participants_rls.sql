-- migration: 20251021204500_fix_participants_rls.sql
-- description: Fixes infinite recursion in the RLS policy for the participants table.

begin;

-- function to check if a user is a participant in a tour.
-- this function uses security definer to bypass rls and avoid recursion.
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

-- drop the old policy
drop policy if exists "users can view participants of tours they are in" on public.participants;

-- create the new policy using the function
create policy "users can view participants of tours they are in"
on public.participants
for select using (public.is_participant(tour_id, auth.uid()));

commit;
