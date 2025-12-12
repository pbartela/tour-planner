import type { APIRoute } from "astro";
import { validateSession } from "@/lib/server/session-validation.service";
import { secureError } from "@/lib/server/logger.service";
import { tagService, ArchiveError } from "@/lib/services/tag.service";
import { TourNotFoundError, TourStatusVerificationError } from "@/lib/utils/tour-status.util";
import { tagIdSchema } from "@/lib/validators/tag.validators";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit.service";

export const prerender = false;

/**
 * DELETE /api/tours/{tourId}/tags/{tagId}
 * Removes a tag from an archived tour.
 * User must be a participant (enforced by RLS).
 * Only works on archived tours (enforced by service layer).
 */
export const DELETE: APIRoute = async ({ params, locals, request }) => {
  const { supabase } = locals;
  const { tourId, tagId } = params;

  try {
    // 1. Validate session
    const user = await validateSession(supabase);
    if (!user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to remove tags.",
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

    // 4. Validate and parse tag ID
    const parsedTagId = tagIdSchema.safeParse(tagId);
    if (!parsedTagId.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: "Invalid tag ID.",
            details: parsedTagId.error.errors,
          },
        }),
        { status: 400 }
      );
    }

    // 5. Remove tag from tour
    await tagService.removeTagFromTour(supabase, tourId, parsedTagId.data);

    return new Response(null, { status: 204 });
  } catch (error) {
    secureError("Error in DELETE /api/tours/[tourId]/tags/[tagId]", error);

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

    // Check for ArchiveError (tags can only be removed from archived tours)
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
