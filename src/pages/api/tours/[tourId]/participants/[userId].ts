import type { APIRoute } from "astro";
import { participantService } from "@/lib/services/participant.service";
import { checkCsrfProtection } from "@/lib/server/csrf.service";
import { secureError } from "@/lib/server/logger.service";
import { validateSession } from "@/lib/server/session-validation.service";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit.service";

export const prerender = false;

/**
 * DELETE /api/tours/{tourId}/participants/{userId}
 * Removes a participant from a tour.
 *
 * Authorization:
 * - Participant can remove themselves (leave the tour)
 * - Tour owner can remove any participant
 * - Owner cannot leave their own tour (must delete tour instead)
 *
 * Path parameters:
 * - tourId: UUID of the tour
 * - userId: UUID of the participant to remove
 *
 * Response: 204 No Content
 * Errors: Standardized error format { error: { code: string, message: string } }
 */
export const DELETE: APIRoute = async ({ params, request, locals, cookies }) => {
  // CSRF protection
  const csrfError = await checkCsrfProtection(request, cookies);
  if (csrfError) {
    return csrfError;
  }

  const { supabase } = locals;

  // Verify user session
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

  try {
    const { tourId, userId } = params;

    if (!tourId || !userId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: "Tour ID and User ID are required",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tourId) || !uuidRegex.test(userId)) {
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: "Invalid tour ID or user ID format",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Remove the participant
    await participantService.removeParticipant(supabase, tourId, userId, user.id);

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    secureError("Unexpected error in DELETE /api/tours/[tourId]/participants/[userId]", error);

    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes("owner cannot leave")) {
        return new Response(
          JSON.stringify({
            error: {
              code: "FORBIDDEN",
              message: error.message,
            },
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message.includes("not authorized")) {
        return new Response(
          JSON.stringify({
            error: {
              code: "FORBIDDEN",
              message: error.message,
            },
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message.includes("not found")) {
        return new Response(
          JSON.stringify({
            error: {
              code: "NOT_FOUND",
              message: error.message,
            },
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

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
