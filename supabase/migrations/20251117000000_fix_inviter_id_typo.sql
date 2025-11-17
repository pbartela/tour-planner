-- migration: 20251117000000_fix_inviter_id_typo.sql
-- description: Fix typo in invitations table - rename sinviter_id to inviter_id

begin;

-- Check if the typo column exists, and if so, fix it
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
    and table_name = 'invitations'
    and column_name = 'sinviter_id'
  ) then
    -- Rename the column
    alter table public.invitations rename column sinviter_id to inviter_id;
    raise notice 'Renamed sinviter_id to inviter_id';
  else
    raise notice 'Column sinviter_id does not exist, skipping rename';
  end if;
end $$;

commit;
