import type { APIRoute } from "astro";

import { invitationService } from "@/lib/services/invitation.service";
import { secureError } from "@/lib/server/logger.service";
import { validateSession } from "@/lib/server/session-validation.service";

export const prerender = false;

/**
 * GET /api/invitations/pending
 * Returns all pending (non-expired) invitations for the authenticated user.
 * Used to display the pending invitations indicator in the navigation bar.
 *
 * Response: InvitationDto[] (200 OK) or 401 Unauthorized
 */
export const GET: APIRoute = async ({ locals }) => {
  const { supabase } = locals;

  // Validate session - user must be authenticated
  const user = await validateSession(supabase);
  if (!user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required to view pending invitations",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Get user email from authenticated user
  if (!user.email) {
    return new Response(
      JSON.stringify({
        error: {
          code: "BAD_REQUEST",
          message: "User email not found",
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Get pending invitations for the user
    const invitations = await invitationService.getUserPendingInvitations(supabase, user.email);

    return new Response(JSON.stringify(invitations), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    secureError("Unexpected error in GET /api/invitations/pending", error);
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
