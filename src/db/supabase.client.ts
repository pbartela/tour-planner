import { createBrowserClient, createServerClient, parseCookieHeader, type CookieOptions } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { Database } from "../db/database.types.ts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isProduction } from "@/lib/server/env-validation.service";
import { weeksInSeconds } from "@/lib/constants/time";

export type { SupabaseClient };

/**
 * For use in client-side components. This is a singleton instance.
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
export const createSupabaseServerClient = (
  request: Request,
  cookies: AstroCookies
): SupabaseClient<Database> => {
  const defaultCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: weeksInSeconds(1),
  };

  return createServerClient<Database>(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("Cookie") ?? "").map(({ name, value }) => ({
          name,
          value: value ?? "",
        }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, { ...defaultCookieOptions, ...options });
        });
      },
    },
  });
};
