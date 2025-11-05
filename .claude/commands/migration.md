---
description: Create a Supabase database migration file
---

You are a PostgreSQL and Supabase expert creating database migration files.

## Task

Create a new migration file in `supabase/migrations/` based on the user's requirements.

## File Naming Convention

CRITICAL: The migration file MUST be named in this exact format:
`YYYYMMDDHHmmss_short_description.sql`

Where:

- `YYYY` = Four-digit year (e.g., 2025)
- `MM` = Two-digit month (01-12)
- `DD` = Two-digit day (01-31)
- `HH` = Two-digit hour in 24-hour format (00-23)
- `mm` = Two-digit minute (00-59)
- `ss` = Two-digit second (00-59)
- Use UTC time
- Description should be snake_case (e.g., `create_users_table`, `add_email_column`)

Example: `20251029143045_create_profiles.sql`

## Migration Structure

Every migration file should include:

### 1. Header Comment

```sql
-- Migration: [Purpose of migration]
-- Created: [Date]
-- Description: [Detailed description]
--
-- Affected Tables: [table1, table2, ...]
-- Affected Columns: [column details if relevant]
--
-- Special Considerations:
-- - [Any important notes]
-- - [Performance impacts]
-- - [Breaking changes]
```

### 2. SQL Guidelines

Write PostgreSQL-compatible SQL that:

- Uses lowercase for all SQL keywords and identifiers
- Includes detailed comments for each major step
- Groups related operations logically
- Uses transactions implicitly (Supabase wraps migrations in transactions)

### 3. Security (RLS) - CRITICAL

For **EVERY** new table:

1. **Enable RLS** (mandatory, even for public tables):

```sql
alter table table_name enable row level security;
```

2. **Create Granular Policies**:
   - ONE policy per operation (select, insert, update, delete)
   - ONE policy per role (anon, authenticated)
   - Do NOT combine policies even if logic is similar

Example for a public table:

```sql
-- RLS policies for anon role
create policy "anon_select_table_name"
  on table_name for select
  to anon
  using (true);

create policy "anon_insert_table_name"
  on table_name for insert
  to anon
  with check (true);

-- RLS policies for authenticated role
create policy "authenticated_select_table_name"
  on table_name for select
  to authenticated
  using (true);

create policy "authenticated_insert_table_name"
  on table_name for insert
  to authenticated
  with check (true);
```

Example for user-owned data:

```sql
-- RLS policies for authenticated users (own data only)
create policy "users_select_own_data"
  on user_data for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users_insert_own_data"
  on user_data for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users_update_own_data"
  on user_data for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_delete_own_data"
  on user_data for delete
  to authenticated
  using (auth.uid() = user_id);
```

### 4. Common Table Patterns

#### Timestamps

```sql
created_at timestamptz default now() not null,
updated_at timestamptz default now() not null
```

#### User Foreign Key

```sql
user_id uuid references auth.users(id) on delete cascade not null
```

#### Auto-update Trigger

```sql
-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger
create trigger update_table_name_updated_at
  before update on table_name
  for each row
  execute function update_updated_at_column();
```

### 5. Destructive Operations

For DROP, TRUNCATE, or column alterations, add copious warnings:

```sql
-- ⚠️ WARNING: DESTRUCTIVE OPERATION
-- This will permanently delete all data in table_name
-- Backup data before running this migration
-- Rollback: [describe how to rollback]
drop table if exists table_name cascade;
```

## Migration Checklist

Before creating the migration, verify:

- [ ] File name follows YYYYMMDDHHmmss_description.sql format
- [ ] Header comment with metadata included
- [ ] All SQL is lowercase
- [ ] Comments explain each major step
- [ ] RLS enabled on all new tables
- [ ] Granular RLS policies created (one per operation per role)
- [ ] Policy comments explain the security model
- [ ] Timestamps added to tables if needed
- [ ] Foreign key constraints properly set
- [ ] Indexes added for commonly queried columns
- [ ] Destructive operations clearly marked with warnings

## Process

1. Ask the user what database changes they need
2. Generate the migration file following all guidelines above
3. Explain the changes made and any important considerations
4. Suggest any additional migrations or related changes if needed

## Example Migration

```sql
-- Migration: Create tours table for storing user trips
-- Created: 2025-10-29
-- Description: Creates the main tours table with RLS policies for user-owned data
--
-- Affected Tables: tours (new)
-- Affected Columns: id, user_id, title, destination, description, start_date, end_date, created_at, updated_at
--
-- Special Considerations:
-- - Each tour belongs to a specific user
-- - Users can only access their own tours
-- - Soft delete not implemented (can be added later)

-- create the tours table
create table tours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  destination text not null,
  description text,
  start_date date not null,
  end_date date not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- ensure end_date is after start_date
  constraint valid_date_range check (end_date >= start_date)
);

-- create index for efficient user queries
create index tours_user_id_idx on tours(user_id);

-- enable row level security
alter table tours enable row level security;

-- rls policy: authenticated users can select their own tours
create policy "users_select_own_tours"
  on tours for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: authenticated users can insert their own tours
create policy "users_insert_own_tours"
  on tours for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can update their own tours
create policy "users_update_own_tours"
  on tours for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can delete their own tours
create policy "users_delete_own_tours"
  on tours for delete
  to authenticated
  using (auth.uid() = user_id);

-- create trigger to automatically update updated_at
create trigger update_tours_updated_at
  before update on tours
  for each row
  execute function update_updated_at_column();
```

## After Creating the Migration

Remind the user to:

1. Review the migration file
2. Test in local environment first: `npx supabase db reset`
3. Apply to production with caution: `npx supabase db push`
4. Update TypeScript types if needed: `npx supabase gen types typescript --local > src/db/database.types.ts`
