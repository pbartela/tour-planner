import type { SupabaseClient } from "@/db/supabase.client";
import type { Database } from "@/db/database.types";
import type { AuthUser, AuthError } from "@supabase/supabase-js";

type AdminClient = SupabaseClient<Database>;

type GetUserByEmailResult = {
  user: AuthUser | null;
  error: AuthError | null;
};

export async function getUserByEmail(adminClient: AdminClient, email: string): Promise<GetUserByEmailResult> {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return { user: null, error: null };
  }

  const { data, error } = await adminClient.auth.admin.listUsers({
    email: normalizedEmail,
    perPage: 1,
    page: 1,
  });

  if (error) {
    return { user: null, error };
  }

  const user = data?.users?.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail) ?? null;

  return { user, error: null };
}

