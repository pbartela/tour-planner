import { useQuery } from "@tanstack/react-query";
import { get, handleApiResponse } from "@/lib/client/api-client";
import type { TourDetailsDto } from "@/types";
import { queryClient } from "@/lib/queryClient";

/**
 * Fetches details for a single tour
 */
const fetchTourDetails = async (tourId: string): Promise<TourDetailsDto> => {
  const response = await get(`/api/tours/${tourId}`);
  return handleApiResponse<TourDetailsDto>(response);
};

/**
 * React Query hook for fetching tour details
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, error } = useTourDetails(tourId);
 * ```
 */
export const useTourDetails = (tourId: string) => {
  return useQuery({
    queryKey: ["tour", tourId],
    queryFn: () => fetchTourDetails(tourId),
    enabled: !!tourId,
    staleTime: 60 * 1000, // 1 minute
  }, queryClient);
};
