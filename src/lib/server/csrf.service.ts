/**
 * CSRF (Cross-Site Request Forgery) protection service.
 * Generates and validates CSRF tokens to prevent unauthorized state-changing requests.
 */

import type { AstroCookies } from "astro";
import { isProduction } from "@/lib/server/env-validation.service";
import { daysInSeconds } from "@/lib/constants/time";

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generates a cryptographically secure random token.
 *
 * @returns A random hex string
 */
function generateToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Gets or creates a CSRF token for the current session.
 *
 * @param cookies - Astro cookies object
 * @returns The CSRF token
 */
export function getOrCreateCsrfToken(cookies: AstroCookies): string {
  const existingToken = cookies.get(CSRF_COOKIE_NAME)?.value;

  // Validate token length and format (must be valid hex string)
  if (existingToken && existingToken.length === CSRF_TOKEN_LENGTH * 2 && /^[0-9a-f]+$/.test(existingToken)) {
    return existingToken;
  }

  const newToken = generateToken();
  cookies.set(CSRF_COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: daysInSeconds(1),
  });

  return newToken;
}

/**
 * Validates a CSRF token from the request against the stored token.
 *
 * Supports two methods of token transmission:
 * 1. Header: X-CSRF-Token (for AJAX/fetch requests)
 * 2. Form field: csrf_token (for traditional form submissions)
 *
 * @param request - The incoming request
 * @param cookies - Astro cookies object
 * @returns True if the token is valid, false otherwise
 */
export async function validateCsrfToken(request: Request, cookies: AstroCookies): Promise<boolean> {
  const storedToken = cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!storedToken) {
    return false;
  }

  // Try to get token from header (AJAX/fetch requests)
  let requestToken = request.headers.get(CSRF_HEADER_NAME);

  // If no header, try to get from form data (traditional form submissions)
  if (!requestToken && request.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
    try {
      const formData = await request.clone().formData();
      requestToken = formData.get("csrf_token") as string | null;
    } catch {
      // If we can't parse form data, continue without token
      requestToken = null;
    }
  }

  if (!requestToken) {
    return false;
  }

  // Timing-safe comparison to prevent timing attacks
  return timingSafeEqual(storedToken, requestToken);
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal, false otherwise
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Authentication endpoints that should be exempt from CSRF protection.
 *
 * SECURITY RATIONALE:
 *
 * - /api/auth/magic-link (POST):
 *   - Unauthenticated endpoint - no session to hijack
 *   - Protected by rate limiting (3 requests per 15 minutes)
 *   - Sends email to user-provided address (attacker gains nothing)
 *   - CSRF doesn't apply without an existing authenticated session
 *
 * - /api/auth/session (POST):
 *   - Part of OAuth/PKCE callback flow
 *   - Called programmatically during authentication, not user action
 *   - Currently deprecated (see auth-callback.astro.deprecated)
 *   - TODO: Remove this endpoint when fully migrated to PKCE flow
 *
 * IMPORTANT: /api/auth/signout is NOT in this list and REQUIRES CSRF protection
 * because it's a state-changing operation on an authenticated session.
 */
const CSRF_EXEMPT_AUTH_ENDPOINTS = [
  "/api/auth/magic-link",
  "/api/auth/session", // TODO: Remove when deprecated endpoint is deleted
] as const;

/**
 * Middleware helper to check CSRF token for state-changing methods (POST, PUT, PATCH, DELETE).
 *
 * Implements defense-in-depth by protecting all state-changing operations unless
 * explicitly exempted for documented security reasons.
 *
 * @param request - The incoming request
 * @param cookies - Astro cookies object
 * @returns Response with 403 status if CSRF validation fails, null otherwise
 */
export async function checkCsrfProtection(request: Request, cookies: AstroCookies): Promise<Response | null> {
  const method = request.method.toUpperCase();

  // Only check CSRF for state-changing methods
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return null;
  }

  const url = new URL(request.url);

  // Check if this specific auth endpoint is exempt from CSRF protection
  const isExemptAuthEndpoint = CSRF_EXEMPT_AUTH_ENDPOINTS.some(
    (exemptPath) => url.pathname === exemptPath
  );

  if (isExemptAuthEndpoint) {
    return null;
  }

  const isValid = await validateCsrfToken(request, cookies);

  if (!isValid) {
    return new Response(
      JSON.stringify({
        error: "Invalid or missing CSRF token. Please refresh the page and try again.",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  return null;
}

/**
 * Gets the CSRF token header name for client-side usage.
 *
 * @returns The CSRF header name
 */
export function getCsrfHeaderName(): string {
  return CSRF_HEADER_NAME;
}
