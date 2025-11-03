import type { APIRoute } from "astro";
import { z } from "zod";

import { invitationService } from "@/lib/services/invitation.service";
import { invitationIdSchema, invitationTokenSchema } from "@/lib/validators/invitation.validators";
import { checkCsrfProtection } from "@/lib/server/csrf.service";
import { secureError } from "@/lib/server/logger.service";
import { validateSession } from "@/lib/server/session-validation.service";

export const prerender = false;

const acceptInvitationBodySchema = z.object({
  token: invitationTokenSchema.optional(),
});

/**
 * POST /api/invitations/{invitationId}/accept
 * Accepts an invitation.
 * User must be authenticated and email must match invitation email.
 *
 * Request body (optional): { token: string } - if not provided, token is fetched from invitation
 * Response: AcceptInvitationResponse (200 OK)
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
    // Get invitation to retrieve token and verify email match
    const { data: invitation, error: fetchError } = await supabase
      .from("invitations")
      .select("token, email, status, expires_at")
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

    // Check if invitation is already accepted
    if (invitation.status === "accepted") {
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: "This invitation has already been accepted",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
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

    // Verify email match (the database function will also check this, but better to check early)
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "This invitation was sent to a different email address",
          },
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get token from invitation or request body
    let token = invitation.token;
    if (!token) {
      // Try to get from request body
      const body = await request.json().catch(() => ({}));
      const bodyValidation = acceptInvitationBodySchema.safeParse(body);
      if (bodyValidation.success && bodyValidation.data.token) {
        token = bodyValidation.data.token;
      }
    }

    if (!token) {
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: "Invitation token is missing",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Accept the invitation
    const result = await invitationService.acceptInvitation(supabase, token, user.id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    secureError("Unexpected error in POST /api/invitations/[invitationId]/accept", error);

    // Check for specific error types
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    if (errorMessage.includes("Invalid or expired")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: "This invitation is invalid or has expired",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    if (errorMessage.includes("email does not match")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "This invitation was sent to a different email address",
          },
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    if (errorMessage.includes("already a participant")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: "You are already a participant in this tour",
          },
        }),
        {
          status: 400,
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

