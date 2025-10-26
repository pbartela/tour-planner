import type { APIRoute } from "astro";
import { getOrCreateCsrfToken } from "@/lib/server/csrf.service";

/**
 * API endpoint to retrieve the CSRF token.
 * This token should be included in the X-CSRF-Token header for all state-changing requests.
 */
export const GET: APIRoute = async ({ cookies }) => {
  const token = getOrCreateCsrfToken(cookies);

  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
};
