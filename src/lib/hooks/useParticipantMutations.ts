import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/client/api-client";

/**
 * Hook for removing a participant from a tour.
 * Can be used by:
 * 1. Participant to leave the tour
 * 2. Owner to remove a participant
 */
export const useRemoveParticipantMutation = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest(`/api/tours/${tourId}/participants/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to remove participant");
      }
    },
    onSuccess: () => {
      // Invalidate participants query to refetch the list
      queryClient.invalidateQueries({ queryKey: ["participants", tourId] });
      // Invalidate tours query to update participant count/avatars
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      // Invalidate tour details to update participant list
      queryClient.invalidateQueries({ queryKey: ["tourDetails", tourId] });
    },
  });
};
