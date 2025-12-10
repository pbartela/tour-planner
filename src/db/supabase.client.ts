import { createBrowserClient, createServerClient, parseCookieHeader, type CookieOptions } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { Database } from "../db/database.types.ts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { weeksInSeconds } from "@/lib/constants/time";

export type { SupabaseClient };

/**
 * For use in client-side components. This is a singleton instance.
 * Uses import.meta.env directly to avoid importing server-only code.
 */
export const supabaseBrowserClient = createBrowserClient<Database>(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

/**
 * For use in server-side code (middleware, API routes).
 * Creates a new client for each request with secure cookie options.
 * @param request - The incoming request object (used to read cookies)
 * @param cookies - The Astro cookies object (used to set cookies)
 */
export const createSupabaseServerClient = (request: Request, cookies: AstroCookies): SupabaseClient<Database> => {
  // Use import.meta.env directly to avoid importing server-only validation code
  const isProduction = import.meta.env.PROD;
  const authUrl = import.meta.env.SUPABASE_AUTH_URL ?? import.meta.env.PUBLIC_SUPABASE_URL;

  const defaultCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: weeksInSeconds(1),
  };

  // Check for Authorization header (for API testing with Bearer tokens)
  const authHeader = request.headers.get("Authorization");
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientOptions: any = {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("Cookie") ?? "").map(({ name, value }) => ({
          name,
          value: value ?? "",
        }));
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, { ...defaultCookieOptions, ...options });
        });
      },
    },
    auth: {
      url: authUrl,
    },
  };

  // If Authorization header is present, pass it to the Supabase client
  // This allows API testing with Bearer tokens while keeping cookie-based auth for browsers
  if (accessToken) {
    clientOptions.global = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }

  return createServerClient<Database>(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, clientOptions);
};
