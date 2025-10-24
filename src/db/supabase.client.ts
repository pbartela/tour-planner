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
 * Creates a new client for each request.
 */
export const createSupabaseServerClient = (cookies: AstroCookies): SupabaseClient<Database> => {
  return createServerClient<Database>(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(key: string) {
        return cookies.get(key)?.value;
      },
      set(key: string, value: string, options: CookieOptions) {
        cookies.set(key, value, options);
      },
      remove(key: string, options: CookieOptions) {
        cookies.delete(key, options);
      },
    },
  });
};
