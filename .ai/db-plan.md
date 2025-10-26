# Database Schema: Tour Planner

This document outlines the PostgreSQL database schema for the Tour Planner application, designed for use with Supabase.

## 1. Tables

### `public.profiles`

This table is managed by Supabase Aut
Stores user profile information, extending the `auth.users` table.

| Column                 | Type          | Constraints                                                                                         | Description                                                      |
| :--------------------- | :------------ | :-------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| `id`                   | `uuid`        | Primary Key, Foreign Key to `auth.users.id`                                                         | References the user in Supabase's auth system.                   |
| `display_name`         | `text`        |                                                                                                     | Optional display name (full name).                               |
| `language`             | `text`        | Not Null, Default `'en'`                                                                            | User's preferred language.                                       |
| `theme`                | `text`        | Not Null, Default `'system'`                                                                        | User's preferred theme (e.g., 'light', 'dark', 'system').        |
| `onboarding_completed` | `boolean`     | Not Null, Default `false`                                                                           | Tracks if the user has completed the initial onboarding.         |
| `created_at`           | `timestamptz` | Not Null, Default `now()`                                                                           | Timestamp of profile creation.                                   |
| `updated_at`           | `timestamptz` | Not Null, Default `now()`                                                                           | Timestamp of the last profile update.                            |

---

### `public.tours`

Contains all information about a tour.

| Column              | Type          | Constraints                                   | Description                                            |
| :------------------ | :------------ | :-------------------------------------------- | :----------------------------------------------------- |
| `id`                | `uuid`        | Primary Key, Default `gen_random_uuid()`      | Unique identifier for the tour.                        |
| `owner_id`          | `uuid`        | Not Null, Foreign Key to `public.profiles.id` | The user who owns/created the tour.                    |
| `title`             | `text`        | Not Null, CHECK `(length(title) > 0)`         | The title of the tour.                                 |
| `destination`       | `text`        | Not Null, CHECK `(length(destination) > 0)`   | The destination of the tour (can be a URL).            |
| `description`       | `text`        |                                               | A detailed description of the tour.                    |
| `start_date`        | `timestamptz` | Not Null                                      | The start date and time of the tour.                   |
| `end_date`          | `timestamptz` | Not Null                                      | The end date and time of the tour.                     |
| `participant_limit` | `integer`     | CHECK `(participant_limit > 0)`               | Optional limit on the number of participants.          |
| `like_threshold`    | `integer`     | CHECK `(like_threshold > 0)`                  | Optional number of "likes" to confirm the tour.        |
| `are_votes_hidden`  | `boolean`     | Not Null, Default `false`                     | If true, voting is disabled by the owner.              |
| `status`            | `tour_status` | Not Null, Default `'active'`                  | The status of the tour. `ENUM ('active', 'archived')`. |
| `created_at`        | `timestamptz` | Not Null, Default `now()`                     | Timestamp of tour creation.                            |
| `updated_at`        | `timestamptz` | Not Null, Default `now()`                     | Timestamp of the last tour update.                     |

---

### `public.participants`

A joining table for the many-to-many relationship between `profiles` and `tours`.

| Column      | Type          | Constraints                                                        | Description                              |
| :---------- | :------------ | :----------------------------------------------------------------- | :--------------------------------------- |
| `tour_id`   | `uuid`        | Primary Key, Foreign Key to `public.tours.id` ON DELETE CASCADE    | The tour the user is participating in.   |
| `user_id`   | `uuid`        | Primary Key, Foreign Key to `public.profiles.id` ON DELETE CASCADE | The user participating in the tour.      |
| `joined_at` | `timestamptz` | Not Null, Default `now()`                                          | Timestamp when the user joined the tour. |

---

### `public.comments`

Stores comments made by users on tours.

| Column       | Type          | Constraints                                                                                                           | Description                                                                  |
| :----------- | :------------ | :-------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| `id`         | `uuid`        | Primary Key, Default `gen_random_uuid()`                                                                              | Unique identifier for the comment.                                           |
| `tour_id`    | `uuid`        | Not Null, Foreign Key to `public.tours.id` ON DELETE CASCADE                                                          | The tour the comment belongs to.                                             |
| `user_id`    | `uuid`        | Not Null, Foreign Key to `public.profiles.id` ON DELETE SET DEFAULT, Default `'00000000-0000-0000-0000-000000000000'` | The user who wrote the comment. Defaults to the anonymized user on deletion. |
| `content`    | `text`        | Not Null, CHECK `(length(content) > 0)`                                                                               | The text content of the comment.                                             |
| `created_at` | `timestamptz` | Not Null, Default `now()`                                                                                             | Timestamp of comment creation.                                               |
| `updated_at` | `timestamptz` | Not Null, Default `now()`                                                                                             | Timestamp of the last comment update.                                        |

---

### `public.votes`

Stores "likes" from users for a specific tour.

| Column       | Type          | Constraints                                                        | Description              |
| :----------- | :------------ | :----------------------------------------------------------------- | :----------------------- |
| `tour_id`    | `uuid`        | Primary Key, Foreign Key to `public.tours.id` ON DELETE CASCADE    | The tour being voted on. |
| `user_id`    | `uuid`        | Primary Key, Foreign Key to `public.profiles.id` ON DELETE CASCADE | The user who voted.      |
| `created_at` | `timestamptz` | Not Null, Default `now()`                                          | Timestamp of the vote.   |

---

### `public.invitations`

Tracks invitations sent to users to join a tour.

| Column       | Type                | Constraints                                                     | Description                                                               |
| :----------- | :------------------ | :-------------------------------------------------------------- | :------------------------------------------------------------------------ |
| `id`         | `uuid`              | Primary Key, Default `gen_random_uuid()`                        | Unique identifier for the invitation.                                     |
| `tour_id`    | `uuid`              | Not Null, Foreign Key to `public.tours.id` ON DELETE CASCADE    | The tour the invitation is for.                                           |
| `inviter_id` | `uuid`              | Not Null, Foreign Key to `public.profiles.id` ON DELETE CASCADE | The user who sent the invitation.                                         |
| `email`      | `text`              | Not Null                                                        | The email address of the invited person.                                  |
| `status`     | `invitation_status` | Not Null, Default `'pending'`                                   | The status of the invitation. `ENUM ('pending', 'accepted', 'declined')`. |
| `created_at` | `timestamptz`       | Not Null, Default `now()`                                       | Timestamp of invitation creation.                                         |

---

### `public.tags`

Stores unique tags for categorizing archived tours.

| Column | Type     | Constraints                                  | Description                    |
| :----- | :------- | :------------------------------------------- | :----------------------------- |
| `id`   | `bigint` | Primary Key (generated)                      | Unique identifier for the tag. |
| `name` | `text`   | Not Null, Unique, CHECK `(length(name) > 0)` | The unique tag name.           |

---

### `public.tour_tags`

A joining table for the many-to-many relationship between `tours` and `tags`.

| Column    | Type     | Constraints                                                     | Description            |
| :-------- | :------- | :-------------------------------------------------------------- | :--------------------- |
| `tour_id` | `uuid`   | Primary Key, Foreign Key to `public.tours.id` ON DELETE CASCADE | The tour being tagged. |
| `tag_id`  | `bigint` | Primary Key, Foreign Key to `public.tags.id` ON DELETE CASCADE  | The tag being applied. |

## 2. Relationships

- **Users and Profiles (`auth.users` & `profiles`)**: A one-to-one relationship. Each user in `auth.users` has exactly one corresponding record in `public.profiles`.
- **Profiles and Tours (`profiles` & `tours`)**: A one-to-many relationship where one user (profile) can be the `owner` of many tours.
- **Profiles and Participants (`profiles` & `participants`)**: A one-to-many relationship. A user can be a participant in many tours.
- **Tours and Participants (`tours` & `participants`)**: A one-to-many relationship. A tour can have many participants.
- **Tours and Comments (`tours` & `comments`)**: A one-to-many relationship. A tour can have many comments.
- **Profiles and Comments (`profiles` & `comments`)**: A one-to-many relationship. A user can write many comments.
- **Tours and Votes (`tours` & `votes`)**: A one-to-many relationship. A tour can have many votes.
- **Profiles and Votes (`profiles` & `votes`)**: A one-to-many relationship. A user can cast many votes (but only one per tour).
- **Tours and Tags (`tours`, `tags`, `tour_tags`)**: A many-to-many relationship. A tour can have multiple tags, and a tag can be applied to multiple tours.

## 3. Indexes

- `CREATE INDEX ON public.participants (user_id);` - To quickly fetch all tours a user is participating in.
- `CREATE INDEX ON public.comments (tour_id, created_at DESC);` - To efficiently retrieve comments for a tour in reverse chronological order.
- `CREATE INDEX ON public.tour_tags (tag_id);` - To quickly find all tours associated with a specific tag.
- `CREATE INDEX ON public.invitations (tour_id, email);` - To check for existing invitations for a specific tour and email.
- `CREATE INDEX idx_tours_status ON public.tours (status);` - To optimize filtering by tour status (active/archived).
- `CREATE INDEX idx_tours_owner_id ON public.tours (owner_id);` - To improve RLS policy checks and owner lookups.

## 4. Row-Level Security (RLS) Policies

RLS is enabled on all tables to ensure data privacy and security.

- **`profiles`**:
  - `SELECT`: Users can view their own profile.
  - `UPDATE`: Users can update their own profile.
- **`tours`**:
  - `SELECT`: Users can view tours they are a participant in.
  - `INSERT`: Any authenticated user can create a tour.
  - `UPDATE`: Only the owner of the tour can update it.
  - `DELETE`: Only the owner of the tour can delete it.
- **`participants`**:
  - `SELECT`: Users can view the participant list for tours they are also a participant in.
    - **Implementation Note**: Uses a helper function `public.is_participant(tour_id, user_id)` with `SECURITY DEFINER` to avoid RLS recursion issues.
  - `INSERT`: Only the tour owner can add new participants.
  - `DELETE`: Users can remove themselves from a tour. The tour owner can remove any other participant.
- **`comments`**:
  - `SELECT`: Users can read comments on tours they are a participant in.
  - `INSERT`: Users can create comments on tours they are a participant in.
  - `UPDATE`: Users can only update their own comments.
  - `DELETE`: Users can only delete their own comments.
- **`votes`**:
  - `SELECT`: Users can view votes on tours they are a participant in.
  - `INSERT`: Users can vote on tours they participate in, provided voting is not hidden.
  - `DELETE`: Users can remove their own vote, provided voting is not hidden.
- **`invitations`**:
  - `SELECT`: Users can see invitations for tours they own.
  - `INSERT`: Users can invite others to tours they own.
  - `DELETE`: Users can delete invitations for tours they own.
- **`tags` & `tour_tags`**:
  - `SELECT`: Authenticated users can view tags. Users can view tour_tags for tours they participated in.
  - `INSERT`: Users can add tags to archived tours they were a participant in.

## 5. Additional Considerations & Automation

### Implemented Features

- **Anonymized User**: A special, protected record is created in the `profiles` table with a fixed UUID (`00000000-0000-0000-0000-000000000000`) to represent a deleted user. This allows for the anonymization of comments while maintaining data integrity.
  - **Implementation Note**: The foreign key constraint from `public.profiles.id` to `auth.users.id` has been omitted to allow for this special record. Data integrity for regular users is maintained by the profile creation mechanism.

- **Automatic Profile Creation via Webhook**: Profile creation is now handled by a Supabase Database Webhook instead of a database trigger for improved reliability and error handling.
  - **Webhook Endpoint**: `/api/webhooks/profile-creation`
  - **Security**: Protected by `SUPABASE_WEBHOOK_SECRET` (minimum 32 characters)
  - **Trigger**: Activated on INSERT events in `auth.users` table
  - **Benefits**: Better error handling, logging, and can handle duplicate profile creation gracefully
  - **Migration**: The original database trigger (`on_auth_user_created`) has been removed in migration `20251024000000_remove_profile_creation_trigger.sql`

- **User Deletion Logic**: A database trigger function on user deletion handles complex cleanup:
  - If the user is a tour owner, ownership is transferred to the next participant based on the `joined_at` timestamp.
  - If the user is the sole participant, the tour is deleted.
  - User's comments are reassigned to the "Anonymized User" (via `ON DELETE SET DEFAULT`).
  - Participation and vote records are deleted automatically (via `ON DELETE CASCADE`).
  - Invitations are deleted automatically (via `ON DELETE CASCADE`).

- **RLS Helper Functions**:
  - `public.is_participant(tour_id, user_id)`: A `SECURITY DEFINER` function to check participant status without causing RLS recursion issues.

### Planned Features (Not Yet Implemented)

- **Automatic Archiving**: A `pg_cron` job to run daily and scan for tours where `end_date` has passed, updating their `status` to `'archived'`.
- **Invitation Cleanup**: A `pg_cron` job to run periodically and delete old, `pending` invitations to keep the `invitations` table clean.

## 6. Implementation Status

### Completed Migrations

1. **`20251014100000_initial_schema.sql`**:
   - Created all tables with RLS enabled
   - Set up initial RLS policies
   - Created basic indexes
   - Implemented user deletion trigger
   - Created anonymized user profile
   - ~~Created profile creation trigger~~ (later removed)

2. **`20251021204500_fix_participants_rls.sql`**:
   - Added `public.is_participant()` helper function
   - Fixed participants table RLS policy to prevent recursion

3. **`20251024000000_remove_profile_creation_trigger.sql`**:
   - Removed database trigger for profile creation
   - Profile creation now handled by Supabase Database Webhook

4. **`20251024000001_add_performance_indexes.sql`**:
   - Added index on `tours.status` for filtering
   - Added index on `tours.owner_id` for RLS policies

### Environment Configuration

The following environment variables are required:

- `SUPABASE_URL`: Supabase project URL (server-side)
- `SUPABASE_SERVICE_ROLE_KEY`: Admin key for webhook operations (server-side, secret)
- `SUPABASE_WEBHOOK_SECRET`: Secret for webhook authentication (minimum 32 characters, server-side, secret)
- `PUBLIC_SUPABASE_URL`: Supabase project URL (client-side)
- `PUBLIC_SUPABASE_ANON_KEY`: Anonymous key for client operations (client-side)
