import type { SupabaseClient } from "@/db/supabase.client";
import type { User } from "@/types";

/**
 * Validates a user session securely by verifying with Supabase server
 * @param supabase - Authenticated Supabase client
 * @returns Promise<User | null> - User object if valid, null if invalid/expired
 */
export async function validateSession(supabase: SupabaseClient): Promise<User | null> {
  try {
    // Verify the user is valid (this makes a server call to Supabase and validates JWT)
    // Note: getUser() is preferred over getSession() for server-side validation
    // as it validates the access token JWT on the server
    const {
      data: { user: serverUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !serverUser) {
      return null;
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", serverUser.id)
      .maybeSingle();

    if (profileError || !profile) {
      // Profile should exist - it's created via database trigger on user signup
      // If missing, log error and return null to trigger re-authentication
      console.error(`Profile not found for user ${serverUser.id}. Database trigger may have failed.`, profileError);
      return null;
    }

    return {
      id: serverUser.id,
      email: serverUser.email || "",
      profile,
    };
  } catch {
    return null;
  }
}

/**
 * Checks if a session is valid without returning user data
 * @param supabase - Authenticated Supabase client
 * @returns Promise<boolean> - True if session is valid
 */
export async function isSessionValid(supabase: SupabaseClient): Promise<boolean> {
  try {
    // Use getUser() to validate the session server-side
    // This validates the JWT on the server and checks if user is still valid
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    return !error && !!user;
  } catch {
    return false;
  }
}

/**
 * Securely invalidates a session
 * @param supabase - Authenticated Supabase client
 */
export async function invalidateSession(supabase: SupabaseClient): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // Silently handle signout errors
  }
}
