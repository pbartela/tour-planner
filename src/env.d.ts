/// <reference types="astro/client" />

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";
import type { User } from "./types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      session: Session | null;
      user: User | undefined;
      cookies: {
        delete(name: "sb-access-token" | "sb-refresh-token", options?: import("astro").CookieDeleteOptions): void;
      };
    }
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
