# API Endpoint Implementation Plan: Create a New Tour

## 1. Endpoint Overview

This endpoint allows authenticated users to create a new tour. Upon successful creation, the user is automatically assigned as the tour owner and added as the first participant. The endpoint handles the creation of both the tour record and the initial participant relationship in a transactional manner to maintain data consistency.

**Key Features:**

- Authenticated users can create tours with custom details
- Creator is automatically set as owner (based on JWT)
- Creator is automatically added as the first participant
- All fields except `description`, `participant_limit`, and `like_threshold` are required
- Returns the complete tour object upon success

## 2. Request Details

- **HTTP Method:** `POST`
- **URL Structure:** `/api/tours`
- **Authentication:** Required (JWT Bearer token)
- **Content-Type:** `application/json`

### Parameters:

**Required:**

- `title` (string): Tour title, must be non-empty
- `destination` (string): Tour destination, must be non-empty
- `start_date` (ISO 8601 timestamp): When the tour begins
- `end_date` (ISO 8601 timestamp): When the tour ends

**Optional:**

- `description` (string): Detailed description of the tour
- `participant_limit` (integer): Maximum number of participants, must be > 0 if provided
- `like_threshold` (integer): Number of votes needed to confirm the tour, must be > 0 if provided

### Request Body Example:

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

### Command Model (Request):

- **`CreateTourCommand`**: Defined in `src/types.ts`
  ```typescript
  type CreateTourCommand = Pick<
    TablesInsert<"tours">,
    "title" | "destination" | "description" | "start_date" | "end_date" | "participant_limit" | "like_threshold"
  >;
  ```

### Response DTO:

- **`TourDetailsDto`**: Defined in `src/types.ts`
  ```typescript
  type TourDetailsDto = Omit<Tables<"tours">, "updated_at">;
  ```

### Database Types:

- **`Tables<"tours">`**: From `src/db/database.types.ts`
- **`TablesInsert<"participants">`**: For adding the creator as a participant

## 4. Response Details

### Success Response (201 Created):

```json
{
  "id": "f4b3c2a1-...",
  "owner_id": "c3a4b1d2-...",
  "title": "Beach Vacation",
  "destination": "Hawaii",
  "description": "A relaxing week on the sunny beaches.",
  "start_date": "2026-08-01T12:00:00Z",
  "end_date": "2026-08-08T12:00:00Z",
  "participant_limit": 10,
  "like_threshold": 5,
  "are_votes_hidden": false,
  "status": "active",
  "created_at": "2025-10-24T10:00:00Z"
}
```

### Error Responses:

**401 Unauthorized:**

```json
{
  "error": "Authentication required"
}
```

**400 Bad Request:**

```json
{
  "error": "Validation error",
  "details": {
    "title": ["Required"],
    "start_date": ["Invalid date format"]
  }
}
```

**500 Internal Server Error:**

```json
{
  "error": "Failed to create tour"
}
```

## 5. Data Flow

1. **Request Reception:**
   - Astro API endpoint receives POST request at `/api/tours`
   - Middleware validates session and attaches user to `Astro.locals`

2. **Input Validation:**
   - Parse request body as JSON
   - Validate against Zod schema (CreateTourCommandSchema)
   - Return 400 if validation fails

3. **Service Layer Processing:**
   - Extract validated data and authenticated user ID
   - Call `TourService.createTour()` method
   - Service method performs:
     - Insert tour record with `owner_id` set to authenticated user
     - Insert participant record linking user to tour
     - Both operations in single Supabase query chain

4. **Database Operations:**
   - Supabase client (scoped to user) executes operations
   - RLS policies automatically enforce authorization
   - Database returns created tour object

5. **Response Formation:**
   - Map database result to `TourDetailsDto`
   - Return 201 status with tour object
   - Handle any errors and return appropriate status codes

```
[Client] --> [POST /api/tours] --> [Middleware: Auth Check] --> [Zod Validation]
                                                                      |
                                                                      v
[Client] <-- [201 + Tour Object] <-- [Map to DTO] <-- [TourService.createTour()]
                                                              |
                                                              v
                                                    [Supabase: Insert Tour + Participant]
```

## 6. Security Considerations

### Authentication:

- **Requirement:** User must be authenticated
- **Implementation:** Middleware checks `Astro.locals.user` existence
- **Failure Response:** 401 Unauthorized if user is not authenticated

### Authorization:

- **Tour Creation:** All authenticated users can create tours (enforced by RLS policy)
- **Owner Assignment:** `owner_id` is set server-side from JWT, cannot be spoofed by client
- **RLS Policies:** Database-level INSERT policy allows any authenticated user to create tours

### Data Validation:

- **Input Sanitization:** Zod schemas validate and type-check all inputs
- **SQL Injection Prevention:** Supabase client uses parameterized queries
- **XSS Prevention:** Output encoding handled by frontend when rendering user content

### Threats & Mitigations:

| Threat                       | Mitigation                                      |
| ---------------------------- | ----------------------------------------------- |
| Unauthorized tour creation   | Middleware enforces authentication              |
| Owner ID spoofing            | Server-side assignment from JWT                 |
| Invalid date ranges          | Zod validation with custom refinements          |
| Excessive participant limits | Validation constraints in schema                |
| SQL injection                | Parameterized queries via Supabase SDK          |
| Mass tour creation (spam)    | Rate limiting (to be implemented in middleware) |

## 7. Error Handling

### Client Errors (4xx):

| Status Code      | Scenario                   | Response                                 |
| ---------------- | -------------------------- | ---------------------------------------- |
| 400 Bad Request  | Missing required fields    | Validation error with field details      |
| 400 Bad Request  | Invalid data types         | Validation error with type information   |
| 400 Bad Request  | end_date before start_date | Validation error with message            |
| 400 Bad Request  | Negative limits/thresholds | Validation error with constraint details |
| 401 Unauthorized | Missing or invalid JWT     | Authentication error message             |

### Server Errors (5xx):

| Status Code               | Scenario                    | Response              | Logging                         |
| ------------------------- | --------------------------- | --------------------- | ------------------------------- |
| 500 Internal Server Error | Database connection failure | Generic error message | Log full error with stack trace |
| 500 Internal Server Error | Supabase insert failure     | Generic error message | Log Supabase error details      |
| 500 Internal Server Error | Unexpected exception        | Generic error message | Log exception with context      |

### Error Response Format:

```typescript
interface ErrorResponse {
  error: string;
  details?: Record<string, string[]>; // For validation errors
}
```

### Error Handling Strategy:

1. **Validation Errors:** Return detailed Zod error messages to help client fix issues
2. **Authentication Errors:** Return clear authentication failure message
3. **Database Errors:** Return generic message to client, log detailed error server-side
4. **Unexpected Errors:** Catch all exceptions, return 500, log with full context

## 8. Performance Considerations

### Potential Bottlenecks:

1. **Database Writes:** Tour creation involves two inserts (tours + participants)
2. **JWT Verification:** Performed on every request by middleware
3. **Validation Overhead:** Zod schema parsing adds minimal overhead

### Optimization Strategies:

1. **Single Query Chain:** Use Supabase's query chaining to minimize round trips
2. **RLS Optimization:** Database indexes on `owner_id` (already exists per schema)
3. **Connection Pooling:** Supabase handles connection pooling automatically
4. **Response Caching:** Not applicable for POST endpoints
5. **Validation Caching:** Compile Zod schemas once at module load time

### Scalability Considerations:

- **Database:** PostgreSQL can handle high write volumes
- **Indexes:** Existing indexes on `tours.owner_id` and `tours.status` support RLS policies
- **Rate Limiting:** Should be implemented to prevent abuse (future enhancement)

### Expected Performance:

- **Response Time:** < 200ms for successful creation
- **Concurrent Requests:** Limited by Supabase connection pool
- **Database Load:** Two inserts per request (tour + participant)

## 9. Implementation Steps

### Step 1: Create Validation Schema

- **File:** `src/lib/server/validation/tour.schemas.ts` (new file)
- **Action:** Define Zod schema for `CreateTourCommand`
- **Details:**
  - Import Zod and necessary types
  - Create `createTourCommandSchema` with:
    - Required: `title`, `destination`, `start_date`, `end_date`
    - Optional: `description`, `participant_limit`, `like_threshold`
    - String validations: min length, trim
    - Date validations: valid ISO strings, end_date > start_date
    - Number validations: positive integers for limits/thresholds
  - Add custom refinement to ensure `end_date` is after `start_date`
  - Export schema

### Step 2: Create Tour Service

- **File:** `src/lib/server/tour.service.ts` (new file)
- **Action:** Implement `TourService` class with `createTour` method
- **Details:**
  - Import Supabase client type and relevant DTOs
  - Create class with dependency injection for Supabase client
  - Implement `createTour(userId: string, command: CreateTourCommand)`:
    - Insert tour with `owner_id` set to `userId`
    - Get inserted tour ID
    - Insert participant record (`tour_id`, `user_id`)
    - Return complete tour object
  - Handle Supabase errors and throw appropriate exceptions
  - Use TypeScript strict mode for type safety

### Step 3: Implement API Endpoint

- **File:** `src/pages/api/tours.ts` (new file)
- **Action:** Create POST handler for `/api/tours`
- **Details:**
  - Add `export const prerender = false`
  - Import validation schema, service, and types
  - Implement `POST` function with `APIContext` parameter:
    - Check authentication: `if (!context.locals.user) return 401`
    - Parse request body as JSON
    - Validate with Zod schema, catch and return validation errors as 400
    - Initialize `TourService` with scoped Supabase client
    - Call `service.createTour()` with user ID and validated command
    - Return 201 with tour object
    - Wrap in try-catch for error handling
  - Return appropriate error responses based on error type

### Step 4: Handle Error Responses

- **File:** `src/pages/api/tours.ts`
- **Action:** Add comprehensive error handling
- **Details:**
  - Catch Zod validation errors: format and return as 400
  - Catch Supabase errors: log and return 500
  - Catch generic errors: log and return 500
  - Use consistent error response format
  - Log errors with context for debugging

### Step 5: Add Type Safety

- **Files:** Check `src/types.ts`
- **Action:** Verify `CreateTourCommand` and `TourDetailsDto` are properly defined
- **Details:**
  - Ensure types match API specification
  - Verify types are exported from `src/types.ts`
  - Update if necessary to match current implementation

### Step 6: Test Authentication Flow

- **Action:** Verify middleware authentication works correctly
- **Details:**
  - Check `src/middleware/index.ts` properly sets `Astro.locals.user`
  - Verify JWT validation is working
  - Test both authenticated and unauthenticated requests
  - Ensure 401 is returned when not authenticated

### Step 7: Verify Database Setup

- **Action:** Confirm RLS policies allow tour creation
- **Details:**
  - Review database schema and RLS policies
  - Verify INSERT policy on `tours` table allows authenticated users
  - Verify INSERT policy on `participants` table allows tour owners
  - Test with actual database if possible

### Step 8: Create Integration Tests (Optional but Recommended)

- **File:** `tests/api/tours.test.ts` (if tests exist)
- **Action:** Add tests for tour creation endpoint
- **Details:**
  - Test successful tour creation
  - Test authentication requirement
  - Test validation errors
  - Test database error handling
  - Test participant auto-creation

### Step 9: Update API Documentation

- **File:** `.ai/db-plan.md` or relevant documentation
- **Action:** Mark endpoint as implemented
- **Details:**
  - Update implementation status
  - Add any notes about implementation decisions
  - Document any deviations from original plan

## 10. Implementation Checklist

- [ ] Validation schema created with all required constraints
- [ ] Tour service implemented with createTour method
- [ ] API endpoint file created at `/api/tours.ts`
- [ ] POST handler implemented with proper error handling
- [ ] Authentication check added
- [ ] Input validation integrated
- [ ] Service layer integrated
- [ ] Error responses formatted correctly
- [ ] Type safety verified
- [ ] RLS policies confirmed to work
- [ ] Testing completed (manual or automated)
- [ ] Documentation updated
