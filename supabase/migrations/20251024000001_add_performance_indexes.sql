-- migration: 20251024000001_add_performance_indexes.sql
-- description: adds missing database indexes for performance optimization
-- this migration includes:
--   - index on tours.status for faster filtering by tour status
--   - index on tours.owner_id for faster owner lookups and RLS policy checks

begin;

-- Index on tours.status
-- Used by getUserTours query to filter by status (active/archived)
-- Improves performance of queries like: WHERE status = 'active'
create index if not exists idx_tours_status on public.tours (status);

-- Index on tours.owner_id
-- Used frequently in RLS policies and ownership checks
-- Improves performance of queries like: WHERE owner_id = auth.uid()
create index if not exists idx_tours_owner_id on public.tours (owner_id);

commit;
