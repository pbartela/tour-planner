import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { ENV } from "@/lib/server/env-validation.service";

export function createSupabaseAdminClient() {
  // CRITICAL: This must use SUPABASE_SERVICE_ROLE_KEY (without PUBLIC_ prefix)
  // This key grants admin privileges and must never be exposed to the client
  // Environment variables are already validated at module load time
  const authUrl = ENV.SUPABASE_AUTH_URL ?? ENV.PUBLIC_SUPABASE_URL;

  return createClient<Database>(ENV.PUBLIC_SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      url: authUrl,
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
