## API Endpoint Implementation Plan: GET /api/tours

### 1. Endpoint Overview
Returns a paginated list of tours the authenticated user participates in. Authorization is enforced by PostgreSQL RLS via a request-scoped Supabase client. Supports filtering by status (active or archived).

### 2. Request Details
- **HTTP Method**: GET
- **URL**: `/api/tours`
- **Query Parameters**:
  - status (optional): `active | archived` (default: `active`)
  - page (optional): integer ≥ 1 (default: `1`)
  - limit (optional): integer ∈ [1, 100] (default: `20`)
- **Headers**:
  - Authorization: `Bearer <SUPABASE_JWT>`
- **Astro API requirements**:
  - `export const prerender = false`
  - `export const GET = (ctx) => { ... }`
  - Validate inputs with zod

### 3. Used Types
- `PaginatedResponse<T>` from `src/types.ts`
- `TourSummaryDto` from `src/types.ts`
- `PaginatedToursDto` from `src/types.ts`

Response shape:
```
PaginatedToursDto = {
  data: TourSummaryDto[];
  pagination: { page: number; limit: number; total: number };
}

TourSummaryDto = {
  id: string;
  title: string;
  destination: string;
  start_date: string; // ISO
  end_date: string;   // ISO
  status: 'active' | 'archived';
  has_new_activity: boolean;
};
```

### 4. Response Details
- **200 OK** with body `PaginatedToursDto`
- Empty `data: []` if no tours
- Error responses in JSON with `{ error: { code: string, message: string } }`

### 5. Data Flow
1. Middleware/session extraction ensures request has a Supabase session (JWT) or the handler verifies it using `session-validation.service.ts`.
2. Parse and validate query parameters with zod (`status`, `page`, `limit`). On failure → 400.
3. Create a request-scoped Supabase client (`src/db/supabase.client.ts`) bound to the incoming request cookies/Authorization header.
4. Delegate to `tour.service.ts` function `listToursForUser({ userId, status, page, limit })`:
   - Uses RLS-safe select to fetch tours where current user participates.
   - Applies `status` filter.
   - Paginates using `range` and retrieves exact `total` count.
   - Selects only fields required by `TourSummaryDto`.
   - Computes `has_new_activity` (temporary: return `false` until activity tracking exists; add TODO to leverage comments/votes once defined).
5. Map service result to `PaginatedToursDto` and return 200.
6. Log unexpected errors with `logger.service.ts`. Map to 500 with safe message.

### 6. Security Considerations
- **Authentication**: Require valid Supabase session; return 401 if absent/invalid.
- **Authorization**: Depend on Postgres RLS; never use admin/service role key from this route.
- **Input validation**: Strict zod schema; coerce and clamp pagination.
- **Rate limiting**: Optionally use `rate-limit.service.ts` to mitigate scraping (e.g., IP + user key; 429 if exceeded). Not mandatory but recommended.
- **Data minimization**: Select only fields needed for summaries.
- **No enumeration**: On errors, avoid revealing presence/absence of specific tours.

### 7. Error Handling
- 400 Bad Request: zod validation errors for `status`, `page`, `limit`.
- 401 Unauthorized: missing/invalid session/JWT.
- 500 Internal Server Error: Supabase SDK/network/database failures.

Error body example:
```
{
  error: {
    code: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'INTERNAL_SERVER_ERROR',
    message: string
  }
}
```

Use `error-mapping.service.ts` if there is a predefined mapping; otherwise standardize messages.

### 8. Performance Considerations
- Database:
  - Rely on existing indexes: `participants(user_id)`, `idx_tours_status(status)`.
  - Filter by status at DB level.
  - Use `select(..., { count: 'exact' })` with paginated `range`.
- API:
  - Default `limit = 20`, cap `limit ≤ 100`.
  - Avoid N+1 queries; retrieve only needed columns.
  - Consider HTTP caching headers (short-lived) if user-specific caching is desired; otherwise skip due to per-user results.

### 9. Implementation Steps
1. Create zod schema for query params in `src/lib/validators/tour.validators.ts` (or extend existing):
   - `status: z.enum(['active','archived']).default('active')`
   - `page: z.coerce.number().int().min(1).default(1)`
   - `limit: z.coerce.number().int().min(1).max(100).default(20)`
2. In `src/lib/services/tour.service.ts`, add:
   - `async function listToursForUser(opts: { supabase: SupabaseClient; userId: string; status: 'active'|'archived'; page: number; limit: number; }): Promise<PaginatedToursDto>`
   - Query:
     - From `participants` where `user_id = userId` join/select related `tours` via RLS-safe view/query, or select from `tours` with an inner join like `.from('tours').select('id,title,destination,start_date,end_date,status', { count: 'exact' }).eq('status', opts.status).in('id', subqueryParticipantsIds)`; prefer a single query if possible using PostgREST embedded filters if participants relationship is exposed. Ensure the approach does not break RLS (queries executed as user).
     - Apply pagination: compute `from = (page-1)*limit; to = from + limit - 1` and use `.range(from, to)`.
     - Map rows into `TourSummaryDto[]`, set `has_new_activity: false` for now.
3. Implement handler in `src/pages/api/tours.ts`:
   - `export const prerender = false`.
   - `export async function GET(ctx) { ... }` per Astro 5 conventions.
   - Extract session via `session-validation.service.ts` (or use request-scoped supabase client and getUser) and return 401 if missing.
   - Parse query with zod; on failure return 400 with details.
   - Create request-scoped Supabase client (`supabase.client.ts`) bound to cookies/headers.
   - Call `listToursForUser` and return 200 with JSON.
   - Catch/log unexpected errors with `logger.service.ts` and return 500.
4. Add unit tests (if test infra exists) for validator and service pagination calculations.
5. Optionally integrate `rate-limit.service.ts` with a conservative policy; on exceed return 429 (outside current required codes but supported by infra). If added, document it.
6. Documentation: Ensure public API is consistent with `.ai/api-plan.md` (status defaults, pagination). Update any API reference if needed.

### 10. Example Pseudocode (Service)
```
async function listToursForUser({ supabase, userId, status, page, limit }) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Approach A: query tours via participants link (preferred if RLS relationships are available)
  const query = supabase
    .from('tours')
    .select('id,title,destination,start_date,end_date,status', { count: 'exact' })
    .eq('status', status)
    // ensure only tours where user is a participant; leverage RLS policies to restrict rows
    // If needed, chain a filter through a relationship exposed in PostgREST (e.g., participants!inner(user_id))
    .filter('participants.user_id', 'eq', userId)
    .range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const mapped = (data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    destination: t.destination,
    start_date: t.start_date,
    end_date: t.end_date,
    status: t.status,
    has_new_activity: false,
  }));

  return {
    data: mapped,
    pagination: { page, limit, total: count ?? 0 },
  };
}
```

Notes:
- If PostgREST relationship filter is not configured, fall back to selecting tours whose `id` is in a subquery of participant tour_ids fetched first (two queries) — still RLS-safe.
- Keep the service implementation self-contained and unit-testable.



