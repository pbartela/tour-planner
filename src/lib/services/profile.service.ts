import type { SupabaseClient } from "@/db/supabase.client";
import type { ProfileDto, UpdateProfileCommand } from "@/types";
import * as logger from "@/lib/server/logger.service";

class ProfileService {
  public async getProfile(
    supabase: SupabaseClient,
    userId: string
  ): Promise<{ data: ProfileDto | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

      if (error) {
        logger.error("Error fetching profile", error);
        throw new Error("Failed to fetch profile from the database.");
      }

      return { data, error: null };
    } catch (error) {
      logger.error("Unexpected error in getProfile", error instanceof Error ? error : undefined);
      return { data: null, error: error instanceof Error ? error : new Error("An unexpected error occurred.") };
    }
  }

  public async updateProfile(
    supabase: SupabaseClient,
    userId: string,
    command: UpdateProfileCommand
  ): Promise<{ data: ProfileDto | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.from("profiles").update(command).eq("id", userId).select().maybeSingle();

      if (error) {
        logger.error("Error updating profile", error);
        // Pass through the original error for better handling upstream
        throw new Error(error.message || "Failed to update profile in the database.");
      }

      return { data, error: null };
    } catch (error) {
      logger.error("Unexpected error in updateProfile", error instanceof Error ? error : undefined);
      return { data: null, error: error instanceof Error ? error : new Error("An unexpected error occurred.") };
    }
  }

  /**
   * Updates the recently used tags for a user.
   * Adds the new tag to the front of the array, removes duplicates,
   * and keeps only the last 10 tags.
   */
  public async updateRecentlyUsedTags(
    supabase: SupabaseClient,
    userId: string,
    tagName: string
  ): Promise<{ error: Error | null }> {
    try {
      // Get current profile
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("recently_used_tags")
        .eq("id", userId)
        .single();

      if (fetchError) {
        logger.error("Error fetching profile for recently used tags", fetchError);
        throw new Error("Failed to fetch profile.");
      }

      // Parse current tags (default to empty array if null)
      const currentTags = (profile?.recently_used_tags as string[]) || [];

      // Remove the tag if it already exists (to move it to the front)
      const filteredTags = currentTags.filter((tag) => tag !== tagName);

      // Add the new tag to the front and keep only the last 10
      const updatedTags = [tagName, ...filteredTags].slice(0, 10);

      // Update profile with new tags
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ recently_used_tags: updatedTags })
        .eq("id", userId);

      if (updateError) {
        logger.error("Error updating recently used tags", updateError);
        throw new Error("Failed to update recently used tags.");
      }

      return { error: null };
    } catch (error) {
      logger.error("Unexpected error in updateRecentlyUsedTags", error instanceof Error ? error : undefined);
      return { error: error instanceof Error ? error : new Error("An unexpected error occurred.") };
    }
  }
}

export const profileService = new ProfileService();
