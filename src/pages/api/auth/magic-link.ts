import type { APIRoute } from "astro";
import { MagicLinkSchema } from "src/lib/validators/auth.validators";
import { createSupabaseAdminClient } from "src/db/supabase.admin.client";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit.service";
import { secureError } from "@/lib/server/logger.service";

export const POST: APIRoute = async ({ request }) => {
  // Rate limiting: 3 requests per 15 minutes per client
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.MAGIC_LINK);

  if (!rateLimitResult.allowed) {
    const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000 / 60);
    return new Response(
      JSON.stringify({
        error: `Too many requests. Please try again in ${resetIn} minute${resetIn !== 1 ? "s" : ""}.`,
      }),
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(RATE_LIMIT_CONFIGS.MAGIC_LINK.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.floor(rateLimitResult.resetAt / 1000)),
        },
      }
    );
  }

  const data = await request.json();
  const parsedData = MagicLinkSchema.safeParse(data);

  if (!parsedData.success) {
    return new Response(JSON.stringify(parsedData.error), { status: 400 });
  }

  const { email, redirectTo, locale } = parsedData.data;

  // PKCE Flow: Redirect to /auth/confirm which will handle server-side token verification
  const redirectURL = new URL(request.url);
  redirectURL.pathname = "/auth/confirm";
  if (redirectTo) {
    redirectURL.searchParams.set("next", redirectTo);
  }
  if (locale) {
    redirectURL.searchParams.set("locale", locale);
  }

  // Use admin client for server-side auth operations
  const supabaseAdmin = createSupabaseAdminClient();

  // Use signInWithOtp which handles both existing and new users
  const { error } = await supabaseAdmin.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectURL.toString(),
      shouldCreateUser: true,
    },
  });

  if (error) {
    // Log the actual error for debugging, but don't expose internal details to the client
    // Uses secure logging to sanitize sensitive information in production
    secureError("Magic link generation failed", error);
    return new Response(JSON.stringify({ error: "Failed to send magic link. Please try again later." }), {
      status: 500,
    });
  }

  return new Response(
    JSON.stringify({ message: "Magic link sent successfully" }),
    {
      status: 200,
      headers: {
        "X-RateLimit-Limit": String(RATE_LIMIT_CONFIGS.MAGIC_LINK.maxRequests),
        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        "X-RateLimit-Reset": String(Math.floor(rateLimitResult.resetAt / 1000)),
      },
    }
  );
};
