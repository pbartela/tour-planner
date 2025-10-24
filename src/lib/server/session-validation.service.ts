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

    // Get user profile from database with retry for new users
    let profile = null;
    let profileError = null;

    // Retry up to 3 times for new user profile creation
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await supabase.from("profiles").select("*").eq("id", serverUser.id).single();

      profile = result.data;
      profileError = result.error;

      if (profile) {
        break; // Profile found, exit retry loop
      }

      // If it's a "not found" error and this is a new user, wait and retry
      if (profileError?.code === "PGRST116" && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1))); // 100ms, 200ms delays
        continue;
      }

      break; // Exit retry loop for other errors or final attempt
    }

    if (profileError || !profile) {
      // If profile still doesn't exist after retries, try to create it manually
      // This handles cases where the database trigger failed
      if (profileError?.code === "PGRST116") {
        try {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({ id: serverUser.id })
            .select("*")
            .single();

          if (createError || !newProfile) {
            return null;
          }

          profile = newProfile;
        } catch {
          return null;
        }
      } else {
        return null;
      }
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
