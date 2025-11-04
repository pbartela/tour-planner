import type { APIRoute } from "astro";

import { voteService } from "@/lib/services/vote.service";
import { votesTourIdSchema } from "@/lib/validators/vote.validators";
import { secureError } from "@/lib/server/logger.service";
import { validateSession } from "@/lib/server/session-validation.service";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit.service";

export const prerender = false;

/**
 * GET /api/tours/{tourId}/votes
 * Returns vote information for a tour (count and list of user IDs).
 *
 * Response: TourVotesDto
 */
export const GET: APIRoute = async ({ params, locals, request }) => {
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
  const tourIdValidation = votesTourIdSchema.safeParse(params.tourId);
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
    const votes = await voteService.getTourVotes(supabase, tourIdValidation.data);

    return new Response(JSON.stringify(votes), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    secureError("Unexpected error in GET /api/tours/[tourId]/votes", error);

    // Check if error is due to lack of permission (not a participant)
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    if (errorMessage.includes("permission")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "You must be a participant to view votes",
          },
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
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
