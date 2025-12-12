import type { APIRoute } from "astro";

import { invitationService } from "@/lib/services/invitation.service";
import {
  inviteParticipantsCommandSchema,
  tourIdParamSchema,
  paginationSchema,
} from "@/lib/validators/invitation.validators";
import { checkCsrfProtection } from "@/lib/server/csrf.service";
import { secureError } from "@/lib/server/logger.service";
import { validateSession } from "@/lib/server/session-validation.service";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit.service";
import { tourService } from "@/lib/services/tour.service";

export const prerender = false;

/**
 * GET /api/tours/{tourId}/invitations?page={page}&limit={limit}
 * Returns a paginated list of invitations for a tour.
 * Only accessible by tour owner (enforced by RLS).
 *
 * Query parameters:
 * - page (optional): Page number (default: 1, min: 1)
 * - limit (optional): Items per page (default: 20, min: 1, max: 100)
 *
 * Response: PaginatedInvitationsDto (200 OK)
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

  // Parse and validate pagination parameters
  const paginationParams = {
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
  };

  const paginationValidation = paginationSchema.safeParse(paginationParams);
  if (!paginationValidation.success) {
    const errorDetails = paginationValidation.error.errors
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join("; ");
    return new Response(
      JSON.stringify({
        error: {
          code: "BAD_REQUEST",
          message: `Invalid pagination parameters: ${errorDetails}`,
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { page = 1, limit = 20 } = paginationValidation.data;

  try {
    // Verify user is tour owner (RLS will also enforce this, but explicit check gives better errors)
    const tourResult = await tourService.getTourDetails(supabase, tourIdValidation.data);
    if (!tourResult.data || tourResult.error || tourResult.data.owner_id !== user.id) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "Only the tour owner can view invitations",
          },
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const invitations = await invitationService.listTourInvitations(supabase, tourIdValidation.data, page, limit);

    return new Response(JSON.stringify(invitations), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    secureError("Unexpected error in GET /api/tours/[tourId]/invitations", error);
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
 * POST /api/tours/{tourId}/invitations
 * Sends email invitations to join a tour.
 * Only the tour owner can invite (enforced by RLS).
 *
 * Request body: InviteParticipantsCommand
 * Response: SendInvitationsResponse (200 OK)
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
    // Verify user is tour owner
    const tourResult = await tourService.getTourDetails(supabase, tourIdValidation.data);
    if (!tourResult.data || tourResult.error || tourResult.data.owner_id !== user.id) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "Only the tour owner can send invitations",
          },
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = inviteParticipantsCommandSchema.safeParse(body);

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

    // Tour-specific rate limiting for invitation sending (10 requests per hour per tour)
    const invitationRateLimitId = `invitations:tour:${tourIdValidation.data}:user:${user.id}`;
    const invitationRateLimit = checkRateLimit(invitationRateLimitId, RATE_LIMIT_CONFIGS.TOUR_INVITATIONS);

    if (!invitationRateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: {
            code: "TOO_MANY_REQUESTS",
            message: "Too many invitation requests. Please try again later.",
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((invitationRateLimit.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(RATE_LIMIT_CONFIGS.TOUR_INVITATIONS.maxRequests),
            "X-RateLimit-Remaining": String(invitationRateLimit.remaining),
            "X-RateLimit-Reset": String(invitationRateLimit.resetAt),
          },
        }
      );
    }

    // Get site URL from request for invitation links
    const siteUrl = new URL(request.url).origin;

    const result = await invitationService.sendInvitations(
      supabase,
      tourIdValidation.data,
      user.id,
      validation.data.emails,
      siteUrl
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    secureError("Unexpected error in POST /api/tours/[tourId]/invitations", error);

    // Check if error is due to lack of permission
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    if (errorMessage.includes("permission") || errorMessage.includes("owner")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "You don't have permission to send invitations",
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
