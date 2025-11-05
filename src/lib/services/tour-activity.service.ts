import type { SupabaseClient } from "@/db/supabase.client";
import { secureError } from "@/lib/server/logger.service";

class TourActivityService {
  /**
   * Marks a tour as viewed by the user.
   * Updates (or inserts) the last_viewed_at timestamp for the tour.
   * This is used to track when the user last opened the tour details.
   */
  public async markTourAsViewed(
    supabase: SupabaseClient,
    userId: string,
    tourId: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Upsert tour_activity record
      // If record exists for this user+tour, update last_viewed_at
      // If not, create new record
      const { error } = await supabase.from("tour_activity").upsert(
        {
          tour_id: tourId,
          user_id: userId,
          last_viewed_at: new Date().toISOString(),
        },
        {
          onConflict: "tour_id,user_id",
        }
      );

      if (error) {
        secureError("Error upserting tour activity", error);
        throw new Error("Failed to mark tour as viewed.");
      }

      return { success: true, error: null };
    } catch (error) {
      secureError("Unexpected error in markTourAsViewed", error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error("An unexpected error occurred."),
      };
    }
  }
}

export const tourActivityService = new TourActivityService();
