import { useMutation } from "@tanstack/react-query";
import { post, patch, del, handleApiResponse } from "@/lib/client/api-client";
import type { CommentDto, PaginatedCommentsDto, CreateCommentCommand, UpdateCommentCommand } from "@/types";
import { queryClient } from "@/lib/queryClient";

/**
 * Creates a new comment
 */
const createComment = async (tourId: string, data: CreateCommentCommand): Promise<CommentDto> => {
  const response = await post(`/api/tours/${tourId}/comments`, data);
  return handleApiResponse<CommentDto>(response);
};

/**
 * Updates an existing comment
 */
const updateComment = async (tourId: string, commentId: string, data: UpdateCommentCommand): Promise<CommentDto> => {
  const response = await patch(`/api/tours/${tourId}/comments/${commentId}`, data);
  return handleApiResponse<CommentDto>(response);
};

/**
 * Deletes a comment
 */
const deleteComment = async (tourId: string, commentId: string): Promise<void> => {
  const response = await del(`/api/tours/${tourId}/comments/${commentId}`);
  if (!response.ok && response.status !== 204) {
    throw new Error("Failed to delete comment");
  }
};

/**
 * React Query mutation hook for creating a comment with optimistic update
 */
export const useCreateCommentMutation = (tourId: string) => {
  return useMutation({
    mutationFn: (data: CreateCommentCommand) => createComment(tourId, data),
    onMutate: async (newCommentData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["comments", tourId] });

      // Snapshot previous value
      const previousComments = queryClient.getQueryData<PaginatedCommentsDto>([
        "comments",
        tourId,
        { page: 1, limit: 20 },
      ]);

      // Optimistically update with temporary comment
      queryClient.setQueryData<PaginatedCommentsDto>(["comments", tourId, { page: 1, limit: 20 }], (old) => {
        if (!old) return old;

        const optimisticComment: CommentDto = {
          id: `temp-${Date.now()}`, // Temporary ID
          tour_id: tourId,
          user_id: "current-user", // Will be replaced by server response
          content: newCommentData.content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          display_name: null, // Will be filled by server
        };

        return {
          ...old,
          data: [...old.data, optimisticComment],
          pagination: {
            ...old.pagination,
            total: old.pagination.total + 1,
          },
        };
      });

      return { previousComments };
    },
    onError: (err, newComment, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(["comments", tourId, { page: 1, limit: 20 }], context.previousComments);
      }
    },
    onSettled: () => {
      // Refetch to get the actual data from server
      queryClient.invalidateQueries({ queryKey: ["comments", tourId] });
    },
  }, queryClient);
};

/**
 * React Query mutation hook for updating a comment with optimistic update
 */
export const useUpdateCommentMutation = (tourId: string) => {
  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: UpdateCommentCommand }) =>
      updateComment(tourId, commentId, data),
    onMutate: async ({ commentId, data }) => {
      await queryClient.cancelQueries({ queryKey: ["comments", tourId] });

      const previousComments = queryClient.getQueryData<PaginatedCommentsDto>([
        "comments",
        tourId,
        { page: 1, limit: 20 },
      ]);

      // Optimistically update the comment
      queryClient.setQueryData<PaginatedCommentsDto>(["comments", tourId, { page: 1, limit: 20 }], (old) => {
        if (!old) return old;

        return {
          ...old,
          data: old.data.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  content: data.content,
                  updated_at: new Date().toISOString(),
                }
              : comment
          ),
        };
      });

      return { previousComments };
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(["comments", tourId, { page: 1, limit: 20 }], context.previousComments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", tourId] });
    },
  }, queryClient);
};

/**
 * React Query mutation hook for deleting a comment with optimistic update
 */
export const useDeleteCommentMutation = (tourId: string) => {
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(tourId, commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ["comments", tourId] });

      const previousComments = queryClient.getQueryData<PaginatedCommentsDto>([
        "comments",
        tourId,
        { page: 1, limit: 20 },
      ]);

      // Optimistically remove the comment
      queryClient.setQueryData<PaginatedCommentsDto>(["comments", tourId, { page: 1, limit: 20 }], (old) => {
        if (!old) return old;

        return {
          ...old,
          data: old.data.filter((comment) => comment.id !== commentId),
          pagination: {
            ...old.pagination,
            total: old.pagination.total - 1,
          },
        };
      });

      return { previousComments };
    },
    onError: (err, commentId, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(["comments", tourId, { page: 1, limit: 20 }], context.previousComments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", tourId] });
    },
  }, queryClient);
};
