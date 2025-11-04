import { useQuery } from "@tanstack/react-query";
import { get, handleApiResponse } from "@/lib/client/api-client";
import type { TourVotesDto } from "@/types";
import { queryClient } from "@/lib/queryClient";

/**
 * Fetches votes for a tour
 */
const fetchVotes = async (tourId: string): Promise<TourVotesDto> => {
  const response = await get(`/api/tours/${tourId}/votes`);
  return handleApiResponse<TourVotesDto>(response);
};

/**
 * React Query hook for fetching votes for a tour
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, error } = useVotes(tourId);
 * ```
 */
export const useVotes = (tourId: string) => {
  return useQuery(
    {
      queryKey: ["votes", tourId],
      queryFn: () => fetchVotes(tourId),
      enabled: !!tourId,
      staleTime: 10 * 1000, // 10 seconds
    },
    queryClient
  );
};
