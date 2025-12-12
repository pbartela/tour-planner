import type { SupabaseClient } from "@/db/supabase.client";
import { secureError } from "@/lib/server/logger.service";
import type { TourVotesDto, ToggleVoteResponseDto } from "@/types";
import { ensureTourNotArchived } from "@/lib/utils/tour-status.util";

class VoteService {
  /**
   * Gets the votes for a tour.
   * Returns the count and list of user IDs who voted.
   */
  public async getTourVotes(supabase: SupabaseClient, tourId: string): Promise<TourVotesDto> {
    try {
      const { data: votes, error } = await supabase.from("votes").select("user_id").eq("tour_id", tourId);

      if (error) {
        secureError("Error fetching votes from database", error);
        throw new Error("Failed to fetch votes from the database.");
      }

      return {
        count: votes?.length ?? 0,
        users: votes?.map((v) => v.user_id) ?? [],
      };
    } catch (error) {
      secureError("Unexpected error in getTourVotes", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }

  /**
   * Toggles a vote for a tour.
   * If the user has already voted, removes the vote.
   * If the user hasn't voted, adds the vote.
   * Returns whether vote was added or removed.
   */
  public async toggleVote(supabase: SupabaseClient, userId: string, tourId: string): Promise<ToggleVoteResponseDto> {
    try {
      // Prevent voting on archived tours
      await ensureTourNotArchived(supabase, tourId);

      // Check if vote exists
      const { data: existingVote, error: checkError } = await supabase
        .from("votes")
        .select("tour_id, user_id")
        .eq("tour_id", tourId)
        .eq("user_id", userId)
        .maybeSingle();

      if (checkError) {
        secureError("Error checking existing vote", checkError);
        throw new Error("Failed to check vote status.");
      }

      if (existingVote) {
        // Vote exists - remove it
        const { error: deleteError } = await supabase
          .from("votes")
          .delete()
          .eq("tour_id", tourId)
          .eq("user_id", userId);

        if (deleteError) {
          secureError("Error removing vote", deleteError);
          throw new Error("Failed to remove vote. Voting may be hidden or you may not have permission.");
        }

        // Update tour's updated_at to trigger new activity indicator
        const { error: tourUpdateError } = await supabase
          .from("tours")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", tourId);

        if (tourUpdateError) {
          secureError("Error updating tour timestamp after vote removal", tourUpdateError);
          // Don't throw - vote was removed successfully, timestamp update is non-critical
        }

        return { message: "Vote removed" };
      } else {
        // No vote - add it
        const { error: insertError } = await supabase.from("votes").insert({
          tour_id: tourId,
          user_id: userId,
        });

        if (insertError) {
          secureError("Error adding vote", insertError);
          throw new Error("Failed to add vote. Voting may be hidden or you may not have permission.");
        }

        // Update tour's updated_at to trigger new activity indicator
        const { error: tourUpdateError } = await supabase
          .from("tours")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", tourId);

        if (tourUpdateError) {
          secureError("Error updating tour timestamp after vote addition", tourUpdateError);
          // Don't throw - vote was added successfully, timestamp update is non-critical
        }

        return { message: "Vote added" };
      }
    } catch (error) {
      secureError("Unexpected error in toggleVote", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }
}

export const voteService = new VoteService();
