import { useMutation } from "@tanstack/react-query";
import { del } from "@/lib/client/api-client";
import { queryClient } from "@/lib/queryClient";

/**
 * Removes a participant from a tour
 */
const removeParticipant = async (tourId: string, userId: string): Promise<void> => {
  const response = await del(`/api/tours/${tourId}/participants/${userId}`);
  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Failed to remove participant");
  }
};

/**
 * React Query mutation hook for removing a participant from a tour.
 * Can be used by:
 * 1. Participant to leave the tour
 * 2. Owner to remove a participant
 */
export const useRemoveParticipantMutation = (tourId: string) => {
  return useMutation(
    {
      mutationFn: (userId: string) => removeParticipant(tourId, userId),
      onSuccess: () => {
        // Invalidate participants query to refetch the list
        queryClient.invalidateQueries({ queryKey: ["participants", tourId] });
        // Invalidate tours query to update participant count/avatars
        queryClient.invalidateQueries({ queryKey: ["tours"] });
        // Invalidate tour details to update participant list
        queryClient.invalidateQueries({ queryKey: ["tourDetails", tourId] });
      },
    },
    queryClient
  );
};
