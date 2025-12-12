import type { SupabaseClient } from "@/db/supabase.client";
import { secureError } from "@/lib/server/logger.service";

class ParticipantService {
  /**
   * Removes a participant from a tour.
   * Can be called by:
   * 1. The participant themselves (to leave the tour)
   * 2. The tour owner (to remove a participant)
   *
   * Enforces business rules:
   * - Owner cannot leave their own tour (must delete tour instead)
   * - RLS policies ensure only authorized users can remove participants
   */
  public async removeParticipant(
    supabase: SupabaseClient,
    tourId: string,
    participantUserId: string,
    requestingUserId: string
  ): Promise<void> {
    try {
      // Get tour details to check ownership
      const { data: tour, error: tourError } = await supabase
        .from("tours")
        .select("owner_id")
        .eq("id", tourId)
        .maybeSingle();

      if (tourError) {
        secureError("Error fetching tour for participant removal", tourError);
        throw new Error("Failed to fetch tour details.");
      }

      if (!tour) {
        throw new Error("Tour not found.");
      }

      // Business rule: Owner cannot leave their own tour
      if (tour.owner_id === participantUserId) {
        throw new Error("Tour owner cannot leave the tour. Delete the tour instead.");
      }

      // Check authorization:
      // 1. User is removing themselves (leaving the tour)
      // 2. User is the tour owner (removing another participant)
      const isSelfRemoval = requestingUserId === participantUserId;
      const isOwnerRemoval = requestingUserId === tour.owner_id;

      if (!isSelfRemoval && !isOwnerRemoval) {
        throw new Error("You are not authorized to remove this participant.");
      }

      // Remove the participant's vote first (if any) to prevent orphaned likes
      const { error: voteDeleteError } = await supabase
        .from("votes")
        .delete()
        .eq("tour_id", tourId)
        .eq("user_id", participantUserId);

      if (voteDeleteError) {
        secureError("Error removing participant vote from tour", voteDeleteError);
        throw new Error("Failed to remove participant vote from the tour.");
      }

      // Remove the participant
      const { error: deleteError } = await supabase
        .from("participants")
        .delete()
        .eq("tour_id", tourId)
        .eq("user_id", participantUserId);

      if (deleteError) {
        secureError("Error removing participant from tour", deleteError);
        throw new Error("Failed to remove participant from the tour.");
      }
    } catch (error) {
      secureError("Unexpected error in removeParticipant", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }
}

export const participantService = new ParticipantService();
