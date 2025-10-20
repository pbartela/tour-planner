# API Endpoint Implementation Plan

This document contains detailed implementation plans for all REST API endpoints of the Tour Planner application. Each section corresponds to a single endpoint and includes all the necessary information for the development team to implement it according to the specification and best practices.

---

# API Endpoint Implementation Plan: `POST /api/auth/signin`

## 1. Endpoint Overview

This endpoint initiates the user login or registration process by sending a "magic link" (one-time password) to the provided email address via the Supabase service.

## 2. Request Details

- **HTTP Method:** `POST`
- **URL Structure:** `/api/auth/signin`
- **Parameters:** None
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```

## 3. Used Types

- **Command Model:** `SignInCommand`

## 4. Response Details

- **Success Response (Code `200 OK`):**
  ```json
  {}
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid email format.
  - `500 Internal Server Error`: Internal server error, e.g., failure to send the email by Supabase.

## 5. Data Flow

1.  The Astro endpoint handler (`src/pages/api/auth/signin.ts`) receives the POST request.
2.  The request body is validated using a Zod schema, which checks if the `email` field is a valid email address.
3.  A method from `AuthService` is called, which passes the email to the `signInWithOtp` function of the Supabase client.
4.  Supabase attempts to send the magic link to the provided address.
5.  If the Supabase operation is successful, the endpoint returns a `200 OK` status and an empty object.
6.  In case of a validation error or an error from Supabase, the appropriate error status code (`400` or `500`) is returned.

## 6. Security Considerations

- **Input Validation:** Using Zod for email format validation prevents basic errors and attacks.
- **Rate Limiting:** It is advisable to implement a rate-limiting mechanism (e.g., at the Astro middleware level) to protect against email bombing attacks or user spamming.

## 7. Error Handling

- A Zod validation error should result in a `400 Bad Request` response with information about the invalid fields.
- An error returned by Supabase (`signInWithOtp`) should be logged on the server-side and result in a `500 Internal Server Error` response.

## 8. Performance Considerations

- The operation's performance depends on the response time of the Supabase service. No significant performance issues are anticipated on our application's side.

## 9. Implementation Steps

1.  **Create Zod Schema:** Define a validation schema for `SignInCommand` in `src/lib/validators/auth.validators.ts`.
2.  **Implement `AuthService`:** Create the file `src/lib/services/auth.service.ts` and implement a `sendMagicLink(email)` method that calls `supabase.auth.signInWithOtp`.
3.  **Create Astro Endpoint:** Create the file `src/pages/api/auth/signin.ts` with a `POST` handler.
4.  **Integration:** In the `POST` handler, use the Zod schema for validation, then call the `AuthService` and handle the response and potential errors.

---

# API Endpoint Implementation Plan: `GET /api/profiles/me`

## 1. Endpoint Overview

This endpoint retrieves the profile data of the currently authenticated user. It uses the `me` keyword as a reference to the logged-in user.

## 2. Request Details

- **HTTP Method:** `GET`
- **URL Structure:** `/api/profiles/me`
- **Parameters:** None
- **Request Body:** None

## 3. Used Types

- **DTO:** `ProfileDto`

## 4. Response Details

- **Success Response (Code `200 OK`):**
  ```json
  {
    "id": "c3a4b1d2-...",
    "username": "tour_master",
    "display_name": "Alex",
    "language": "en",
    "theme": "dark",
    "onboarding_completed": false,
    "created_at": "2025-10-15T10:00:00Z"
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: The user is not authenticated.
  - `404 Not Found`: No profile was found for the authenticated user.

## 5. Data Flow

1.  The `GET` request is sent to the `/api/profiles/me` endpoint.
2.  Astro middleware (`src/middleware/index.ts`) verifies the JWT, creates a personalized Supabase client instance, and attaches it to `context.locals`. If the token is invalid or missing, the middleware redirects or returns a `401` error.
3.  The endpoint handler (`src/pages/api/profiles/me.ts`) calls a method from the `ProfileService`, e.g., `getProfile(userId)`. The user ID (`userId`) is retrieved from the Supabase session (`context.locals.supabase`).
4.  The `ProfileService` queries the `profiles` table in Supabase, using the `userId` to find the corresponding record.
5.  If the profile is found, it is mapped to a `ProfileDto` and returned with a `200 OK` code.
6.  If the query does not return a profile, a `404 Not Found` error is returned.

## 6. Security Considerations

- **Authentication:** The endpoint must be protected. Access should only be granted to authenticated users. Astro middleware is crucial for ensuring this.
- **Authorization (RLS):** Although RLS is configured to allow a user to see only their own profile, the application logic should still explicitly fetch the profile based on the logged-in user's ID, not an ID passed as a parameter.

## 7. Error Handling

- If `context.locals.supabase` or the user session does not exist, the middleware should return `401 Unauthorized`.
- If the `ProfileService` does not find a profile in the database for the given `userId`, it should return an error that the handler will translate into a `404 Not Found`.

## 8. Performance Considerations

- This is a simple `SELECT` query by a primary key, so it should be very efficient. No problems are anticipated.

## 9. Implementation Steps

1.  **Implement `ProfileService`:** In `src/lib/services/profile.service.ts`, create a `getProfile(supabase: SupabaseClient, userId: string)` method to fetch the profile from the database.
2.  **Create Astro Endpoint:** Create the file `src/pages/api/profiles/me.ts` with a `GET` handler.
3.  **Integration:** In the `GET` handler, retrieve the user ID and Supabase client from `context.locals`, call the `ProfileService`, and return the `ProfileDto` or an appropriate error.

---

# API Endpoint Implementation Plan: `PATCH /api/profiles/me`

## 1. Endpoint Overview

This endpoint allows an authenticated user to update their profile. It supports partial updates (PATCH) and marking the onboarding as complete.

## 2. Request Details

- **HTTP Method:** `PATCH`
- **URL Structure:** `/api/profiles/me`
- **Parameters:** None
- **Request Body:**
  ```json
  {
    "display_name": "Alex Johnson",
    "language": "pl",
    "theme": "system",
    "onboarding_completed": true
  }
  ```
  _All fields are optional._

## 3. Used Types

- **Command Model:** `UpdateProfileCommand`
- **DTO:** `ProfileDto`

## 4. Response Details

- **Success Response (Code `200 OK`):** The updated profile object (`ProfileDto`).
- **Error Responses:**
  - `400 Bad Request`: Input data validation error.
  - `401 Unauthorized`: The user is not authenticated.

## 5. Data Flow

1.  The `PATCH` request with partial profile data is sent to the `/api/profiles/me` endpoint.
2.  Astro middleware ensures that the user is authenticated.
3.  The request body is validated using a Zod schema for `UpdateProfileCommand`. The schema should use `.partial()` to make all fields optional.
4.  The endpoint handler (`src/pages/api/profiles/me.ts`) retrieves the user ID from the session and passes the validated data to the `ProfileService`, e.g., `updateProfile(userId, updateData)`.
5.  The `ProfileService` executes an `UPDATE` query on the `profiles` table in Supabase, updating the profile where `id` equals `userId`.
6.  After a successful update, the service fetches and returns the updated profile.
7.  The handler maps the returned object to a `ProfileDto` and sends it back with a `200 OK` code.

## 6. Security Considerations

- **Authentication:** The endpoint must be protected and accessible only to logged-in users.
- **Authorization (RLS):** RLS policies in the database ensure that a user can only modify their own profile.
- **Input Validation:** Zod validation is crucial to ensure that invalid values (e.g., an disallowed value for `theme`) are not saved to the database.

## 7. Error Handling

- Missing JWT or invalid session -> `401 Unauthorized`.
- Zod validation error -> `400 Bad Request`.
- Error during the `UPDATE` operation in Supabase -> `500 Internal Server Error`.

## 8. Performance Considerations

- An `UPDATE` operation on an indexed field (`id`) is very efficient. No problems are anticipated.

## 9. Implementation Steps

1.  **Create Zod Schema:** Define a validation schema for `UpdateProfileCommand` in `src/lib/validators/profile.validators.ts` (using `.partial()`).
2.  **Extend `ProfileService`:** In `src/lib/services/profile.service.ts`, add an `updateProfile(supabase: SupabaseClient, userId: string, data: UpdateProfileCommand)` method.
3.  **Create Astro Endpoint:** In the `src/pages/api/profiles/me.ts` file, add a `PATCH` handler.
4.  **Integration:** In the `PATCH` handler, validate the body, call the service, and then return the updated `ProfileDto` or an error.

---

# API Endpoint Implementation Plan: `GET /api/tours`

## 1. Endpoint Overview

This endpoint retrieves a list of tours in which the currently logged-in user is participating. It supports pagination and filtering by status.

## 2. Request Details

- **HTTP Method:** `GET`
- **URL Structure:** `/api/tours`
- **Parameters:**
  - **Query:**
    - `status` (string, optional): Filters tours. Allowed values: `active`, `archived`. Defaults to `active`.
    - `page` (integer, optional): Page number for pagination. Defaults to `1`.
    - `limit` (integer, optional): Number of results per page. Defaults to `20`.
- **Request Body:** None

## 3. Used Types

- **DTO:** `PaginatedToursDto`, `TourSummaryDto`

## 4. Response Details

- **Success Response (Code `200 OK`):**
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
- **Error Responses:**
  - `400 Bad Request`: Invalid query parameters (e.g., `status` other than 'active'/'archived').
  - `401 Unauthorized`: The user is not authenticated.

## 5. Data Flow

1.  The `GET` request is sent to the `/api/tours` endpoint.
2.  Astro middleware ensures user authentication.
3.  The `status`, `page`, and `limit` parameters are read from the URL query and validated using a Zod schema.
4.  The endpoint handler (`src/pages/api/tours.ts`) calls a method from the `TourService`, e.g., `getUserTours(userId, { status, page, limit })`.
5.  The `TourService` constructs a Supabase query that:
    a. Joins the `tours` and `participants` tables.
    b. Filters the results to show only those where `participants.user_id` equals `userId`.
    c. Applies the `status` filter if provided.
    d. Implements pagination using `.range()` or `.limit()` and `.offset()` methods.
    e. Counts the total number of matching records for the pagination object.
6.  The results are mapped to a list of `TourSummaryDto`.
7.  The handler constructs the final `PaginatedToursDto` object and returns it with a `200 OK` code.

## 6. Security Considerations

- **Authentication:** The endpoint must be protected.
- **Authorization (RLS):** RLS policies ensure that a user can only retrieve tours they are a participant in. The service logic should reflect this by filtering by `user_id` in the `participants` table.

## 7. Error Handling

- Query parameter validation error -> `400 Bad Request`.
- No user session -> `401 Unauthorized`.
- Database query error -> `500 Internal Server Error`.

## 8. Performance Considerations

- The database query involves a `JOIN`. It's important to ensure that the columns used for joining and filtering (`participants.user_id`, `tours.status`) are indexed to ensure high performance, especially with a large number of tours and participants. An index on `participants(user_id)` is already planned in `db-plan.md`.

## 9. Implementation Steps

1.  **Create Zod Schema:** Define a validation schema for the query parameters (`status`, `page`, `limit`) in `src/lib/validators/tour.validators.ts`.
2.  **Implement `TourService`:** Create a `src/lib/services/tour.service.ts` service with a `getUserTours(supabase: SupabaseClient, userId: string, options: { status?, page?, limit? })` method that implements the query and pagination logic.
3.  **Create Astro Endpoint:** Create the file `src/pages/api/tours.ts` with a `GET` handler.
4.  **Integration:** In the `GET` handler, validate the query params, call the service, and return the `PaginatedToursDto`.

---

# API Endpoint Implementation Plan: `POST /api/tours`

## 1. Endpoint Overview

This endpoint is used to create a new tour. The user who creates the tour is automatically set as its owner (`owner_id`) and added to the list of participants.

## 2. Request Details

- **HTTP Method:** `POST`
- **URL Structure:** `/api/tours`
- **Parameters:** None
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

## 3. Used Types

- **Command Model:** `CreateTourCommand`
- **DTO:** `TourDetailsDto`

## 4. Response Details

- **Success Response (Code `201 Created`):** The newly created tour object (`TourDetailsDto`).
- **Error Responses:**
  - `400 Bad Request`: Input data validation error.
  - `401 Unauthorized`: The user is not authenticated.

## 5. Data Flow

1.  The `POST` request with new tour data is sent to the `/api/tours` endpoint.
2.  Astro middleware ensures user authentication.
3.  The request body is validated using a Zod schema for `CreateTourCommand`.
4.  The endpoint handler (`src/pages/api/tours.ts`) retrieves the user ID from the session and passes the validated data to the `TourService`, e.g., `createTour(userId, tourData)`.
5.  The `TourService` executes a database transaction that:
    a. Creates a new record in the `tours` table, setting `owner_id` to the creator's `userId`.
    b. Retrieves the ID of the newly created tour.
    c. Creates a new record in the `participants` table, linking the creator's `userId` with the new `tour_id`.
6.  The service returns the full data of the newly created tour.
7.  The handler maps the data to a `TourDetailsDto` and returns it with a `201 Created` code.

## 6. Security Considerations

- **Authentication:** The endpoint must be accessible only to logged-in users.
- **Data Validation:** Strict Zod validation (checking types, string lengths, date correctness) is crucial for data integrity.
- **Owner Assignment:** The `owner_id` must be set on the server-side based on the logged-in user's ID, not accepted from the `request body`.

## 7. Error Handling

- Zod validation error -> `400 Bad Request`.
- No user session -> `401 Unauthorized`.
- Database transaction error -> `500 Internal Server Error`.

## 8. Performance Considerations

- `INSERT` operations are generally fast. Using a transaction ensures data consistency but may slightly affect response time. No problems are anticipated.

## 9. Implementation Steps

1.  **Create Zod Schema:** Define a validation schema for `CreateTourCommand` in `src/lib/validators/tour.validators.ts`.
2.  **Extend `TourService`:** In `src/lib/services/tour.service.ts`, implement a `createTour(supabase: SupabaseClient, userId: string, data: CreateTourCommand)` method that executes the transaction for creating a tour and adding a participant.
3.  **Create Astro Endpoint:** In `src/pages/api/tours.ts`, add a `POST` handler.
4.  **Integration:** In the `POST` handler, validate the body, call the service, and return the `TourDetailsDto` with a `201 Created` code.

---

# API Endpoint Implementation Plan: `GET /api/tours/{tourId}`

## 1. Endpoint Overview

This endpoint retrieves full, detailed information about a specific tour based on its ID.

## 2. Request Details

- **HTTP Method:** `GET`
- **URL Structure:** `/api/tours/{tourId}`
- **Parameters:**
  - **URL:**
    - `tourId` (uuid, required): The ID of the tour to retrieve.
- **Request Body:** None

## 3. Used Types

- **DTO:** `TourDetailsDto`

## 4. Response Details

- **Success Response (Code `200 OK`):** A `TourDetailsDto` object.
- **Error Responses:**
  - `401 Unauthorized`: The user is not authenticated.
  - `403 Forbidden`: The user is not a participant of this tour.
  - `404 Not Found`: A tour with the given ID does not exist.

## 5. Data Flow

1.  The `GET` request is sent to the `/api/tours/[tourId].ts` endpoint.
2.  Astro middleware ensures user authentication.
3.  The `tourId` parameter from the URL is validated (must be a valid UUID).
4.  The endpoint handler calls a method from the `TourService`, e.g., `getTourDetails(tourId)`.
5.  The `TourService` executes a `SELECT` query on the `tours` table in Supabase, filtering by `id`.
6.  The query is executed in the context of the authenticated user. The RLS policy in the database will automatically check if the user is a participant of this tour. If not, the query will return no results, even if the tour exists.
7.  If the query returns data, it is mapped to a `TourDetailsDto` and returned by the service. The handler sends it back with a `200 OK` code.
8.  If the query returns no data, it means either the tour does not exist or the user does not have access. In both cases, the endpoint should return `404 Not Found` to avoid disclosing information about the resource's existence.

## 6. Security Considerations

- **Authentication:** Protected endpoint.
- **Authorization (RLS):** Access is controlled by RLS policies. The user must be a participant of the tour to view it. This is a key security mechanism for this endpoint.

## 7. Error Handling

- Invalid `tourId` format -> `400 Bad Request`.
- No user session -> `401 Unauthorized`.
- Query returns no results (due to RLS or a non-existent record) -> `404 Not Found`.

## 8. Performance Considerations

- A `SELECT` query by a primary key (`id`) is very efficient.

## 9. Implementation Steps

1.  **Create Zod Schema:** Define a validation schema for the `tourId` parameter (as `z.string().uuid()`).
2.  **Extend `TourService`:** In `src/lib/services/tour.service.ts`, add a `getTourDetails(supabase: SupabaseClient, tourId: string)` method.
3.  **Create Astro Endpoint:** Create the file `src/pages/api/tours/[tourId].ts` with a `GET` handler.
4.  **Integration:** In the `GET` handler, validate the `tourId`, call the service, and return the `TourDetailsDto` or an appropriate error.

---

# API Endpoint Implementation Plan: `PATCH /api/tours/{tourId}`

## 1. Endpoint Overview

This endpoint allows the tour owner to update its details. It supports partial updates (PATCH) of any modifiable fields.

## 2. Request Details

- **HTTP Method:** `PATCH`
- **URL Structure:** `/api/tours/{tourId}`
- **Parameters:**
  - **URL:**
    - `tourId` (uuid, required): The ID of the tour to update.
- **Request Body:**
  ```json
  {
    "title": "An Epic Mountain Hike",
    "are_votes_hidden": true
  }
  ```
  _All fields are optional._

## 3. Used Types

- **Command Model:** `UpdateTourCommand`
- **DTO:** `TourDetailsDto`

## 4. Response Details

- **Success Response (Code `200 OK`):** The updated tour object (`TourDetailsDto`).
- **Error Responses:**
  - `400 Bad Request`: Input data validation error.
  - `401 Unauthorized`: The user is not authenticated.
  - `403 Forbidden`: The user is not the owner of the tour.
  - `404 Not Found`: A tour with the given ID does not exist.

## 5. Data Flow

1.  The `PATCH` request is sent to the `/api/tours/[tourId].ts` endpoint.
2.  Astro middleware ensures user authentication.
3.  The `tourId` parameter is validated (must be a UUID).
4.  The request body is validated using a Zod schema for `UpdateTourCommand` (`.partial()`).
5.  The endpoint handler calls a method from the `TourService`, e.g., `updateTour(tourId, updateData)`.
6.  The `TourService` executes an `UPDATE` query on the `tours` table in Supabase, filtering by `id`.
7.  The RLS policy in the database will automatically check if `auth.uid()` is equal to the `owner_id` of the row being modified. If not, the `UPDATE` operation will fail or modify zero rows.
8.  After a successful update, the service fetches and returns the updated tour data.
9.  The handler maps the data to a `TourDetailsDto` and sends it back with a `200 OK` code.
10. If the `UPDATE` query modified zero rows (because RLS blocked the operation or the record does not exist), the service should interpret this and return an error, which the handler will translate into `403 Forbidden` or `404 Not Found`.

## 6. Security Considerations

- **Authentication:** Protected endpoint.
- **Authorization (RLS):** Key mechanism. Only the owner (`owner_id`) can modify the tour. RLS is the main guardian of this rule.
- **Data Validation:** Zod validation prevents invalid data from being submitted.

## 7. Error Handling

- Invalid `tourId` format or errors in the body -> `400 Bad Request`.
- No session -> `401 Unauthorized`.
- RLS blocks the operation -> `403 Forbidden`.
- Tour does not exist -> `404 Not Found`.

## 8. Performance Considerations

- An `UPDATE` operation on an indexed field (`id`) is efficient.

## 9. Implementation Steps

1.  **Create Zod Schema:** Define a validation schema for `UpdateTourCommand` (`.partial()`) in `src/lib/validators/tour.validators.ts`.
2.  **Extend `TourService`:** In `src/lib/services/tour.service.ts`, add an `updateTour(supabase: SupabaseClient, tourId: string, data: UpdateTourCommand)` method.
3.  **Implement Endpoint:** In the `src/pages/api/tours/[tourId].ts` file, add a `PATCH` handler.
4.  **Integration:** In the `PATCH` handler, validate the `tourId` and body, call the service, and return the updated `TourDetailsDto` or an appropriate error.

---

# API Endpoint Implementation Plan: `DELETE /api/tours/{tourId}`

## 1. Endpoint Overview

This endpoint allows the tour owner to permanently delete it. This operation will also cascade delete all related data (participants, comments, votes, etc.).

## 2. Request Details

- **HTTP Method:** `DELETE`
- **URL Structure:** `/api/tours/{tourId}`
- **Parameters:**
  - **URL:**
    - `tourId` (uuid, required): The ID of the tour to delete.
- **Request Body:** None

## 3. Used Types

- None (the operation does not accept or return data)

## 4. Response Details

- **Success Response (Code `204 No Content`):** No response body.
- **Error Responses:**
  - `401 Unauthorized`: The user is not authenticated.
  - `403 Forbidden`: The user is not the owner of the tour.
  - `404 Not Found`: A tour with the given ID does not exist.

## 5. Data Flow

1.  The `DELETE` request is sent to the `/api/tours/[tourId].ts` endpoint.
2.  Astro middleware ensures user authentication.
3.  The `tourId` parameter is validated (must be a UUID).
4.  The endpoint handler calls a method from the `TourService`, e.g., `deleteTour(tourId)`.
5.  The `TourService` executes a `DELETE` query on the `tours` table in Supabase, filtering by `id`.
6.  The RLS policy in the database will check if `auth.uid()` is equal to the `owner_id` of the row being deleted. If not, the `DELETE` operation will fail.
7.  If the deletion is successful, the handler returns a `204 No Content` status.
8.  If the operation deleted zero rows (due to RLS or a non-existent record), a `403 Forbidden` or `404 Not Found` error is returned.

## 6. Security Considerations

- **Authentication:** Protected endpoint.
- **Authorization (RLS):** Only the owner can delete the tour. RLS is critical for the security of this operation.
- **Cascade Delete:** The `ON DELETE CASCADE` configuration on foreign keys in the database is crucial for maintaining data consistency after a tour is deleted.

## 7. Error Handling

- Invalid `tourId` format -> `400 Bad Request`.
- No session -> `401 Unauthorized`.
- RLS blocks the operation -> `403 Forbidden`.
- Tour does not exist -> `404 Not Found`.

## 8. Performance Considerations

- A `DELETE` operation is fast, but a cascade delete might take longer if a very large amount of data is associated with the tour (e.g., thousands of comments). This should still not be an issue under typical conditions.

## 9. Implementation Steps

1.  **Extend `TourService`:** In `src/lib/services/tour.service.ts`, add a `deleteTour(supabase: SupabaseClient, tourId: string)` method.
2.  **Implement Endpoint:** In the `src/pages/api/tours/[tourId].ts` file, add a `DELETE` handler.
3.  **Integration:** In the `DELETE` handler, validate the `tourId`, call the service, and return `204 No Content` or an appropriate error.
