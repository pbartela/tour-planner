import type { SupabaseClient } from "@/db/supabase.client";

/**
 * Error thrown when a tour cannot be found.
 */
export class TourNotFoundError extends Error {
  constructor(tourId: string) {
    super(`Tour not found: ${tourId}`);
    this.name = "TourNotFoundError";
  }
}

/**
 * Error thrown when tour status cannot be verified (e.g., RLS denial, DB error).
 */
export class TourStatusVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TourStatusVerificationError";
  }
}

/**
 * Checks if a tour is archived and throws an error if it is.
 * Archived tours are read-only and cannot be modified.
 *
 * @param supabase - Supabase client
 * @param tourId - Tour ID to check
 * @throws TourNotFoundError if tour doesn't exist
 * @throws TourStatusVerificationError if status cannot be verified
 * @throws Error if tour is archived
 */
export async function ensureTourNotArchived(supabase: SupabaseClient, tourId: string): Promise<void> {
  const { data, error } = await supabase.from("tours").select("status").eq("id", tourId).single();

  if (error) {
    // PGRST116 = "Searched for a single row but found 0 rows" (tour not found)
    if (error.code === "PGRST116") {
      throw new TourNotFoundError(tourId);
    }
    throw new TourStatusVerificationError("Failed to verify tour status.");
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
 * @throws TourNotFoundError if tour doesn't exist
 * @throws TourStatusVerificationError if status cannot be verified (e.g., RLS denial)
 */
export async function isTourArchived(supabase: SupabaseClient, tourId: string): Promise<boolean> {
  const { data, error } = await supabase.from("tours").select("status").eq("id", tourId).single();

  if (error) {
    // PGRST116 = "Searched for a single row but found 0 rows" (tour not found)
    if (error.code === "PGRST116") {
      throw new TourNotFoundError(tourId);
    }
    // Other errors (RLS denial, connection issues, etc.) should be thrown
    throw new TourStatusVerificationError("Failed to verify tour status.");
  }

  return data.status === "archived";
}
