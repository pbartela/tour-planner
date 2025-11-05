---
description: Create an Astro API endpoint with proper validation and error handling
---

You are an expert in creating Astro API endpoints with TypeScript, Zod validation, and Supabase integration.

## API Endpoint Structure

All API endpoints go in `src/pages/api/` and follow Astro's file-based routing.

## Template

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";

// REQUIRED: Set prerender to false for dynamic routes
export const prerender = false;

/**
 * [Endpoint Name] - Brief description
 *
 * @route [METHOD] /api/[route]
 * @auth [required|optional|none]
 */

// Define request schema with Zod
const RequestSchema = z.object({
  field1: z.string().min(1, "Field1 is required"),
  field2: z.number().positive().optional(),
  field3: z.string().email("Invalid email format").optional(),
});

type RequestData = z.infer<typeof RequestSchema>;

// HTTP Method Handler (GET, POST, PUT, DELETE, PATCH)
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  // 1. AUTHENTICATION CHECK (if required)
  const supabase = locals.supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. PARSE REQUEST BODY
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. VALIDATE INPUT
  const validationResult = RequestSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: validationResult.error.flatten(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const data = validationResult.data;

  // 4. BUSINESS LOGIC
  try {
    // Call service layer for business logic
    const result = await someService.doSomething(supabase, user.id, data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in endpoint:", error);

    // Return user-friendly error
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

## Key Guidelines

### 1. Always Set Prerender

```typescript
// REQUIRED at top of file
export const prerender = false;
```

### 2. Use Uppercase HTTP Methods

```typescript
// Good
export const GET: APIRoute = async ({ locals }) => { ... };
export const POST: APIRoute = async ({ locals }) => { ... };
export const DELETE: APIRoute = async ({ locals }) => { ... };

// Bad
export const get: APIRoute = ...;  // lowercase not recommended
```

### 3. Validate with Zod

```typescript
import { z } from "zod";

// Simple schema
const Schema = z.object({
  name: z.string().min(1, "Name required"),
  age: z.number().int().positive(),
});

// Complex schema with transformations
const ComplexSchema = z
  .object({
    email: z.string().email().toLowerCase(),
    tags: z.array(z.string()).min(1).max(10),
    metadata: z.record(z.unknown()).optional(),
    createdAt: z.string().datetime().or(z.date()),
  })
  .transform((data) => ({
    ...data,
    createdAt: new Date(data.createdAt),
  }));

// Validate
const result = Schema.safeParse(data);
if (!result.success) {
  // Handle validation errors
  return errorResponse(400, result.error.flatten());
}
```

### 4. Access Supabase via Locals

```typescript
// Good: Use context.locals.supabase
const supabase = locals.supabase;
const { data, error } = await supabase.from("table_name").select("*");

// Bad: Don't import supabaseClient directly
import { supabaseClient } from "@/db/supabase.client"; // ❌
```

### 5. Extract Business Logic to Services

```typescript
// src/lib/services/tour.service.ts
export class TourService {
  static async createTour(supabase: SupabaseClient, userId: string, data: CreateTourData): Promise<Tour> {
    // Business logic here
    const { data: tour, error } = await supabase
      .from("tours")
      .insert({ ...data, user_id: userId })
      .select()
      .single();

    if (error) throw new Error(`Failed to create tour: ${error.message}`);
    return tour;
  }
}

// API endpoint
export const POST: APIRoute = async ({ locals, request }) => {
  // ... validation ...
  const result = await TourService.createTour(locals.supabase, user.id, validatedData);
  return jsonResponse(result, 200);
};
```

### 6. Consistent Error Handling

```typescript
// Helper function for consistent responses
function jsonResponse(data: unknown, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(status: number, error: string | object) {
  return jsonResponse(typeof error === "string" ? { error } : error, status);
}

// Usage in endpoint
export const POST: APIRoute = async (context) => {
  try {
    // ... logic ...
    return jsonResponse({ success: true, data: result });
  } catch (error) {
    console.error("Endpoint error:", error);
    return errorResponse(500, "Internal server error");
  }
};
```

## Common Patterns

### GET Endpoint (Query Parameters)

```typescript
export const GET: APIRoute = async ({ url, locals }) => {
  const searchParams = url.searchParams;
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = parseInt(searchParams.get("offset") || "0");

  // Validate query params
  if (limit < 1 || limit > 100) {
    return errorResponse(400, "Limit must be between 1 and 100");
  }

  const { data, error } = await locals.supabase
    .from("items")
    .select("*")
    .range(offset, offset + limit - 1);

  if (error) {
    return errorResponse(500, error.message);
  }

  return jsonResponse({ data, limit, offset });
};
```

### POST Endpoint (Create Resource)

```typescript
const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const user = await requireAuth(locals); // Helper function
  const body = await parseAndValidate(request, CreateSchema); // Helper function

  try {
    const result = await Service.create(locals.supabase, user.id, body);
    return jsonResponse(result, 201); // 201 Created
  } catch (error) {
    return errorResponse(500, error);
  }
};
```

### PUT/PATCH Endpoint (Update Resource)

```typescript
const UpdateSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
  })
  .refine((data) => data.title || data.description, {
    message: "At least one field must be provided",
  });

export const PATCH: APIRoute = async ({ request, locals }) => {
  const user = await requireAuth(locals);
  const body = await parseAndValidate(request, UpdateSchema);

  // Verify ownership
  const { data: existing } = await locals.supabase.from("items").select("user_id").eq("id", body.id).single();

  if (!existing || existing.user_id !== user.id) {
    return errorResponse(404, "Resource not found");
  }

  const result = await Service.update(locals.supabase, body.id, body);
  return jsonResponse(result);
};
```

### DELETE Endpoint

```typescript
export const DELETE: APIRoute = async ({ url, locals }) => {
  const user = await requireAuth(locals);
  const id = url.searchParams.get("id");

  if (!id) {
    return errorResponse(400, "ID parameter required");
  }

  // Verify ownership before delete
  const { data: existing } = await locals.supabase.from("items").select("user_id").eq("id", id).single();

  if (!existing || existing.user_id !== user.id) {
    return errorResponse(404, "Resource not found");
  }

  await Service.delete(locals.supabase, id);
  return jsonResponse({ success: true }, 204); // 204 No Content
};
```

## Helper Functions

Create reusable helpers in `src/lib/api-helpers.ts`:

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

export async function requireAuth(locals: App.Locals) {
  const {
    data: { user },
  } = await locals.supabase.auth.getUser();

  if (!user) {
    throw new AuthError("Unauthorized");
  }

  return user;
}

export async function parseAndValidate<T extends z.ZodTypeAny>(request: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ValidationError("Invalid JSON");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError("Validation failed", result.error.flatten());
  }

  return result.data;
}

export function jsonResponse(data: unknown, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(status: number, error: string | object) {
  return jsonResponse(typeof error === "string" ? { error } : error, status);
}

// Custom error classes
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class ValidationError extends Error {
  details?: unknown;
  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}
```

## Security Checklist

- [ ] Set `export const prerender = false`
- [ ] Validate all input with Zod schemas
- [ ] Check authentication when required
- [ ] Verify resource ownership before operations
- [ ] Use parameterized queries (Supabase handles this)
- [ ] Don't expose sensitive data in responses
- [ ] Rate limiting (implement if needed)
- [ ] CSRF protection (consider for state-changing operations)
- [ ] Proper CORS headers if needed
- [ ] Log errors server-side, return user-friendly messages

## Testing Considerations

When creating endpoints, consider:

- Valid request handling
- Invalid request handling (validation errors)
- Missing authentication
- Missing authorization (wrong user)
- Database errors
- Network errors
- Edge cases (empty data, large payloads)

## Process

1. **Define Requirements**: What does this endpoint do?
2. **Define Route**: Determine URL path and HTTP method
3. **Define Schema**: Create Zod schema for validation
4. **Implement Handler**: Write the endpoint logic
5. **Extract Logic**: Move business logic to service layer
6. **Add Security**: Authentication, authorization, validation
7. **Error Handling**: Proper error responses
8. **Test**: Test various scenarios
9. **Document**: Add JSDoc comments

## Output

Provide:

1. The complete API endpoint code
2. Service layer code if needed
3. Type definitions if needed
4. Explanation of design decisions
5. Example requests and responses
6. Any security considerations
