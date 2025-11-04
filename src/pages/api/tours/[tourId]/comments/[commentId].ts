import type { APIRoute } from "astro";

import { commentService } from "@/lib/services/comment.service";
import { updateCommentCommandSchema, commentIdSchema, tourIdParamSchema } from "@/lib/validators/comment.validators";
import { checkCsrfProtection } from "@/lib/server/csrf.service";
import { secureError } from "@/lib/server/logger.service";
import { validateSession } from "@/lib/server/session-validation.service";

export const prerender = false;

/**
 * PATCH /api/tours/{tourId}/comments/{commentId}
 * Updates a comment. User must be the comment author.
 *
 * Request body: UpdateCommentCommand
 * Response: CommentDto (200 OK)
 */
export const PATCH: APIRoute = async ({ params, request, locals, cookies }) => {
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

  // Validate comment ID
  const commentIdValidation = commentIdSchema.safeParse(params.commentId);
  if (!commentIdValidation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "BAD_REQUEST",
          message: "Invalid comment ID format",
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await request.json();
    const validation = updateCommentCommandSchema.safeParse(body);

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

    const comment = await commentService.updateComment(supabase, commentIdValidation.data, validation.data);

    return new Response(JSON.stringify(comment), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    secureError("Unexpected error in PATCH /api/tours/[tourId]/comments/[commentId]", error);

    // RLS will prevent unauthorized updates
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    if (errorMessage.includes("permission")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "You don't have permission to update this comment",
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

/**
 * DELETE /api/tours/{tourId}/comments/{commentId}
 * Deletes a comment. User must be the comment author.
 *
 * Response: 204 No Content
 */
export const DELETE: APIRoute = async ({ params, request, locals, cookies }) => {
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

  // Validate comment ID
  const commentIdValidation = commentIdSchema.safeParse(params.commentId);
  if (!commentIdValidation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "BAD_REQUEST",
          message: "Invalid comment ID format",
        },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    await commentService.deleteComment(supabase, commentIdValidation.data);

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    secureError("Unexpected error in DELETE /api/tours/[tourId]/comments/[commentId]", error);

    // RLS will prevent unauthorized deletion
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    if (errorMessage.includes("permission")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "You don't have permission to delete this comment",
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
