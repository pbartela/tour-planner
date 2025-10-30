import type { APIRoute } from "astro";

import { tourService } from "@/lib/services/tour.service";
import { getToursQuerySchema, createTourCommandSchema } from "@/lib/validators/tour.validators";
import { checkCsrfProtection } from "@/lib/server/csrf.service";
import { secureError } from "@/lib/server/logger.service";
import { validateSession } from "@/lib/server/session-validation.service";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit.service";

export const prerender = false;

/**
 * GET /api/tours
 * Returns a paginated list of tours the authenticated user participates in.
 * Supports filtering by status (active/archived) and pagination.
 *
 * Query parameters:
 * - status: 'active' | 'archived' (default: 'active')
 * - page: number ≥ 1 (default: 1)
 * - limit: number ∈ [1, 100] (default: 20)
 *
 * Response: PaginatedToursDto
 * Errors: Standardized error format { error: { code: string, message: string } }
 */
export const GET: APIRoute = async ({ url, locals, request }) => {
  const { supabase } = locals;

  // Verify user session using session validation service
  const user = await validateSession(supabase);
  if (!user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Rate limiting: use user ID for authenticated users
  const clientId = getClientIdentifier(request, user.id);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.API);

  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({
        error: {
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded. Please try again later.",
        },
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(RATE_LIMIT_CONFIGS.API.maxRequests),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": String(rateLimitResult.resetAt),
        },
      }
    );
  }

  try {
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validation = getToursQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      // Format validation errors according to plan
      const errorDetails = validation.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("; ");
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: `Invalid query parameters: ${errorDetails}`,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch tours using the new service method
    const tours = await tourService.listToursForUser(supabase, user.id, validation.data);

    return new Response(JSON.stringify(tours), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    secureError("Unexpected error in GET /api/tours", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  // CSRF protection
  const csrfError = await checkCsrfProtection(request, cookies);
  if (csrfError) {
    return csrfError;
  }

  const { supabase } = locals;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = createTourCommandSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify(validation.error.flatten()), { status: 400 });
    }

    const { data: tour, error } = await tourService.createTour(supabase, {
      ...validation.data,
      start_date: validation.data.start_date.toISOString(),
      end_date: validation.data.end_date.toISOString(),
    });

    if (error) {
      return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }

    return new Response(JSON.stringify(tour), { status: 201 });
  } catch (error) {
    secureError("Unexpected error in POST /api/tours", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
};
