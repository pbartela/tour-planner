# REST API Plan

This document outlines the REST API for the Tour Planner application. The API is designed to be RESTful, using standard HTTP methods and status codes. All endpoints are prefixed with `/api`.

## 1. Resources

| Resource | Description | Database Table(s) |
| :--- | :--- | :--- |
| `Profile` | Represents a user's profile information. | `public.profiles` |
| `Tour` | Represents a single tour or trip. | `public.tours` |
| `Participant` | Represents a user's participation in a tour. | `public.participants` |
| `Comment` | Represents a comment made on a tour. | `public.comments` |
| `Vote` | Represents a "like" or vote on a tour. | `public.votes` |
| `Invitation` | Represents an invitation for a user to join a tour. | `public.invitations` |
| `Tag` | Represents a tag for categorizing tours. | `public.tags`, `public.tour_tags` |

## 2. Endpoints

### Authentication

These endpoints handle user authentication via Supabase's magic link (OTP) flow.

---

#### Request Magic Link
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
      "username": "tour_master",
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
        "username": "tour_master",
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
          "username": "tour_master",
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
