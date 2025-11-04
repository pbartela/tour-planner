import { useMutation } from "@tanstack/react-query";
import { post, handleApiResponse } from "@/lib/client/api-client";
import type { ToggleVoteResponseDto, TourVotesDto } from "@/types";
import { queryClient } from "@/lib/queryClient";

/**
 * Toggles a vote on a tour
 */
const toggleVote = async (tourId: string): Promise<ToggleVoteResponseDto> => {
  const response = await post(`/api/tours/${tourId}/vote`, {});
  return handleApiResponse<ToggleVoteResponseDto>(response);
};

/**
 * React Query mutation hook for toggling a vote with optimistic update
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useToggleVoteMutation(tourId, currentUserId);
 *
 * const handleVote = () => {
 *   mutate();
 * };
 * ```
 */
export const useToggleVoteMutation = (tourId: string, currentUserId: string) => {
  return useMutation(
    {
      mutationFn: () => toggleVote(tourId),
      onMutate: async () => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ["votes", tourId] });

        // Snapshot previous value
        const previousVotes = queryClient.getQueryData<TourVotesDto>(["votes", tourId]);

        // Determine if user has already voted
        const userHasVoted = previousVotes?.users.includes(currentUserId) ?? false;

        // Optimistically update
        queryClient.setQueryData<TourVotesDto>(["votes", tourId], (old) => {
          if (!old) {
            // If no data yet, assume adding a vote
            return {
              count: 1,
              users: [currentUserId],
            };
          }

          if (userHasVoted) {
            // Remove vote
            return {
              count: old.count - 1,
              users: old.users.filter((id) => id !== currentUserId),
            };
          } else {
            // Add vote
            return {
              count: old.count + 1,
              users: [...old.users, currentUserId],
            };
          }
        });

        return { previousVotes };
      },
      onError: (err, variables, context) => {
        // Rollback on error
        if (context?.previousVotes) {
          queryClient.setQueryData(["votes", tourId], context.previousVotes);
        }
      },
      onSettled: () => {
        // Refetch to get the actual data from server
        queryClient.invalidateQueries({ queryKey: ["votes", tourId] });
      },
    },
    queryClient
  );
};
