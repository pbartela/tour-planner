import type { z } from "zod";
import type { SupabaseClient } from "@/db/supabase.client";
import type { getCommentsQuerySchema } from "@/lib/validators/comment.validators";
import { secureError } from "@/lib/server/logger.service";
import type { CommentDto, PaginatedCommentsDto, CreateCommentCommand, UpdateCommentCommand } from "@/types";
import { createSupabaseAdminClient } from "@/db/supabase.admin.client";

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
            id
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

      // Fetch emails for users who don't have display_name
      const userIdsWithoutDisplayName = (comments || [])
        .filter((comment) => !comment.profiles?.display_name)
        .map((comment) => comment.user_id)
        .filter((id, index, arr) => arr.indexOf(id) === index); // unique IDs

      // Fetch emails from auth.users for users without display_name
      const userEmails = new Map<string, string | null>();
      if (userIdsWithoutDisplayName.length > 0) {
        // Use admin client to get user emails
        try {
          const adminClient = createSupabaseAdminClient();
          // Fetch emails for specific user IDs
          await Promise.all(
            userIdsWithoutDisplayName.map(async (userId) => {
              try {
                const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
                if (authUser?.user?.email) {
                  userEmails.set(userId, authUser.user.email);
                }
              } catch {
                // Skip if user not found or error
              }
            })
          );
        } catch (error) {
          // If admin API is not available, continue without emails
          secureError("Could not fetch user emails for comments", error);
        }
      }

      // Transform the data to match CommentDto
      const transformedComments: CommentDto[] = (comments || []).map((comment) => ({
        id: comment.id,
        tour_id: comment.tour_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        display_name: (comment as { profiles?: { display_name: string | null } | null }).profiles?.display_name || null,
        user_email: userEmails.get(comment.user_id) || null,
      }));

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
            id
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

      // Fetch email if display_name is not set
      let userEmail: string | null = null;
      if (!(comment as { profiles?: { display_name: string | null } | null }).profiles?.display_name) {
        try {
          const adminClient = createSupabaseAdminClient();
          const { data: authUser } = await adminClient.auth.admin.getUserById(comment.user_id);
          userEmail = authUser?.user?.email || null;
        } catch {
          // Fallback if admin API is not available
        }
      }

      // Transform to CommentDto
      return {
        id: comment.id,
        tour_id: comment.tour_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        display_name: (comment as { profiles?: { display_name: string | null } | null }).profiles?.display_name || null,
        user_email: userEmail,
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
            id
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

      // Fetch email if display_name is not set
      let userEmail: string | null = null;
      if (!(comment as { profiles?: { display_name: string | null } | null }).profiles?.display_name) {
        try {
          const adminClient = createSupabaseAdminClient();
          const { data: authUser } = await adminClient.auth.admin.getUserById(comment.user_id);
          userEmail = authUser?.user?.email || null;
        } catch {
          // Fallback if admin API is not available
        }
      }

      return {
        id: comment.id,
        tour_id: comment.tour_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        display_name: (comment as { profiles?: { display_name: string | null } | null }).profiles?.display_name || null,
        user_email: userEmail,
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
