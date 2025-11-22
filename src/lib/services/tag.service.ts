import type { SupabaseClient } from "@/db/supabase.client";
import { secureError } from "@/lib/server/logger.service";
import { isTourArchived } from "@/lib/utils/tour-status.util";

export interface TagDto {
  id: number;
  name: string;
}

export interface TourTagDto {
  tour_id: string;
  tag_id: number;
  tag_name: string;
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
   * Returns all matching tags.
   */
  public async searchTags(supabase: SupabaseClient, query: string, limit: number = 10): Promise<TagDto[]> {
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
  public async addTagToTour(supabase: SupabaseClient, tourId: string, tagName: string): Promise<TagDto> {
    try {
      // Verify tour is archived
      const isArchived = await isTourArchived(supabase, tourId);
      if (!isArchived) {
        throw new Error("Tags can only be added to archived tours.");
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
            return existingTag;
          }
        }
        secureError("Error adding tag to tour", insertError);
        throw new Error("Failed to add tag to tour. You may not have permission.");
      }

      // Fetch the created tag
      const { data: tag, error: fetchError } = await supabase.from("tags").select("id, name").eq("id", tagId).single();

      if (fetchError || !tag) {
        secureError("Error fetching created tag", fetchError);
        throw new Error("Failed to fetch tag after creation.");
      }

      return tag;
    } catch (error) {
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
      // Verify tour is archived
      const isArchived = await isTourArchived(supabase, tourId);
      if (!isArchived) {
        throw new Error("Tags can only be removed from archived tours.");
      }

      const { error } = await supabase.from("tour_tags").delete().eq("tour_id", tourId).eq("tag_id", tagId);

      if (error) {
        secureError("Error removing tag from tour", error);
        throw new Error("Failed to remove tag from tour. You may not have permission.");
      }
    } catch (error) {
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
