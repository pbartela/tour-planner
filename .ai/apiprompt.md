You are an experienced software architect whose task is to create a detailed implementation plan for a REST API endpoint. Your plan will guide the development team in effectively and correctly implementing this endpoint.

Before we begin, review the following information:

1. Route API specification:
<route_api_specification>
REST API Plan

This document outlines the REST API for the Tour Planner application. The API is designed to be RESTful, using standard HTTP methods and status codes. All endpoints are prefixed with `/api`.

## 1. Resources

| Resource      | Description                                         | Database Table(s)                 |
| :------------ | :-------------------------------------------------- | :-------------------------------- |
| `Profile`     | Represents a user's profile information.            | `public.profiles`                 |
| `Tour`        | Represents a single tour or trip.                   | `public.tours`                    |
| `Participant` | Represents a user's participation in a tour.        | `public.participants`             |
| `Comment`     | Represents a comment made on a tour.                | `public.comments`                 |
| `Vote`        | Represents a "like" or vote on a tour.              | `public.votes`                    |
| `Invitation`  | Represents an invitation for a user to join a tour. | `public.invitations`              |
| `Tag`         | Represents a tag for categorizing tours.            | `public.tags`, `public.tour_tags` |

## 2. Endpoints

### Authentication

These endpoints handle user authentication via Supabase's magic link (OTP) flow.

---

#### Request Magic Link*

- **Method:** `POST`
- **URL:** `/api/auth/magic-link`
- **Description:** Initiates the login or registration process by sending a magic link to the user's email. The backend automatically detects if the user is new and triggers the appropriate sign-up or sign-in flow.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "redirectTo": "/optional-path-after-login"
  }
  ```
- **Response (Success):**
  - **Code:** `200 OK`
  - **Body:** `{}`
- **Response (Error):**
  - **Code:** `400 Bad Request` - Invalid email format.
  - **Code:** `429 Too Many Requests` - Rate limit exceeded.
  - **Code:** `500 Internal Server Error` - Failed to send email.

---

### Profiles

Endpoints for managing user profiles. The `me` keyword is used to refer to the currently authenticated user.

---

#### Get Current User's Profile

- **Method:** `GET`
- **URL:** `/api/profiles/me`
- **Description:** Retrieves the profile of the currently authenticated user.
- **Response (Success):**
  - **Code:** `200 OK`
  - **Body:**
    ```json
    {
      "id": "c3a4b1d2-..."
      "display_name": "Alex",
      "language": "en",
      "theme": "dark",
      "onboarding_completed": false,
      "created_at": "2025-10-15T10:00:00Z"
    }
    ```
- **Response (Error):**
  - **Code:** `401 Unauthorized` - User is not authenticated.
  - **Code:** `404 Not Found` - Profile not found for the user.

---

#### Update Current User's Profile

- **Method:** `PATCH`
- **URL:** `/api/profiles/me`
- **Description:** Updates the profile of the currently authenticated user. Also used to mark onboarding as complete.
- **Request Body:**
  ```json
  {
    "display_name": "Alex Johnson",
    "language": "pl",
    "theme": "system",
    "onboarding_completed": true
  }
  ```
- **Response (Success):**
  - **Code:** `200 OK`
  - **Body:** The updated profile object.
- **Response (Error):**
  - **Code:** `400 Bad Request` - Validation error.
  - **Code:** `401 Unauthorized` - User is not authenticated.

---

### Tours

Endpoints for managing tours.

---

#### Get Tours

- **Method:** `GET`
- **URL:** `/api/tours`
- **Description:** Retrieves a list of tours the current user is participating in.
- **Query Parameters:**
  - `status` (string, optional): Filter by status. `active` or `archived`. Defaults to `active`.
  - `page` (integer, optional): For pagination. Defaults to `1`.
  - `limit` (integer, optional): For pagination. Defaults to `20`.
- **Response (Success):**
  - **Code:** `200 OK`
  - **Body:**
    ```json
    {
      "data": [
        {
          "id": "f4b3c2a1-...",
          "title": "Mountain Hike",
          "destination": "The Alps",
          "start_date": "2026-07-10T08:00:00Z",
          "end_date": "2026-07-15T18:00:00Z",
          "status": "active"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 1
      }
    }
    ```
- **Response (Error):**
  - **Code:** `401 Unauthorized` - User is not authenticated.

---

#### Create a New Tour

- **Method:** `POST`
- **URL:** `/api/tours`
- **Description:** Creates a new tour. The creator is automatically set as the owner and a participant.
- **Request Body:**
  ```json
  {
    "title": "Beach Vacation",
    "destination": "Hawaii",
    "description": "A relaxing week on the sunny beaches.",
    "start_date": "2026-08-01T12:00:00Z",
    "end_date": "2026-08-08T12:00:00Z",
    "participant_limit": 10,
    "like_threshold": 5
  }
  ```
- **Response (Success):**
  - **Code:** `201 Created`
  - **Body:** The newly created tour object.
- **Response (Error):**
  - **Code:** `400 Bad Request` - Validation error.
  - **Code:** `401 Unauthorized` - User is not authenticated.

---

#### Get Tour Details

- **Method:** `GET`
- **URL:** `/api/tours/{tourId}`
- **Description:** Retrieves the full details of a specific tour.
- **Response (Success):**
  - **Code:** `200 OK`
  - **Body:**
    ```json
    {
      "id": "f4b3c2a1-...",
      "owner_id": "c3a4b1d2-...",
      "title": "Mountain Hike",
      "destination": "The Alps",
      "description": "A challenging but rewarding hike.",
      "start_date": "2026-07-10T08:00:00Z",
      "end_date": "2026-07-15T18:00:00Z",
      "participant_limit": 15,
      "like_threshold": 10,
      "are_votes_hidden": false,
      "status": "active",
      "created_at": "2025-10-16T10:00:00Z"
    }
    ```
- **Response (Error):**
  - **Code:** `401 Unauthorized` - User is not authenticated.
  - **Code:** `403 Forbidden` - User is not a participant of this tour.
  - **Code:** `404 Not Found` - Tour does not exist.

---

#### Update a Tour

- **Method:** `PATCH`
- **URL:** `/api/tours/{tourId}`
- **Description:** Updates the details of a tour. Can also be used by the owner to block/unblock voting. Only the tour owner can perform this action.
- **Request Body:**
  ```json
  {
    "title": "An Epic Mountain Hike",
    "are_votes_hidden": true
  }
  ```
- **Response (Success):**
  - **Code:** `200 OK`
  - **Body:** The updated tour object.
- **Response (Error):**
  - **Code:** `401 Unauthorized` - User is not authenticated.
  - **Code:** `403 Forbidden` - User is not the owner of the tour.
  - **Code:** `404 Not Found` - Tour does not exist.

---

#### Delete a Tour

- **Method:** `DELETE`
- **URL:** `/api/tours/{tourId}`
- **Description:** Deletes a tour. Only the tour owner can perform this action.
- **Response (Success):**
  - **Code:** `204 No Content`
- **Response (Error):**
  - **Code:** `401 Unauthorized` - User is not authenticated.
  - **Code:** `403 Forbidden` - User is not the owner of the tour.
  - **Code:** `404 Not Found` - Tour does not exist.

---

### Participants

Endpoints for managing tour participants.

---

#### Get Tour Participants

- **Method:** `GET`
- **URL:** `/api/tours/{tourId}/participants`
- **Description:** Retrieves the list of participants for a tour.
- **Response (Success):**
  - **Code:** `200 OK`
  - **Body:**
    ```json
    [
      {
        "user_id": "c3a4b1d2-...",
        "display_name": "Alex",
        "joined_at": "2025-10-16T10:00:00Z"
      }
    ]
    ```
- **Response (Error):**
  - **Code:** `403 Forbidden` - User is not a participant of this tour.
  - **Code:** `404 Not Found` - Tour does not exist.

---

#### Remove a Participant (Owner action)

- **Method:** `DELETE`
- **URL:** `/api/tours/{tourId}/participants/{userId}`
- **Description:** Removes a participant from a tour. Only the tour owner can perform this action. The owner cannot remove themselves.
- **Response (Success):**
  - **Code:** `204 No Content`
- **Response (Error):**
  - **Code:** `403 Forbidden` - User is not the owner or is trying to remove themselves.
  - **Code:** `404 Not Found` - Tour or participant does not exist.

---

#### Leave a Tour (Participant action)

- **Method:** `DELETE`
- **URL:** `/api/tours/{tourId}/participants/me`
- **Description:** Allows the authenticated user to leave a tour. A tour owner cannot leave a tour they own.
- **Response (Success):**
  - **Code:** `204 No Content`
- **Response (Error):**
  - **Code:** `403 Forbidden` - User is the owner and cannot leave.
  - **Code:** `404 Not Found` - Tour does not exist or user is not a participant.

---

### Invitations

Endpoints for managing invitations.

---

#### Invite Participants to a Tour

- **Method:** `POST`
- **URL:** `/api/tours/{tourId}/invitations`
- **Description:** Sends email invitations to join a tour. Only the tour owner can invite.
- **Request Body:**
  ```json
  {
    "emails": ["friend1@example.com", "friend2@example.com"]
  }
  ```
- **Response (Success):**
  - **Code:** `200 OK`
  - **Body:**
    ```json
    {
      "message": "Invitations sent successfully."
    }
    ```
- **Response (Error):**
  - **Code:** `400 Bad Request` - Invalid email list.
  - **Code:** `403 Forbidden` - User is not the owner of the tour.
  - **Code:** `404 Not Found` - Tour does not exist.

---

### Comments

Endpoints for managing comments on a tour.

---

#### Get Tour Comments

- **Method:** `GET`
- **URL:** `/api/tours/{tourId}/comments`
- **Description:** Retrieves all comments for a tour, sorted by creation date.
- **Query Parameters:**
  - `page` (integer, optional): For pagination. Defaults to `1`.
  - `limit` (integer, optional): For pagination. Defaults to `20`.
- **Response (Success):**
  - **Code:** `200 OK`
  - **Body:** A paginated list of comment objects.
    ```json
    {
      "data": [
        {
          "id": "e5d6c7b8-...",
          "user_id": "c3a4b1d2-...",
          "content": "Can't wait for this trip!",
          "created_at": "2025-10-17T11:00:00Z",
          "updated_at": "2025-10-17T11:00:00Z"
        }
      ],
      "pagination": { ... }
    }
    ```
- **Response (Error):**
  - **Code:** `403 Forbidden` - User is not a participant of the tour.
  - **Code:** `404 Not Found` - Tour not found.

---

#### Create a Comment

- **Method:** `POST`
- **URL:** `/api/tours/{tourId}/comments`
- **Description:** Adds a new comment to a tour.
- **Request Body:**
  ```json
  {
    "content": "Remember to pack warm clothes!"
  }
  ```
- **Response (Success):**
  - **Code:** `201 Created`
  - **Body:** The newly created comment object.
- **Response (Error):**
  - **Code:** `400 Bad Request` - Validation error (e.g., empty content).
  - **Code:** `403 Forbidden` - User is not a participant of the tour.

---

#### Update a Comment

- **Method:** `PATCH`
- **URL:** `/api/tours/{tourId}/comments/{commentId}`
- **Description:** Updates a comment. Users can only update their own comments.
- **Request Body:**
  ```json
  {
    "content": "Updated packing reminder!"
  }
  ```
- **Response (Success):**
  - **Code:** `200 OK`
  - **Body:** The updated comment object.
- **Response (Error):**
  - **Code:** `403 Forbidden` - User is not the author of the comment.
  - **Code:** `404 Not Found` - Comment or tour not found.

---

#### Delete a Comment

- **Method:** `DELETE`
- **URL:** `/api/tours/{tourId}/comments/{commentId}`
- **Description:** Deletes a comment. Users can only delete their own comments.
- **Response (Success):**
  - **Code:** `204 No Content`
- **Response (Error):**
  - **Code:** `403 Forbidden` - User is not the author of the comment.
  - **Code:** `404 Not Found` - Comment or tour not found.

---

### Votes

Endpoints for voting on a tour.

---

#### Get Tour Votes

- **Method:** `GET`
- **URL:** `/api/tours/{tourId}/votes`
- **Description:** Retrieves all votes for a tour.
- **Response (Success):**
  - **Code:** `200 OK`
  - **Body:**
    ```json
    {
      "count": 5,
      "users": ["c3a4b1d2-...", "d4e5f6a7-..."]
    }
    ```
- **Response (Error):**
  - **Code:** `403 Forbidden` - User is not a participant of the tour.
  - **Code:** `404 Not Found` - Tour not found.

---

#### Cast or Remove a Vote

- **Method:** `POST`
- **URL:** `/api/tours/{tourId}/vote`
- **Description:** Toggles the current user's vote ("like") for a tour. If the user has voted, it removes the vote. If they haven't, it adds a vote.
- **Response (Success):**
  - **Code:** `200 OK`
  - **Body:**
    ```json
    {
      "message": "Vote added" // or "Vote removed"
    }
    ```
- **Response (Error):**
  - **Code:** `403 Forbidden` - User is not a participant or voting is hidden.
  - **Code:** `404 Not Found` - Tour not found.

---

### Tags

Endpoints for managing tags on archived tours.

---

#### Add Tags to a Tour

- **Method:** `POST`
- **URL:** `/api/tours/{tourId}/tags`
- **Description:** Adds one or more tags to an archived tour.
- **Request Body:**
  ```json
  {
    "tags": ["summer", "2026", "mountains"]
  }
  ```
- **Response (Success):**
  - **Code:** `200 OK`
  - **Body:** The full list of tags for the tour.
- **Response (Error):**
  - **Code:** `400 Bad Request` - Invalid tags array.
  - **Code:** `403 Forbidden` - User was not a participant or tour is not archived.
  - **Code:** `404 Not Found` - Tour not found.

---

## 3. Authentication and Authorization

- **Authentication:** The API uses Supabase for authentication. The frontend client initiates a "magic link" (OTP) login via the `/api/auth/magic-link` endpoint. Supabase sends an email. Upon clicking the link, the Supabase client library on the frontend establishes a session and obtains a JWT. This JWT must be included in the `Authorization` header for all subsequent requests to protected endpoints (e.g., `Authorization: Bearer <SUPABASE_JWT>`).

- **Authorization:** Authorization is primarily enforced by PostgreSQL's Row-Level Security (RLS) policies, as defined in the database schema. The Astro backend uses the user's JWT to create a scoped Supabase client instance for each request. This ensures all database queries are executed in the context of the authenticated user, and RLS policies are automatically applied. The API layer returns `403 Forbidden` if a user attempts an action not permitted by RLS (e.g., editing a tour they do not own).

## 4. Validation and Business Logic

- **Validation:** All incoming request payloads (`body`, `query params`) will be validated against a Zod schema before processing. This ensures type safety and adherence to constraints (e.g., string length, required fields) defined in the database schema. Failure to pass validation will result in a `400 Bad Request` response with a descriptive error message.

- **Business Logic:**
  - **Tour Ownership:** The `owner_id` of a tour is set to the authenticated user's ID upon creation. This is handled on the backend and cannot be specified by the client.
  - **Participation:** When a user creates a tour, they are automatically added to the `participants` table for that tour.
  - **Archiving:** A `pg_cron` job in the database is responsible for changing a tour's status from `active` to `archived` after its `end_date` has passed. The API does not expose an endpoint for this; it's an automatic background process. The API respects this status for filtering and for actions like tagging, which is only allowed on archived tours.
  - **User Deletion:** The complex logic of transferring tour ownership or deleting tours upon user account deletion is handled by a database trigger, as specified in the DB plan. The API only needs to provide an endpoint to initiate the user deletion process itself.

</route_api_specification>

2. Related database resources:
<related_db_resources>
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

</related_db_resources>

3. Type definitions:
<type_definitions>
import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ============================================================================
// Generic & Helper Types
// ============================================================================

/**
 * Represents the structure of a paginated API response.
 * @template T The type of the data items in the response.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// ============================================================================
// Authentication
// ============================================================================

/**
 * Represents the authenticated user object, combining Supabase user data
 * with the application-specific profile. This is the shape of `Astro.locals.user`.
 */
export interface User {
  id: string;
  email: string;
  profile: ProfileDto;
}

// ============================================================================
// Profiles
// ============================================================================

/**
 * DTO for a user's profile.
 * Excludes `updated_at` as it's not exposed in the API.
 * Corresponds to the response body of `GET /api/profiles/me`.
 */
export type ProfileDto = Omit<Tables<"profiles">, "updated_at">;

/**
 * Command model for updating a user's profile.
 * All fields are optional for partial updates (PATCH).
 * Corresponds to the request body of `PATCH /api/profiles/me`.
 */
export type UpdateProfileCommand = Partial<
  Pick<Tables<"profiles">, "username" | "display_name" | "language" | "theme" | "onboarding_completed">
>;

// ============================================================================
// Tours
// ============================================================================

/**
 * DTO for a summarized view of a tour.
 * Used in lists where full details are not necessary.
 * Corresponds to an item in the response of `GET /api/tours`.
 */
export type TourSummaryDto = Pick<
  Tables<"tours">,
  "id" | "title" | "destination" | "start_date" | "end_date" | "status"
> & {
  has_new_activity: boolean;
};

/**
 * DTO for a paginated list of tour summaries.
 * Corresponds to the full response of `GET /api/tours`.
 */
export type PaginatedToursDto = PaginatedResponse<TourSummaryDto>;

/**
 * View model for the `TourCard.astro` component.
 * Represents the transformed data tailored for presentation.
 */
export interface TourCardViewModel {
  id: string;
  url: string;
  title: string;
  dateRange: string;
  hasNewActivity: boolean;
}

/**
 * Command model for creating a new tour.
 * Derives from the `Insert` type for the `tours` table.
 * Corresponds to the request body of `POST /api/tours`.
 */
export type CreateTourCommand = Pick<
  TablesInsert<"tours">,
  "title" | "destination" | "description" | "start_date" | "end_date" | "participant_limit" | "like_threshold"
>;

/**
 * DTO for the full details of a single tour.
 * Excludes `updated_at` as it's not exposed in the API.
 * Corresponds to the response of `GET /api/tours/{tourId}`.
 */
export type TourDetailsDto = Omit<Tables<"tours">, "updated_at">;

/**
 * Command model for updating an existing tour.
 * All fields are optional for partial updates.
 * Corresponds to the request body of `PATCH /api/tours/{tourId}`.
 */
export type UpdateTourCommand = Partial<
  Pick<
    Tables<"tours">,
    | "title"
    | "destination"
    | "description"
    | "start_date"
    | "end_date"
    | "participant_limit"
    | "like_threshold"
    | "are_votes_hidden"
  >
>;

// ============================================================================
// Participants
// ============================================================================

/**
 * DTO for a tour participant.
 * Combines data from the `participants` and `profiles` tables.
 * Corresponds to an item in the response of `GET /api/tours/{tourId}/participants`.
 */
export type ParticipantDto = Pick<Tables<"participants">, "user_id" | "joined_at"> &
  Pick<Tables<"profiles">, "username" | "display_name">;

// ============================================================================
// Invitations
// ============================================================================

/**
 * Command model for inviting users to a tour.
 * Corresponds to the request body of `POST /api/tours/{tourId}/invitations`.
 */
export interface InviteParticipantsCommand {
  emails: string[];
}

// ============================================================================
// Comments
// ============================================================================

/**
 * DTO for a comment on a tour.
 * Includes the commenter's username from the `profiles` table.
 * Corresponds to an item in the response of `GET /api/tours/{tourId}/comments`.
 */
export type CommentDto = Tables<"comments"> & Pick<Tables<"profiles">, "username">;

/**
 * DTO for a paginated list of comments.
 * Corresponds to the full response of `GET /api/tours/{tourId}/comments`.
 */
export type PaginatedCommentsDto = PaginatedResponse<CommentDto>;

/**
 * Command model for creating a new comment.
 * Corresponds to the request body of `POST /api/tours/{tourId}/comments`.
 */
export type CreateCommentCommand = Pick<TablesInsert<"comments">, "content">;

/**
 * Command model for updating an existing comment.
 * Corresponds to the request body of `PATCH /api/tours/{tourId}/comments/{commentId}`.
 */
export type UpdateCommentCommand = Pick<TablesUpdate<"comments">, "content">;

// ============================================================================
// Votes
// ============================================================================

/**
 * DTO representing the votes for a tour.
 * Includes the total count and a list of user IDs who voted.
 * Corresponds to the response of `GET /api/tours/{tourId}/votes`.
 */
export interface TourVotesDto {
  count: number;
  users: Tables<"votes">["user_id"][];
}

/**
 * DTO for the response of toggling a vote.
 * Corresponds to the response of `POST /api/tours/{tourId}/vote`.
 */
export interface ToggleVoteResponseDto {
  message: "Vote added" | "Vote removed";
}

// ============================================================================
// Tags
// ============================================================================

/**
 * Command model for adding tags to a tour.
 * Corresponds to the request body of `POST /api/tours/{tourId}/tags`.
 */
export interface AddTagsCommand {
  tags: string[];
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Represents error information for user-facing error messages.
 * Used by the error mapping service to provide localized error details.
 */
export interface ErrorInfo {
  title: string;
  message: string;
  action: string;
  errorCode: string;
}

</type_definitions>

3. Tech stack:
<tech_stack>
## Frontend - Astro with React for interactive components:

- Astro 5 allows for the creation of fast, efficient pages and applications with minimal JavaScript.
- React 19 will provide interactivity where it's needed.
- TypeScript 5 for static code typing and better IDE support.
- Tailwind 4 allows for convenient application styling.
- Shadcn provides a library of accessible React components on which we will base the UI.
- daisyui is a taiwlind plugin that provides wide range of ready classes

## Backend - Supabase as a comprehensive backend solution:

- Provides a PostgreSQL database.
- Provides SDKs in multiple languages that will serve as a Backend-as-a-Service.
- It is an open-source solution that can be hosted locally or on your own server.
- Has built-in user authentication.

## AI - Communication with models via the Openrouter.ai service:

- Access to a wide range of models (OpenAI, Anthropic, Google, and many others), which will allow us to find a solution that ensures high efficiency and low costs.
- Allows setting financial limits on API keys.

## CI/CD and Hosting:

- Github Actions for creating CI/CD pipelines.
- DigitalOcean for hosting the application via a Docker image.

</tech_stack>

4. Implementation rules:
<implementation_rules>
---
description: 
globs: src/db/*.ts,src/middleware/*.ts,src/lib/*.ts
alwaysApply: false
---
### Backend and Database

- Use Supabase for backend services, including authentication and database interactions.
- Follow Supabase guidelines for security and performance.
- Use Zod schemas to validate data exchanged with the backend.
- Use supabase from context.locals in Astro routes instead of importing supabaseClient directly
- Use SupabaseClient type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`
---
description: 
globs: *.astro
alwaysApply: false
---
### Guidelines for Astro

- Leverage View Transitions API for smooth page transitions (use ClientRouter)
- Use content collections with type safety for blog posts, documentation, etc.
- Leverage Server Endpoints for API routes
- Use POST, GET  - uppercase format for endpoint handlers
- Use `export const prerender = false` for API routes
- Use zod for input validation in API routes
- Extract logic into services in `src/lib/services`
- Implement middleware for request/response modification
- Use image optimization with the Astro Image integration
- Implement hybrid rendering with server-side rendering where needed
- Use Astro.cookies for server-side cookie management
- Leverage import.meta.env for environment variables
---
description: 
globs: 
alwaysApply: true
---
# AI Rules for {app-name}

{project-description}

## Tech Stack

- Astro 5
- TypeScript 5
- React 19
- Tailwind 4
- Shadcn/ui

## Project Structure

When introducing changes to the project, always follow the directory structure below:

- `./src` - source code
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages
- `./src/pages/api` - API endpoints
- `./src/middleware/index.ts` - Astro middleware
- `./src/db` - Supabase clients and types
- `./src/types.ts` - Shared types for backend and frontend (Entities, DTOs)
- `./src/components` - Client-side components written in Astro (static) and React (dynamic)
- `./src/components/ui` - Client-side components from Shadcn/ui
- `./src/lib` - Services and helpers 
- `./src/assets` - static internal assets
- `./public` - public assets

When modifying the directory structure, always update this section.

## Coding practices

### Guidelines for clean code

- Use feedback from linters to improve the code when making changes.
- Prioritize error handling and edge cases.
- Handle errors and edge cases at the beginning of functions.
- Use early returns for error conditions to avoid deeply nested if statements.
- Place the happy path last in the function for improved readability.
- Avoid unnecessary else statements; use if-return pattern instead.
- Use guard clauses to handle preconditions and invalid states early.
- Implement proper error logging and user-friendly error messages.
- Consider using custom error types or error factories for consistent error handling.

</implementation_rules>

Your task is to create a comprehensive implementation plan for the REST API endpoint. Before delivering the final plan, use <analysis> tags to analyze the information and outline your approach. In this analysis, ensure that:

1. Summarize key points of the API specification.
2. List required and optional parameters from the API specification.
3. List necessary DTO types and Command Models.
4. Consider how to extract logic to a service (existing or new, if it doesn't exist).
5. Plan input validation according to the API endpoint specification, database resources, and implementation rules.
6. Determine how to log errors in the error table (if applicable).
7. Identify potential security threats based on the API specification and tech stack.
8. Outline potential error scenarios and corresponding status codes.

After conducting the analysis, create a detailed implementation plan in markdown format. The plan should contain the following sections:

1. Endpoint Overview
2. Request Details
3. Response Details
4. Data Flow
5. Security Considerations
6. Error Handling
7. Performance
8. Implementation Steps

Throughout the plan, ensure that you:
- Use correct API status codes:
  - 200 for successful read
  - 201 for successful creation
  - 400 for invalid input
  - 401 for unauthorized access
  - 404 for not found resources
  - 500 for server-side errors
- Adapt to the provided tech stack
- Follow the provided implementation rules

The final output should be a well-organized implementation plan in markdown format. Here's an example of what the output should look like:

``markdown
# API Endpoint Implementation Plan: [Endpoint Name]

## 1. Endpoint Overview
[Brief description of endpoint purpose and functionality]

## 2. Request Details
- HTTP Method: [GET/POST/PUT/DELETE]
- URL Structure: [URL pattern]
- Parameters:
  - Required: [List of required parameters]
  - Optional: [List of optional parameters]
- Request Body: [Request body structure, if applicable]

## 3. Used Types
[DTOs and Command Models necessary for implementation]

## 3. Response Details
[Expected response structure and status codes]

## 4. Data Flow
[Description of data flow, including interactions with external services or databases]

## 5. Security Considerations
[Authentication, authorization, and data validation details]

## 6. Error Handling
[List of potential errors and how to handle them]

## 7. Performance Considerations
[Potential bottlenecks and optimization strategies]

## 8. Implementation Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]
...
```

The final output should consist solely of the implementation plan in markdown format and should not duplicate or repeat any work done in the analysis section.

Remember to save your implementation plan as .ai/view-implementation-plan.md. Ensure the plan is detailed, clear, and provides comprehensive guidance for the development team.