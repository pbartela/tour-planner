import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function createSupabaseAdminClient() {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  // CRITICAL: This must use SUPABASE_SERVICE_ROLE_KEY (without PUBLIC_ prefix)
  // This key grants admin privileges and must never be exposed to the client
  const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL or Service Role Key is not configured.");
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
