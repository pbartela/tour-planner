import type { SupabaseClient } from "@/db/supabase.client";

/**
 * Checks if a tour is archived and throws an error if it is.
 * Archived tours are read-only and cannot be modified.
 *
 * @param supabase - Supabase client
 * @param tourId - Tour ID to check
 * @throws Error if tour is archived or status cannot be verified
 */
export async function ensureTourNotArchived(supabase: SupabaseClient, tourId: string): Promise<void> {
  const { data, error } = await supabase.from("tours").select("status").eq("id", tourId).single();

  if (error) {
    throw new Error("Failed to verify tour status.");
  }

  if (data.status === "archived") {
    throw new Error("Cannot modify an archived tour. Archived tours are read-only.");
  }
}

/**
 * Checks if a tour is archived.
 *
 * @param supabase - Supabase client
 * @param tourId - Tour ID to check
 * @returns true if tour is archived, false otherwise
 */
export async function isTourArchived(supabase: SupabaseClient, tourId: string): Promise<boolean> {
  const { data, error } = await supabase.from("tours").select("status").eq("id", tourId).single();

  if (error) {
    // If we can't determine status, assume not archived to avoid blocking operations
    return false;
  }

  return data.status === "archived";
}
