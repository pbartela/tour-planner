import type { APIRoute } from "astro";
import { validateSession } from "@/lib/server/session-validation.service";
import { secureError } from "@/lib/server/logger.service";
import { ArchiveError, tagService } from "@/lib/services/tag.service";
import { TourNotFoundError, TourStatusVerificationError } from "@/lib/utils/tour-status.util";
import { addTagCommandSchema } from "@/lib/validators/tag.validators";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit.service";

export const prerender = false;

/**
 * GET /api/tours/{tourId}/tags
 * Retrieves all tags for a specific tour.
 * User must be a participant (enforced by RLS).
 */
export const GET: APIRoute = async ({ params, locals, request }) => {
  const { supabase } = locals;
  const { tourId } = params;

  try {
    // 1. Validate session
    const user = await validateSession(supabase);
    if (!user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to view tags.",
          },
        }),
        { status: 401 }
      );
    }

    // 2. Rate limiting
    const clientId = getClientIdentifier(request, user.id);
    const rateLimitResult = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.API);

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: {
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests. Please try again later.",
          },
        }),
        {
          status: 429,
          headers: {
          "Retry-After": Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          "X-RateLimit-Limit": (rateLimitResult.remaining + 1).toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
          },
        }
      );
    }

    // 3. Validate tour ID
    if (!tourId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: "Tour ID is required.",
          },
        }),
        { status: 400 }
      );
    }

    // 4. Get tags
    const tags = await tagService.getTagsForTour(supabase, tourId);

    return new Response(JSON.stringify(tags), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    secureError("Error in GET /api/tours/[tourId]/tags", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "An unexpected error occurred.",
        },
      }),
      { status: 500 }
    );
  }
};

/**
 * POST /api/tours/{tourId}/tags
 * Adds a tag to an archived tour.
 * Creates the tag if it doesn't exist (case-insensitive).
 * User must be a participant (enforced by RLS).
 * Only works on archived tours (enforced by service layer).
 */
export const POST: APIRoute = async ({ params, locals, request }) => {
  const { supabase } = locals;
  const { tourId } = params;

  try {
    // 1. Validate session
    const user = await validateSession(supabase);
    if (!user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to add tags.",
          },
        }),
        { status: 401 }
      );
    }

    // 2. Rate limiting
    const clientId = getClientIdentifier(request, user.id);
    const rateLimitResult = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.API);

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: {
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests. Please try again later.",
          },
        }),
        {
          status: 429,
          headers: {
          "Retry-After": Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          "X-RateLimit-Limit": (rateLimitResult.remaining + 1).toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
          },
        }
      );
    }

    // 3. Validate tour ID
    if (!tourId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: "Tour ID is required.",
          },
        }),
        { status: 400 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const parsed = addTagCommandSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: "Invalid request body.",
            details: parsed.error.errors,
          },
        }),
        { status: 400 }
      );
    }

    // 5. Add tag to tour
    const tag = await tagService.addTagToTour(supabase, user.id, tourId, parsed.data.tag_name);

    return new Response(JSON.stringify(tag), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    secureError("Error in POST /api/tours/[tourId]/tags", error);

    // Handle tour not found
    if (error instanceof TourNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Tour not found.",
          },
        }),
        { status: 404 }
      );
    }

    // Handle tour status verification errors (RLS denial, etc.)
    if (error instanceof TourStatusVerificationError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "You don't have permission to access this tour.",
          },
        }),
        { status: 403 }
      );
    }

    // Handle archive constraint (tags only on archived tours)
    if (error instanceof ArchiveError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: error.message,
          },
        }),
        { status: 403 }
      );
    }

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "An unexpected error occurred.",
        },
      }),
      { status: 500 }
    );
  }
};
