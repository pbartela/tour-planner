import type { APIRoute } from "astro";

import { voteService } from "@/lib/services/vote.service";
import { votesTourIdSchema } from "@/lib/validators/vote.validators";
import { checkCsrfProtection } from "@/lib/server/csrf.service";
import { secureError } from "@/lib/server/logger.service";
import { validateSession } from "@/lib/server/session-validation.service";

export const prerender = false;

/**
 * POST /api/tours/{tourId}/vote
 * Toggles the current user's vote on a tour.
 * If user has voted, removes the vote. If not, adds a vote.
 *
 * Response: ToggleVoteResponseDto (200 OK)
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
    const result = await voteService.toggleVote(supabase, user.id, tourIdValidation.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    secureError("Unexpected error in POST /api/tours/[tourId]/vote", error);

    // Check if error is due to voting being hidden or lack of permission
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    if (errorMessage.includes("hidden") || errorMessage.includes("permission")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "Voting is disabled or you don't have permission",
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
