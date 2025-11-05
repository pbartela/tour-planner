import type { APIRoute } from "astro";
import { validateSession } from "@/lib/server/session-validation.service";
import { tourService } from "@/lib/services/tour.service";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit.service";

export const prerender = false;

/**
 * POST /api/tours/{tourId}/voting/unlock
 * Unlocks voting for a tour (owner only)
 */
export const POST: APIRoute = async ({ params, locals, request }) => {
  const { supabase } = locals;
  const { tourId } = params;

  // Validate session
  const user = await validateSession(supabase);
  if (!user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in to unlock voting.",
        },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Rate limiting
  const clientId = getClientIdentifier(request, user.id);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.API);

  if (!rateLimitResult.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later.",
        },
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(rateLimitResult.retryAfter / 1000)),
        },
      }
    );
  }

  if (!tourId) {
    return new Response(
      JSON.stringify({
        error: {
          code: "INVALID_TOUR_ID",
          message: "Tour ID is required.",
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Unlock voting
  const { data, error } = await tourService.unlockVoting(supabase, tourId);

  if (error || !data) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNLOCK_VOTING_FAILED",
          message: error?.message || "Failed to unlock voting.",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
