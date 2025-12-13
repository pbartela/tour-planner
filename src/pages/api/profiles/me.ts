import type { APIRoute } from "astro";

import { createSupabaseAdminClient } from "@/db/supabase.admin.client";
import { profileService } from "@/lib/services/profile.service";
import { updateProfileCommandSchema } from "@/lib/validators/profile.validators";
import { handleDatabaseError } from "@/lib/utils/error-handler";
import { checkCsrfProtection } from "@/lib/server/csrf.service";
import { secureError } from "@/lib/server/logger.service";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit.service";
import { getClientIp, getUserAgent } from "@/lib/server/audit-log.service";
import { isAccountDeletionBlockedError } from "@/lib/errors/account-deletion.error";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const { supabase } = locals;

  // Get user from Supabase since middleware doesn't run for API routes
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later.",
        },
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const { data: profile, error } = await profileService.getProfile(supabase, user.id);

    if (error) {
      // The service already logged the detailed error
      return new Response(
        JSON.stringify({
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch profile",
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!profile) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Profile not found",
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(profile), { status: 200 });
  } catch (error) {
    secureError("Unexpected error in GET /api/profiles/me", error);
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

export const PATCH: APIRoute = async ({ request, locals, cookies }) => {
  // CSRF protection
  const csrfError = await checkCsrfProtection(request, cookies);
  if (csrfError) {
    return csrfError;
  }

  const { supabase } = locals;

  // Get user from Supabase since middleware doesn't run for API routes
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later.",
        },
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await request.json();
    const validation = updateProfileCommandSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify(validation.error.flatten()), { status: 400 });
    }

    const { data: updatedProfile, error } = await profileService.updateProfile(supabase, user.id, validation.data);

    if (error) {
      const { message, status } = handleDatabaseError(error);
      return new Response(
        JSON.stringify({
          error: {
            code: "DATABASE_ERROR",
            message,
          },
        }),
        {
          status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(updatedProfile), { status: 200 });
  } catch (error) {
    secureError("Unexpected error in PATCH /api/profiles/me", error);
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

export const DELETE: APIRoute = async ({ request, locals, cookies }) => {
  // CSRF protection
  const csrfError = await checkCsrfProtection(request, cookies);
  if (csrfError) {
    return csrfError;
  }

  const { supabase } = locals;

  // Get user from Supabase since middleware doesn't run for API routes
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later.",
        },
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const adminClient = createSupabaseAdminClient();
    // Type assertion needed due to complex Supabase generic type inference
    const { error } = await profileService.deleteAccount(
      supabase,
      adminClient as Parameters<typeof profileService.deleteAccount>[1],
      user.id,
      {
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      }
    );

    if (error) {
      // Check if it's a validation error using type guard (not hardcoded string matching)
      if (isAccountDeletionBlockedError(error)) {
        return new Response(
          JSON.stringify({
            error: {
              code: error.code,
              message: error.message,
              reasons: error.reasons,
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Generic error - log and return sanitized message
      secureError("Error deleting account", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete account",
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return 204 No Content on successful deletion
    return new Response(null, { status: 204 });
  } catch (error) {
    secureError("Unexpected error in DELETE /api/profiles/me", error);
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
