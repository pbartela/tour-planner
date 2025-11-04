import type { APIRoute } from "astro";

import { invitationService } from "@/lib/services/invitation.service";
import { invitationTokenSchema } from "@/lib/validators/invitation.validators";
import { secureError } from "@/lib/server/logger.service";
import { validateSession } from "@/lib/server/session-validation.service";

export const prerender = false;

/**
 * GET /api/invitations?token={token}
 * Returns invitation details by token.
 * Requires authentication - user must be logged in to view invitations.
 * Used on the invitation acceptance page after authentication.
 *
 * Query parameter: token (string, 32-64 characters)
 * Response: InvitationByTokenDto (200 OK), 401 Unauthorized, or 404 Not Found
 */
export const GET: APIRoute = async ({ url, locals }) => {
  const { supabase } = locals;

  // Validate session - user must be authenticated
  const user = await validateSession(supabase);
  if (!user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required to view invitations",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Get token from query parameters
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(
      JSON.stringify({
        error: {
          code: "BAD_REQUEST",
          message: "Token query parameter is required",
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Validate token format
  const tokenValidation = invitationTokenSchema.safeParse(token);
  if (!tokenValidation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "BAD_REQUEST",
          message: "Invalid token format",
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Get invitation using authenticated client
    // The RLS policy ensures user's email matches the invitation email
    const invitation = await invitationService.getInvitationByToken(supabase, tokenValidation.data);

    if (!invitation) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Invitation not found or expired",
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (invitation.is_expired) {
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: "This invitation has expired",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(invitation), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    secureError("Unexpected error in GET /api/invitations?token=", error);
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
