# Database Migration Rollback Guide

This guide provides instructions for safely rolling back database migrations in the Plan Tour application.

## Table of Contents

- [Overview](#overview)
- [Important Safety Notes](#important-safety-notes)
- [Rollback Methods](#rollback-methods)
- [Migration-Specific Rollback Instructions](#migration-specific-rollback-instructions)
- [Emergency Rollback Procedures](#emergency-rollback-procedures)
- [Best Practices](#best-practices)

## Overview

Database migrations are changes to the database schema that are tracked and versioned. Rolling back migrations should be done carefully to avoid data loss and ensure application consistency.

### When to Rollback

- A migration introduced a critical bug in production
- Data corruption occurred due to a migration
- Application is incompatible with the new schema
- Testing revealed issues after deployment

### When NOT to Rollback

- Data has already been written using the new schema
- Other dependent migrations have been applied
- Multiple instances are running with different schemas
- The issue can be fixed with a forward migration instead

## Important Safety Notes

⚠️ **ALWAYS backup your database before performing a rollback!**

```bash
# For local development
npx supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql

# For production (requires appropriate permissions)
pg_dump -h <host> -U <user> -d <database> > backup_$(date +%Y%m%d_%H%M%S).sql
```

⚠️ **Test rollbacks in a staging environment first**

⚠️ **Coordinate with your team before rolling back in production**

⚠️ **Check for data that depends on the schema changes being rolled back**

## Rollback Methods

### Method 1: Using Supabase CLI (Recommended for Development)

The Supabase CLI provides a built-in way to manage migrations, but it doesn't have a direct rollback command. Instead, you need to reset the database to a specific migration.

```bash
# 1. List all migrations to identify the target
npx supabase migration list

# 2. Reset database to a specific migration (DESTRUCTIVE - all data will be lost)
npx supabase db reset

# 3. Apply migrations up to the desired point
# This requires temporarily moving or renaming unwanted migrations
```

**Warning**: `db reset` is destructive and will erase all data. Only use in development!

### Method 2: Manual Rollback with SQL (Recommended for Production)

Create a rollback migration that reverses the changes:

```bash
# Create a new migration for the rollback
npx supabase migration new rollback_<original_migration_name>

# Edit the new migration file to include rollback SQL
# See migration-specific instructions below
```

Apply the rollback migration:

```bash
# For local development
npx supabase migration up

# For production (via Supabase Dashboard)
# Upload and run the rollback migration through the SQL Editor
```

### Method 3: Direct SQL Rollback (Emergency Only)

If you need immediate rollback without creating a migration file:

```bash
# Connect to the database
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres

# Run rollback SQL directly (see migration-specific instructions)
```

For production, use the Supabase Dashboard SQL Editor.

## Migration-Specific Rollback Instructions

### 20251014100000_initial_schema.sql

**Changes**: Creates initial database schema including tours, profiles, votes, comments, and invitations tables.

**Rollback SQL**:
```sql
-- WARNING: This will delete ALL data in the application!
-- Only use in development or if you're absolutely certain

DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.tour_participants CASCADE;
DROP TABLE IF EXISTS public.tours CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS tour_status;
DROP TYPE IF EXISTS invitation_status;
```

**Impact**: Complete data loss. Cannot be rolled back safely in production if any data exists.

**Alternative**: Don't rollback. Fix issues with forward migrations instead.

---

### 20251102184243_add_invitation_token_expiry.sql

**Changes**: Adds `token_expires_at` column to invitations table and updates invitation token generation.

**Rollback SQL**:
```sql
-- Remove the token_expires_at column
ALTER TABLE public.invitations
DROP COLUMN IF EXISTS token_expires_at;

-- If the migration modified the invitation token generation function,
-- restore the original function (check the migration file for details)
```

**Impact**:
- Low risk if no invitations have been created with expiry tokens
- Existing invitations with `token_expires_at` will lose that data
- May need to regenerate invitation tokens

**Data Check Before Rollback**:
```sql
-- Check if any invitations have expiry data
SELECT COUNT(*) FROM public.invitations WHERE token_expires_at IS NOT NULL;
```

---

### 20251103100000_add_decline_invitation.sql

**Changes**: Adds "declined" status to invitation_status enum and updates related policies/functions.

**Rollback SQL**:
```sql
-- WARNING: Rolling back enum changes is complex and requires special handling

-- Step 1: Check if any invitations are in 'declined' status
SELECT COUNT(*) FROM public.invitations WHERE status = 'declined';
-- If count > 0, update or delete those records first!

-- Step 2: Create a new enum without 'declined'
CREATE TYPE invitation_status_new AS ENUM ('pending', 'accepted');

-- Step 3: Update the invitations table to use the new enum
ALTER TABLE public.invitations
ALTER COLUMN status TYPE invitation_status_new
USING status::text::invitation_status_new;

-- Step 4: Drop the old enum and rename the new one
DROP TYPE invitation_status;
ALTER TYPE invitation_status_new RENAME TO invitation_status;

-- Step 5: If any policies or functions reference 'declined', update them
-- (Check migration file for specific policy/function changes)
```

**Impact**:
- High risk if any invitations have been declined
- Cannot rollback if declined invitations exist without data loss
- RLS policies may need adjustment

**Data Check Before Rollback**:
```sql
-- Check for declined invitations
SELECT id, email, tour_id, status
FROM public.invitations
WHERE status = 'declined';

-- If records exist, decide whether to:
-- 1. Convert declined to pending: UPDATE invitations SET status = 'pending' WHERE status = 'declined';
-- 2. Delete them: DELETE FROM invitations WHERE status = 'declined';
-- 3. Don't rollback this migration
```

---

### 20251103211124_add_invitation_update_policy.sql

**Changes**: Adds or modifies RLS policies for updating invitations.

**Rollback SQL**:
```sql
-- Drop the added policy
DROP POLICY IF EXISTS "Users can update their own invitations" ON public.invitations;

-- If the migration modified existing policies, restore them
-- (Check the migration file for the original policy definitions)
```

**Impact**:
- Low risk - only affects permissions
- Users won't be able to update invitations after rollback
- No data loss

**Alternative**: Usually safer to fix policy issues with a forward migration

---

## Emergency Rollback Procedures

### Production Emergency Rollback

1. **Assess the Situation**
   - What is broken?
   - Is data being corrupted?
   - Can it wait for a proper fix?

2. **Immediate Response**
   ```bash
   # Put application in maintenance mode if possible
   # This prevents new data from being written

   # Create database backup
   pg_dump [connection-string] > emergency_backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Execute Rollback**
   - Use Supabase Dashboard SQL Editor
   - Run the rollback SQL from migration-specific instructions
   - Monitor for errors

4. **Verify**
   ```sql
   -- Check table structure
   \d+ table_name

   -- Check data integrity
   SELECT COUNT(*) FROM critical_tables;

   -- Test critical queries
   ```

5. **Deploy Application Update**
   - Ensure application code is compatible with rolled-back schema
   - May need to deploy previous application version

6. **Post-Rollback**
   - Document what happened
   - Create incident report
   - Fix the issue and create a new forward migration

### Development Quick Reset

For development environments, the fastest way to rollback is to reset the entire database:

```bash
# Stop the local Supabase instance
npx supabase stop

# Remove the volume (all data will be lost)
docker volume rm supabase_db_data

# Start fresh
npx supabase start

# Migrations will be applied automatically
```

## Best Practices

### 1. Design Migrations to be Reversible

When creating migrations, always think about rollback:

```sql
-- Good: Can be easily reversed
ALTER TABLE tours ADD COLUMN new_field TEXT;
-- Rollback: ALTER TABLE tours DROP COLUMN new_field;

-- Bad: Hard to reverse
UPDATE tours SET destination = 'https://maps.google.com/place/' || destination;
-- Rollback: How do you remove the prefix reliably?
```

### 2. Use Transactional DDL When Possible

PostgreSQL supports transactional DDL, so wrap migrations in transactions:

```sql
BEGIN;

-- Your migration changes here

-- If anything fails, changes will be rolled back automatically
COMMIT;
```

### 3. Separate Schema and Data Changes

When possible, separate schema changes from data migrations:

```sql
-- Migration 1: Schema only
ALTER TABLE tours ADD COLUMN status TEXT DEFAULT 'draft';

-- Migration 2: Data migration
UPDATE tours SET status = 'active' WHERE start_date < NOW();
```

This makes rollback cleaner and less risky.

### 4. Test Migrations AND Rollbacks

Always test both directions:

```bash
# 1. Test applying the migration
npx supabase migration up

# 2. Test the application
npm run dev

# 3. Create and test the rollback migration
npx supabase migration new rollback_test
# Add rollback SQL
npx supabase migration up

# 4. Verify everything is back to the original state
```

### 5. Use Feature Flags

For application changes that depend on schema changes:

```typescript
// Instead of assuming the column exists
const status = tour.new_column; // May fail if rolled back

// Use feature flags
const status = featureFlags.newTourStatus
  ? tour.new_column
  : tour.old_column;
```

This allows the application to work with both old and new schemas during rollback.

### 6. Document Dependencies

In each migration file, add comments about dependencies:

```sql
-- Migration: 20251103100000_add_decline_invitation.sql
-- Dependencies:
--   - Requires 20251014100000_initial_schema.sql
--   - Required by: invitation acceptance flow in TourDetailsView.tsx
-- Rollback impact:
--   - Will break decline invitation feature
--   - Application must be updated to remove decline button
```

### 7. Version Compatibility Matrix

Maintain a matrix of compatible versions:

| Application Version | Migration Version | Compatible? |
|---------------------|-------------------|-------------|
| v1.0.0              | 20251014100000    | ✅          |
| v1.1.0              | 20251102184243    | ✅          |
| v1.1.0              | 20251014100000    | ⚠️ Degraded |
| v1.2.0              | 20251103100000    | ✅          |

## Additional Resources

- [Supabase Migrations Documentation](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL ALTER TABLE Documentation](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Best Practices for Database Migrations](https://www.postgresql.org/docs/current/ddl-alter.html)

## Support

If you encounter issues during rollback:

1. Check the [GitHub Issues](https://github.com/your-org/tour-planner/issues)
2. Contact the database team
3. Review application logs for schema-related errors
4. Consult with senior developers before proceeding

---

**Remember**: A rollback is a last resort. When in doubt, fix forward with a new migration instead of rolling back.
