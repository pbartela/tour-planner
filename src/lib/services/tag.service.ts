import type { SupabaseClient } from "@/db/supabase.client";
import { secureError } from "@/lib/server/logger.service";
import { isTourArchived, TourNotFoundError, TourStatusVerificationError } from "@/lib/utils/tour-status.util";
import { profileService } from "./profile.service";

/**
 * A tag from the database with a real ID.
 */
export interface TagDto {
  id: number;
  name: string;
}

/**
 * A tag suggestion - either from the database or from recently used tags.
 * Uses a discriminated union to distinguish between the two sources.
 */
export type TagSuggestionDto =
  | {
      source: "database";
      id: number;
      name: string;
    }
  | {
      source: "recent";
      id: null;
      name: string;
    };

export interface TourTagDto {
  tour_id: string;
  tag_id: number;
  tag_name: string;
}

export class ArchiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArchiveError";
  }
}

class TagService {
  /**
   * Gets all tags for a specific tour.
   * User must be a participant (enforced by RLS).
   */
  public async getTagsForTour(supabase: SupabaseClient, tourId: string): Promise<TagDto[]> {
    try {
      const { data, error } = await supabase
        .from("tour_tags")
        .select("tag_id, tags!tour_tags_tag_id_fkey(id, name)")
        .eq("tour_id", tourId);

      if (error) {
        secureError("Error fetching tags for tour", error);
        throw new Error("Failed to fetch tags from the database.");
      }

      // Transform to TagDto
      return (data || []).map((tt) => {
        const tag = Array.isArray(tt.tags) ? tt.tags[0] : tt.tags;
        return {
          id: tag?.id ?? tt.tag_id,
          name: tag?.name ?? "",
        };
      });
    } catch (error) {
      secureError("Unexpected error in getTagsForTour", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }

  /**
   * Searches for tags by name prefix (for autocomplete).
   *
   * Notes on performance:
   * - Uses a simple `ILIKE '<query>%'` pattern which is fast enough for the current scale.
   * - The `idx_tags_name_lower` index optimizes case-insensitive equality lookups via `LOWER(name)`,
   *   but it will not help with patterns that start with wildcards (e.g. `'%foo'`) or future
   *   full-text search on tag descriptions.
   * - If we later add tag descriptions or need richer search (e.g. partial matches anywhere in
   *   the string), consider adding a dedicated GIN/trigram index and switching to full-text search.
   */
  public async searchTags(supabase: SupabaseClient, query: string, limit = 10): Promise<TagDto[]> {
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("id, name")
        .ilike("name", `${query}%`)
        .order("name")
        .limit(limit);

      if (error) {
        secureError("Error searching tags", error);
        throw new Error("Failed to search tags.");
      }

      return data || [];
    } catch (error) {
      secureError("Unexpected error in searchTags", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }

  /**
   * Adds a tag to an archived tour.
   * Creates the tag if it doesn't exist (case-insensitive).
   * User must be a participant (enforced by RLS).
   * Only works on archived tours (enforced by RLS).
   */
  public async addTagToTour(
    supabase: SupabaseClient,
    userId: string,
    tourId: string,
    tagName: string
  ): Promise<TagDto> {
    try {
      // Verify tour is archived (throws if tour not found or verification fails)
      const isArchived = await isTourArchived(supabase, tourId);
      if (!isArchived) {
        throw new ArchiveError("Tags can only be added to archived tours.");
      }

      // Get or create tag (case-insensitive)
      const { data: tagId, error: tagError } = await supabase.rpc("get_or_create_tag", {
        tag_name: tagName,
      });

      if (tagError || tagId === null) {
        secureError("Error getting or creating tag", tagError);
        throw new Error("Failed to create tag.");
      }

      // Add tour_tag relationship
      const { error: insertError } = await supabase.from("tour_tags").insert({
        tour_id: tourId,
        tag_id: tagId,
      });

      if (insertError) {
        // Check for unique constraint violation (tag already exists on this tour)
        if (insertError.code === "23505") {
          // Not an error - tag already exists, just fetch and return it
          const { data: existingTag } = await supabase.from("tags").select("id, name").eq("id", tagId).single();
          if (existingTag) {
            // Update recently used tags even if tag already existed on tour
            await profileService.updateRecentlyUsedTags(supabase, userId, tagName);
            return existingTag;
          }
        }

        // Check for RLS policy violation (insufficient privileges)
        if (insertError.code === "42501") {
          secureError("RLS policy violation when adding tag to tour", insertError);
          throw new Error(
            "You don't have permission to add tags to this tour. Only participants of archived tours can add tags."
          );
        }

        // Other database errors
        secureError("Error adding tag to tour", insertError);
        throw new Error("Failed to add tag to tour.");
      }

      // Fetch the created tag
      const { data: tag, error: fetchError } = await supabase.from("tags").select("id, name").eq("id", tagId).single();

      if (fetchError || !tag) {
        secureError("Error fetching created tag", fetchError);
        throw new Error("Failed to fetch tag after creation.");
      }

      // Update recently used tags in user profile
      await profileService.updateRecentlyUsedTags(supabase, userId, tagName);

      return tag;
    } catch (error) {
      // Re-throw known error types without wrapping
      if (error instanceof ArchiveError || error instanceof TourNotFoundError || error instanceof TourStatusVerificationError) {
        throw error;
      }
      secureError("Unexpected error in addTagToTour", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }

  /**
   * Removes a tag from an archived tour.
   * User must be a participant (enforced by RLS).
   * Only works on archived tours (enforced by RLS).
   */
  public async removeTagFromTour(supabase: SupabaseClient, tourId: string, tagId: number): Promise<void> {
    try {
      // Verify tour is archived (throws if tour not found or verification fails)
      const isArchived = await isTourArchived(supabase, tourId);
      if (!isArchived) {
        throw new ArchiveError("Tags can only be removed from archived tours.");
      }

      const { error } = await supabase.from("tour_tags").delete().eq("tour_id", tourId).eq("tag_id", tagId);

      if (error) {
        // Check for RLS policy violation (insufficient privileges)
        if (error.code === "42501") {
          secureError("RLS policy violation when removing tag from tour", error);
          throw new Error(
            "You don't have permission to remove tags from this tour. Only participants of archived tours can remove tags."
          );
        }

        // Other database errors
        secureError("Error removing tag from tour", error);
        throw new Error("Failed to remove tag from tour.");
      }
    } catch (error) {
      // Re-throw known error types without wrapping
      if (error instanceof ArchiveError || error instanceof TourNotFoundError || error instanceof TourStatusVerificationError) {
        throw error;
      }
      secureError("Unexpected error in removeTagFromTour", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }

  /**
   * Gets all unique tags used across all tours.
   * Useful for displaying a global tag list or autocomplete.
   */
  public async getAllTags(supabase: SupabaseClient): Promise<TagDto[]> {
    try {
      const { data, error } = await supabase.from("tags").select("id, name").order("name");

      if (error) {
        secureError("Error fetching all tags", error);
        throw new Error("Failed to fetch tags.");
      }

      return data || [];
    } catch (error) {
      secureError("Unexpected error in getAllTags", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }
}

export const tagService = new TagService();
