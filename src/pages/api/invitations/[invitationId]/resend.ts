import type { APIRoute } from "astro";

import { invitationService } from "@/lib/services/invitation.service";
import { invitationIdSchema } from "@/lib/validators/invitation.validators";
import { checkCsrfProtection } from "@/lib/server/csrf.service";
import { secureError } from "@/lib/server/logger.service";
import { validateSession } from "@/lib/server/session-validation.service";
import { tourService } from "@/lib/services/tour.service";
import { ENV } from "@/lib/server/env-validation.service";

export const prerender = false;

/**
 * POST /api/invitations/{invitationId}/resend
 * Resends an invitation for declined or expired invitations.
 * Resets status to pending, generates new token, and sends email.
 * Only the tour owner can resend invitations (enforced by RLS).
 *
 * Response: 204 No Content on success
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

  // Validate invitation ID
  const invitationIdValidation = invitationIdSchema.safeParse(params.invitationId);
  if (!invitationIdValidation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "BAD_REQUEST",
          message: "Invalid invitation ID format",
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // First, get the invitation to verify ownership and status
    const { data: invitation, error: fetchError } = await supabase
      .from("invitations")
      .select("tour_id, status, expires_at")
      .eq("id", invitationIdValidation.data)
      .maybeSingle();

    if (fetchError) {
      secureError("Error fetching invitation", fetchError);
      throw new Error("Failed to fetch invitation");
    }

    if (!invitation) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Invitation not found",
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if invitation is already accepted (can't resend accepted invitations)
    if (invitation.status === "accepted") {
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: "Cannot resend an accepted invitation",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify user is tour owner
    const tourResult = await tourService.getTourDetails(supabase, invitation.tour_id);
    if (!tourResult.data || tourResult.error || tourResult.data.owner_id !== user.id) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "Only the tour owner can resend invitations",
          },
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Resend the invitation (RLS will also enforce ownership)
    await invitationService.resendInvitation(
      supabase,
      invitationIdValidation.data,
      user.id,
      ENV.PUBLIC_SITE_URL
    );

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    secureError("Unexpected error in POST /api/invitations/[invitationId]/resend", error);

    // Check if error is due to lack of permission
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    if (errorMessage.includes("permission") || errorMessage.includes("owner")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "You don't have permission to resend this invitation",
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
          message: errorMessage,
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

