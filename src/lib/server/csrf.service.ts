/**
 * CSRF (Cross-Site Request Forgery) protection service.
 * Generates and validates CSRF tokens to prevent unauthorized state-changing requests.
 */

import type { AstroCookies } from "astro";

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

  if (existingToken && existingToken.length === CSRF_TOKEN_LENGTH * 2) {
    return existingToken;
  }

  const newToken = generateToken();
  cookies.set(CSRF_COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return newToken;
}

/**
 * Validates a CSRF token from the request against the stored token.
 *
 * @param request - The incoming request
 * @param cookies - Astro cookies object
 * @returns True if the token is valid, false otherwise
 */
export function validateCsrfToken(request: Request, cookies: AstroCookies): boolean {
  const storedToken = cookies.get(CSRF_COOKIE_NAME)?.value;
  const requestToken = request.headers.get(CSRF_HEADER_NAME);

  if (!storedToken || !requestToken) {
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
 * Middleware helper to check CSRF token for state-changing methods (POST, PUT, PATCH, DELETE).
 *
 * @param request - The incoming request
 * @param cookies - Astro cookies object
 * @returns Response with 403 status if CSRF validation fails, null otherwise
 */
export function checkCsrfProtection(request: Request, cookies: AstroCookies): Response | null {
  const method = request.method.toUpperCase();

  // Only check CSRF for state-changing methods
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return null;
  }

  // Skip CSRF check for authentication endpoints (they use other security measures)
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/auth/")) {
    return null;
  }

  if (!validateCsrfToken(request, cookies)) {
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
