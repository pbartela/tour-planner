import { useQuery } from "@tanstack/react-query";
import { get, handleApiResponse } from "@/lib/client/api-client";
import type { ParticipantDto } from "@/types";
import { queryClient } from "@/lib/queryClient";
import { QUERY_STALE_TIME } from "@/lib/constants/query";

/**
 * Fetches participants for a specific tour
 */
const fetchParticipants = async (tourId: string): Promise<ParticipantDto[]> => {
  const response = await get(`/api/tours/${tourId}/participants`);
  return handleApiResponse<ParticipantDto[]>(response);
};

/**
 * React Query hook for fetching tour participants
 *
 * @example
 * ```tsx
 * const { data: participants, isLoading } = useParticipants(tourId);
 * ```
 */
export const useParticipants = (tourId: string) => {
  return useQuery(
    {
      queryKey: ["participants", tourId],
      queryFn: () => fetchParticipants(tourId),
      staleTime: QUERY_STALE_TIME.INFREQUENT,
      enabled: !!tourId,
    },
    queryClient
  );
};
