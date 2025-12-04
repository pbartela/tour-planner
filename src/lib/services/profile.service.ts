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
   * Permanently deletes a user account and all associated data
   *
   * This method:
   * 1. Deletes the user's avatar from storage (if exists)
   * 2. Deletes tour_activity records
   * 3. Deletes the auth.users record, which triggers handle_user_deletion() that:
   *    - Transfers tour ownership or deletes tours
   *    - Deletes the profile
   *    - Anonymizes comments
   *    - Cascade deletes participants, votes, invitations
   *
   * @param supabase - Supabase client with admin privileges
   * @param userId - ID of the user to delete
   * @returns Error if deletion failed, null on success
   */
  public async deleteAccount(supabase: SupabaseClient, userId: string): Promise<{ error: Error | null }> {
    try {
      // Step 1: Get profile to extract avatar URL (if exists)
      const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", userId).single();

      // Step 2: Delete avatar from storage if exists
      if (profile?.avatar_url) {
        try {
          // Extract file path from URL
          const url = new URL(profile.avatar_url);
          const pathParts = url.pathname.split("/");
          const bucketIndex = pathParts.indexOf("avatars");
          if (bucketIndex !== -1) {
            const filePath = pathParts.slice(bucketIndex + 1).join("/");
            const { error: storageError } = await supabase.storage.from("avatars").remove([filePath]);
            if (storageError) {
              // Log but continue - storage deletion failure shouldn't block account deletion
              logger.warn("Failed to delete avatar from storage during account deletion", {
                error: storageError.message,
              });
            }
          }
        } catch (storageError) {
          // Log but continue with account deletion
          logger.warn("Error processing avatar deletion during account deletion", {
            error: storageError instanceof Error ? storageError.message : "Unknown error",
          });
        }
      }

      // Step 3: Delete tour_activity records (no FK constraint, must be manual)
      const { error: activityError } = await supabase.from("tour_activity").delete().eq("user_id", userId);
      if (activityError) {
        logger.error("Failed to delete tour_activity records", activityError);
        throw new Error("Failed to clean up tour activity data.");
      }

      // Step 4: Delete auth.users record
      // This triggers handle_user_deletion() which:
      // - Transfers tour ownership or deletes tours
      // - Deletes profile
      // - Anonymizes comments
      // - Cascade deletes participants, votes, invitations
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) {
        logger.error("Failed to delete auth user", authError);
        throw new Error("Failed to delete user account.");
      }

      return { error: null };
    } catch (error) {
      logger.error("Unexpected error in deleteAccount", error instanceof Error ? error : undefined);
      return {
        error: error instanceof Error ? error : new Error("An unexpected error occurred during account deletion."),
      };
    }
  }
}

export const profileService = new ProfileService();
