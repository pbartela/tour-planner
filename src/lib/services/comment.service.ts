import type { z } from "zod";
import type { SupabaseClient } from "@/db/supabase.client";
import type { getCommentsQuerySchema } from "@/lib/validators/comment.validators";
import { secureError } from "@/lib/server/logger.service";
import type { CommentDto, PaginatedCommentsDto, CreateCommentCommand, UpdateCommentCommand } from "@/types";
import { ensureTourNotArchived } from "@/lib/utils/tour-status.util";

class CommentService {
  /**
   * Lists comments for a tour with pagination.
   * Uses RLS to ensure user is a participant of the tour.
   */
  public async listCommentsForTour(
    supabase: SupabaseClient,
    tourId: string,
    options: z.infer<typeof getCommentsQuerySchema>
  ): Promise<PaginatedCommentsDto> {
    const { page, limit } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      const {
        data: comments,
        error: commentsError,
        count,
      } = await supabase
        .from("comments")
        .select(
          `
          id,
          tour_id,
          user_id,
          content,
          created_at,
          updated_at,
          profiles!comments_user_id_fkey (
            display_name,
            id,
            email
          )
        `,
          { count: "exact" }
        )
        .eq("tour_id", tourId)
        .order("created_at", { ascending: true })
        .range(from, to);

      if (commentsError) {
        secureError("Error fetching comments from database", commentsError);
        throw new Error("Failed to fetch comments from the database.");
      }

      // SECURITY: Transform the data to match CommentDto (email from profiles table)
      // Email is only included as fallback when display_name is null.
      // This encourages users to set display names to reduce email exposure.
      // Email comes from profiles.email (synced from auth.users via trigger).
      // Previous implementation used admin client for email fallback, now uses profiles.
      // See docs/PRIVACY.md for email visibility policy.
      const transformedComments: CommentDto[] = (comments || []).map((comment) => {
        const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
        return {
          id: comment.id,
          tour_id: comment.tour_id,
          user_id: comment.user_id,
          content: comment.content,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          display_name: profile?.display_name || null,
          // Only include email if display_name is not set (fallback display)
          user_email: profile?.display_name ? null : profile?.email || null,
        };
      });

      return {
        data: transformedComments,
        pagination: {
          page,
          limit,
          total: count ?? 0,
        },
      };
    } catch (error) {
      secureError("Unexpected error in listCommentsForTour", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }

  /**
   * Creates a new comment on a tour.
   * User must be a participant (enforced by RLS).
   */
  public async createComment(
    supabase: SupabaseClient,
    userId: string,
    tourId: string,
    command: CreateCommentCommand
  ): Promise<CommentDto> {
    try {
      // Prevent commenting on archived tours
      await ensureTourNotArchived(supabase, tourId);

      const { data: comment, error } = await supabase
        .from("comments")
        .insert({
          tour_id: tourId,
          user_id: userId,
          content: command.content,
        })
        .select(
          `
          id,
          tour_id,
          user_id,
          content,
          created_at,
          updated_at,
          profiles!comments_user_id_fkey (
            display_name,
            id,
            email
          )
        `
        )
        .single();

      if (error) {
        secureError("Error creating comment", error);
        throw new Error("Failed to create comment in the database.");
      }

      if (!comment) {
        throw new Error("Failed to retrieve created comment.");
      }

      // Transform to CommentDto (email now comes from profiles table)
      const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
      return {
        id: comment.id,
        tour_id: comment.tour_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        display_name: profile?.display_name || null,
        // Only include email if display_name is not set (fallback display)
        user_email: profile?.display_name ? null : profile?.email || null,
      };
    } catch (error) {
      secureError("Unexpected error in createComment", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }

  /**
   * Updates a comment.
   * User must be the comment author (enforced by RLS).
   */
  public async updateComment(
    supabase: SupabaseClient,
    commentId: string,
    command: UpdateCommentCommand
  ): Promise<CommentDto> {
    try {
      // First, fetch the comment to get the tour_id
      const { data: existingComment, error: fetchError } = await supabase
        .from("comments")
        .select("tour_id")
        .eq("id", commentId)
        .single();

      if (fetchError || !existingComment) {
        secureError("Error fetching comment for update", fetchError);
        throw new Error("Comment not found or you may not have permission.");
      }

      // Prevent updating comments on archived tours
      await ensureTourNotArchived(supabase, existingComment.tour_id);

      const { data: comment, error } = await supabase
        .from("comments")
        .update({
          content: command.content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", commentId)
        .select(
          `
          id,
          tour_id,
          user_id,
          content,
          created_at,
          updated_at,
          profiles!comments_user_id_fkey (
            display_name,
            id,
            email
          )
        `
        )
        .single();

      if (error) {
        secureError("Error updating comment", error);
        throw new Error("Failed to update comment. It may not exist or you may not have permission.");
      }

      if (!comment) {
        throw new Error("Failed to retrieve updated comment.");
      }

      // Transform to CommentDto (email now comes from profiles table)
      const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
      return {
        id: comment.id,
        tour_id: comment.tour_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        display_name: profile?.display_name || null,
        // Only include email if display_name is not set (fallback display)
        user_email: profile?.display_name ? null : profile?.email || null,
      };
    } catch (error) {
      secureError("Unexpected error in updateComment", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }

  /**
   * Deletes a comment.
   * User must be the comment author (enforced by RLS).
   */
  public async deleteComment(supabase: SupabaseClient, commentId: string): Promise<void> {
    try {
      // First, fetch the comment to get the tour_id
      const { data: existingComment, error: fetchError } = await supabase
        .from("comments")
        .select("tour_id")
        .eq("id", commentId)
        .single();

      if (fetchError || !existingComment) {
        secureError("Error fetching comment for deletion", fetchError);
        throw new Error("Comment not found or you may not have permission.");
      }

      // Prevent deleting comments on archived tours
      await ensureTourNotArchived(supabase, existingComment.tour_id);

      const { error } = await supabase.from("comments").delete().eq("id", commentId);

      if (error) {
        secureError("Error deleting comment", error);
        throw new Error("Failed to delete comment. It may not exist or you may not have permission.");
      }
    } catch (error) {
      secureError("Unexpected error in deleteComment", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred.");
    }
  }
}

export const commentService = new CommentService();
