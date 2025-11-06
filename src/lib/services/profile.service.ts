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
}

export const profileService = new ProfileService();
