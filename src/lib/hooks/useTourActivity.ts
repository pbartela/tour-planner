import { useMutation } from "@tanstack/react-query";
import { post, handleApiResponse } from "@/lib/client/api-client";
import { queryClient } from "@/lib/queryClient";

/**
 * Marks a tour as viewed by the current user
 */
const markTourAsViewed = async (tourId: string): Promise<{ success: boolean }> => {
  const response = await post(`/api/tours/${tourId}/mark-viewed`, {});
  return handleApiResponse<{ success: boolean }>(response);
};

/**
 * React Query mutation hook for marking a tour as viewed.
 * This should be called when a user opens the tour details page.
 * It updates the last_viewed_at timestamp which is used to determine
 * if there is new activity on the tour.
 *
 * @example
 * ```tsx
 * const { mutate } = useMarkTourAsViewedMutation();
 *
 * useEffect(() => {
 *   // Mark tour as viewed when component mounts
 *   mutate(tourId);
 * }, [tourId, mutate]);
 * ```
 */
export const useMarkTourAsViewedMutation = () => {
  return useMutation(
    {
      mutationFn: (tourId: string) => markTourAsViewed(tourId),
      onSuccess: () => {
        // Invalidate tours list to refresh has_new_activity badges
        queryClient.invalidateQueries({ queryKey: ["tours"] });
      },
    },
    queryClient
  );
};
