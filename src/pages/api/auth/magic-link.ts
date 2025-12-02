import type { APIRoute } from "astro";
import { MagicLinkSchema } from "src/lib/validators/auth.validators";
import { createSupabaseAdminClient } from "src/db/supabase.admin.client";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit.service";
import { secureError } from "@/lib/server/logger.service";
import { sendAuthEmail } from "@/lib/server/email.service";
import { randomBytes } from "node:crypto";

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

  const { email, redirectTo } = parsedData.data;
  // Note: locale is parsed but not currently used in email template
  // It's kept for potential future i18n email support

  // Use admin client for server-side auth operations
  const supabaseAdmin = createSupabaseAdminClient();

  try {
    // Generate cryptographically secure OTP token (32 bytes = 64 hex chars)
    const otpToken = randomBytes(32).toString("hex");

    // OTP expires in 1 hour
    const otpExpiresAt = new Date();
    otpExpiresAt.setHours(otpExpiresAt.getHours() + 1);

    // Store OTP in database
    const { error: otpError } = await supabaseAdmin.from("auth_otp").insert({
      email: email,
      otp_token: otpToken,
      redirect_to: redirectTo || null,
      expires_at: otpExpiresAt.toISOString(),
    });

    if (otpError) {
      secureError("Failed to store auth OTP", otpError);
      return new Response(JSON.stringify({ error: "Failed to send magic link. Please try again later." }), {
        status: 500,
      });
    }

    // Build authentication URL with OTP
    const baseUrl = new URL(request.url).origin;
    const loginUrl = `${baseUrl}/auth/verify-otp?otp=${otpToken}`;

    // Send custom authentication email
    const emailResult = await sendAuthEmail({
      to: email,
      loginUrl,
    });

    if (!emailResult.success) {
      secureError("Failed to send authentication email", { error: emailResult.error });
      return new Response(JSON.stringify({ error: "Failed to send magic link. Please try again later." }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: "Magic link sent successfully" }), {
      status: 200,
      headers: {
        "X-RateLimit-Limit": String(RATE_LIMIT_CONFIGS.MAGIC_LINK.maxRequests),
        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        "X-RateLimit-Reset": String(Math.floor(rateLimitResult.resetAt / 1000)),
      },
    });
  } catch (err) {
    secureError("Unexpected error in magic link generation", err);
    return new Response(JSON.stringify({ error: "Failed to send magic link. Please try again later." }), {
      status: 500,
    });
  }
};
