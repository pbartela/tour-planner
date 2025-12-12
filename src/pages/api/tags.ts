import type { APIRoute } from "astro";
import { validateSession } from "@/lib/server/session-validation.service";
import { secureError } from "@/lib/server/logger.service";
import { tagService, type TagSuggestionDto } from "@/lib/services/tag.service";
import { profileService } from "@/lib/services/profile.service";
import { tagSearchQuerySchema } from "@/lib/validators/tag.validators";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit.service";

export const prerender = false;

/**
 * GET /api/tags
 * Search tags or get recently used tags.
 * Query parameters:
 *   - q: Search query (optional) - returns tags starting with this string
 *   - limit: Max results (optional, default: 10, max: 50)
 *
 * If no query is provided, returns the user's recently used tags (last 10).
 */
export const GET: APIRoute = async ({ url, locals, request }) => {
  const { supabase } = locals;

  try {
    // 1. Validate session
    const user = await validateSession(supabase);
    if (!user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to view tags.",
          },
        }),
        { status: 401 }
      );
    }

    // 2. Rate limiting
    const clientId = getClientIdentifier(request, user.id);
    const rateLimitResult = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.API);

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: {
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests. Please try again later.",
          },
        }),
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
            "X-RateLimit-Limit": (rateLimitResult.remaining + 1).toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
          },
        }
      );
    }

    // 3. Parse and validate query parameters
    const query = url.searchParams.get("q");
    const limitParam = url.searchParams.get("limit");

    const parsed = tagSearchQuerySchema.safeParse({
      q: query,
      limit: limitParam,
    });

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "BAD_REQUEST",
            message: "Invalid query parameters.",
            details: parsed.error.errors,
          },
        }),
        { status: 400 }
      );
    }

    // 4. Search or get recently used tags
    let suggestions: TagSuggestionDto[];
    if (parsed.data.q) {
      // Search tags by query - these are database tags with real IDs
      const dbTags = await tagService.searchTags(supabase, parsed.data.q, parsed.data.limit);
      suggestions = dbTags.map((tag) => ({
        source: "database" as const,
        id: tag.id,
        name: tag.name,
      }));
    } else {
      // Get user's recently used tags - these are just strings, no real IDs
      const { data: profile } = await profileService.getProfile(supabase, user.id);
      const recentTagNames = ((profile as any)?.recently_used_tags as string[]) || [];

      suggestions = recentTagNames.map((name) => ({
        source: "recent" as const,
        id: null,
        name,
      }));
    }

    return new Response(JSON.stringify(suggestions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    secureError("Error in GET /api/tags", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "An unexpected error occurred.",
        },
      }),
      { status: 500 }
    );
  }
};
