import type { SupabaseClient } from "@/db/supabase.client";
import type { Database } from "@/db/database.types";
import type { AuthUser, AuthError } from "@supabase/supabase-js";

type AdminClient = SupabaseClient<Database>;

interface GetUserByEmailResult {
  user: AuthUser | null;
  error: AuthError | null;
}

export async function getUserByEmail(adminClient: AdminClient, email: string): Promise<GetUserByEmailResult> {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return { user: null, error: null };
  }

  // Use RPC function to securely query auth.users table
  const { data, error } = await adminClient.rpc("get_user_by_email", {
    search_email: normalizedEmail,
  });

  if (error) {
    return { user: null, error: error as unknown as AuthError };
  }

  // RPC returns array, get first result (or null)
  const userRecord = data?.[0] ?? null;

  if (!userRecord) {
    return { user: null, error: null };
  }

  // Map RPC result to AuthUser format
  const user: AuthUser = {
    id: userRecord.id,
    email: userRecord.email,
    email_confirmed_at: userRecord.email_confirmed_at,
    created_at: userRecord.created_at,
    updated_at: userRecord.updated_at,
    user_metadata: (userRecord.raw_user_meta_data ?? {}) as AuthUser["user_metadata"],
    app_metadata: (userRecord.raw_app_meta_data ?? {}) as AuthUser["app_metadata"],
    aud: "authenticated",
    role: "authenticated",
  };

  return { user, error: null };
}
