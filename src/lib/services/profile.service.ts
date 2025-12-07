import type { SupabaseClient } from "@/db/supabase.client";
import type { ProfileDto, UpdateProfileCommand } from "@/types";
import * as logger from "@/lib/server/logger.service";
import { ENV } from "@/lib/server/env-validation.service";
import { auditLog, AuditActions } from "@/lib/server/audit-log.service";

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
   * Maximum number of recently used tags to store per user.
   */
  private static readonly MAX_RECENT_TAGS = 10;

  /**
   * Validates whether a user can delete their account.
   * Checks for active tours owned by the user and pending invitations.
   *
   * @param supabase - Supabase client
   * @param adminClient - Admin client for audit logging
   * @param userId - ID of the user to validate
   * @returns Object with canDelete flag and reasons array if deletion is blocked
   */
  public async validateAccountDeletion(
    supabase: SupabaseClient,
    adminClient: SupabaseClient,
    userId: string
  ): Promise<{ canDelete: boolean; reasons: string[] }> {
    const reasons: string[] = [];

    try {
      // Check for active tours owned by the user
      const { data: activeTours, error: toursError } = await supabase
        .from("tours")
        .select("id, title")
        .eq("owner_id", userId)
        .eq("status", "active");

      if (toursError) {
        logger.error("Error checking active tours", toursError);
        reasons.push("Unable to verify active tours");
        return { canDelete: false, reasons };
      }

      if (activeTours && activeTours.length > 0) {
        reasons.push(
          `You have ${activeTours.length} active tour${activeTours.length > 1 ? "s" : ""}. Please archive or transfer ownership before deleting your account.`
        );
      }

      // Check for pending invitations
      const { data: pendingInvitations, error: invitationsError } = await supabase
        .from("invitations")
        .select("id")
        .eq("inviter_id", userId)
        .eq("status", "pending");

      if (invitationsError) {
        logger.error("Error checking pending invitations", invitationsError);
        reasons.push("Unable to verify pending invitations");
        return { canDelete: false, reasons };
      }

      if (pendingInvitations && pendingInvitations.length > 0) {
        reasons.push(
          `You have ${pendingInvitations.length} pending invitation${pendingInvitations.length > 1 ? "s" : ""}. Please cancel them before deleting your account.`
        );
      }

      const canDelete = reasons.length === 0;

      // Audit log if deletion is blocked
      if (!canDelete) {
        await auditLog(adminClient, {
          userId,
          actionType: AuditActions.ACCOUNT_DELETION_BLOCKED,
          resourceType: "profile",
          resourceId: userId,
          metadata: { reasons },
        });
      }

      return { canDelete, reasons };
    } catch (error) {
      logger.error("Unexpected error in validateAccountDeletion", error instanceof Error ? error : undefined);
      return { canDelete: false, reasons: ["An unexpected error occurred while validating account deletion."] };
    }
  }

  /**
   * Permanently deletes a user account and all associated data
   *
   * This method:
   * 1. Validates that the account can be deleted (no active tours or pending invitations)
   * 2. Deletes the user's avatar from storage (if exists)
   * 3. Deletes tour_activity records
   * 4. Deletes the auth.users record, which triggers handle_user_deletion() that:
   *    - Transfers tour ownership or deletes tours
   *    - Deletes the profile
   *    - Anonymizes comments
   *    - Cascade deletes participants, votes, invitations
   *
   * @param supabase - Supabase client for RLS-protected data operations
   * @param adminClient - Supabase admin client with service role for auth deletion
   * @param userId - ID of the user to delete
   * @returns Error if deletion failed, null on success
   */
  public async deleteAccount(
    supabase: SupabaseClient,
    adminClient: SupabaseClient,
    userId: string,
    requestMetadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ error: Error | null }> {
    try {
      // Step 0: Validate account deletion
      const validation = await this.validateAccountDeletion(supabase, adminClient, userId);
      if (!validation.canDelete) {
        throw new Error(validation.reasons.join(" "));
      }

      // Step 1: Get profile to extract avatar URL (if exists)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .single();

      if (profileError) {
        // Log but continue - profile might not exist in edge cases, we should still try to delete the account
        logger.warn("Failed to fetch profile during account deletion", {
          error: profileError.message,
          userId,
        });
      }

      // Step 2: Delete avatar from storage if exists
      if (profile?.avatar_url) {
        try {
          // Extract file path from URL (handle both absolute and relative URLs)
          const url = new URL(profile.avatar_url, ENV.PUBLIC_SUPABASE_URL);
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
      const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
      if (authError) {
        logger.error("Failed to delete auth user", authError);
        throw new Error("Failed to delete user account.");
      }

      // Step 5: Audit log successful deletion
      await auditLog(adminClient, {
        userId,
        actionType: AuditActions.ACCOUNT_DELETED,
        resourceType: "profile",
        resourceId: userId,
        ipAddress: requestMetadata?.ipAddress,
        userAgent: requestMetadata?.userAgent,
      });

      return { error: null };
    } catch (error) {
      logger.error("Unexpected error in deleteAccount", error instanceof Error ? error : undefined);
      return {
        error: error instanceof Error ? error : new Error("An unexpected error occurred during account deletion."),
      };
    }
  }

  /**
   * Updates the recently used tags for a user.
   * Adds the new tag to the front of the array, removes duplicates,
   * and keeps only the last 10 tags.
   *
   * @throws Error if the operation fails
   */
  public async updateRecentlyUsedTags(supabase: SupabaseClient, userId: string, tagName: string): Promise<void> {
    // Validate tag name length
    if (tagName.length > 50) {
      throw new Error("Tag name cannot exceed 50 characters.");
    }

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

    // Add the new tag to the front and keep only the max limit
    const updatedTags = [tagName, ...filteredTags].slice(0, ProfileService.MAX_RECENT_TAGS);

    // Update profile with new tags
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ recently_used_tags: updatedTags })
      .eq("id", userId);

    if (updateError) {
      logger.error("Error updating recently used tags", updateError);
      throw new Error("Failed to update recently used tags.");
    }
  }
}

export const profileService = new ProfileService();
