import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { Database } from "../db/database.types.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

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
 */
export const createSupabaseServerClient = (cookies: AstroCookies): SupabaseClient<Database> => {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };

  return createServerClient<Database>(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(key: string) {
        return cookies.get(key)?.value;
      },
      set(key: string, value: string, options: CookieOptions) {
        cookies.set(key, value, { ...cookieOptions, ...options });
      },
      remove(key: string, options: CookieOptions) {
        cookies.delete(key, { ...cookieOptions, ...options });
      },
    },
    cookieOptions,
  });
};
