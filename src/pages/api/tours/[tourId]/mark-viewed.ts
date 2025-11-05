import type { APIRoute } from "astro";

import { tourActivityService } from "@/lib/services/tour-activity.service";
import { votesTourIdSchema } from "@/lib/validators/vote.validators";
import { checkCsrfProtection } from "@/lib/server/csrf.service";
import { secureError } from "@/lib/server/logger.service";
import { validateSession } from "@/lib/server/session-validation.service";

export const prerender = false;

/**
 * POST /api/tours/{tourId}/mark-viewed
 * Marks a tour as viewed by the current user.
 * Updates the last_viewed_at timestamp in tour_activity table.
 * This is used to determine if there is new activity on the tour.
 *
 * Response: { success: boolean } (200 OK)
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
    const result = await tourActivityService.markTourAsViewed(supabase, user.id, tourIdValidation.data);

    if (result.error) {
      throw result.error;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    secureError("Unexpected error in POST /api/tours/[tourId]/mark-viewed", error);

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
