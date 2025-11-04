import type { APIRoute } from "astro";

import { commentService } from "@/lib/services/comment.service";
import {
  getCommentsQuerySchema,
  createCommentCommandSchema,
  tourIdParamSchema,
} from "@/lib/validators/comment.validators";
import { checkCsrfProtection } from "@/lib/server/csrf.service";
import { secureError } from "@/lib/server/logger.service";
import { validateSession } from "@/lib/server/session-validation.service";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit.service";

export const prerender = false;

/**
 * GET /api/tours/{tourId}/comments
 * Returns a paginated list of comments for a tour.
 *
 * Query parameters:
 * - page: number ≥ 1 (default: 1)
 * - limit: number ∈ [1, 100] (default: 20)
 *
 * Response: PaginatedCommentsDto
 */
export const GET: APIRoute = async ({ params, url, locals, request }) => {
  const { supabase } = locals;

  // Validate session
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

  // Rate limiting
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

  // Validate tour ID
  const tourIdValidation = tourIdParamSchema.safeParse(params.tourId);
  if (!tourIdValidation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "BAD_REQUEST",
          message: "Invalid tour ID format",
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validation = getCommentsQuerySchema.safeParse(queryParams);

    if (!validation.success) {
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

    const comments = await commentService.listCommentsForTour(supabase, tourIdValidation.data, validation.data);

    return new Response(JSON.stringify(comments), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    secureError("Unexpected error in GET /api/tours/[tourId]/comments", error);
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

/**
 * POST /api/tours/{tourId}/comments
 * Creates a new comment on a tour.
 *
 * Request body: CreateCommentCommand
 * Response: CommentDto (201 Created)
 */
export const POST: APIRoute = async ({ params, request, locals, cookies }) => {
  // CSRF protection
  const csrfError = await checkCsrfProtection(request, cookies);
  if (csrfError) {
    return csrfError;
  }

  const { supabase } = locals;

  // Validate session
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

  // Validate tour ID
  const tourIdValidation = tourIdParamSchema.safeParse(params.tourId);
  if (!tourIdValidation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "BAD_REQUEST",
          message: "Invalid tour ID format",
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await request.json();
    const validation = createCommentCommandSchema.safeParse(body);

    if (!validation.success) {
      const errorDetails = validation.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("; ");
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: `Validation error: ${errorDetails}`,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const comment = await commentService.createComment(supabase, user.id, tourIdValidation.data, validation.data);

    return new Response(JSON.stringify(comment), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    secureError("Unexpected error in POST /api/tours/[tourId]/comments", error);
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
