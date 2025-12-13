import { useQuery } from "@tanstack/react-query";
import { get, handleApiResponse } from "@/lib/client/api-client";
import type { InvitationDto, PaginatedInvitationsDto } from "@/types";
import { queryClient } from "@/lib/queryClient";

interface UseTourInvitationsOptions {
  tourId: string;
}

/**
 * Fetches invitations for a tour
 */
const fetchTourInvitations = async (tourId: string): Promise<InvitationDto[]> => {
  const response = await get(`/api/tours/${tourId}/invitations`);
  const paginatedResult = await handleApiResponse<PaginatedInvitationsDto>(response);
  return paginatedResult.data;
};

/**
 * React Query hook for fetching invitations for a tour
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, error } = useTourInvitations({
 *   tourId: '123'
 * });
 * ```
 */
export const useTourInvitations = ({ tourId }: UseTourInvitationsOptions) => {
  return useQuery(
    {
      queryKey: ["invitations", tourId],
      queryFn: () => fetchTourInvitations(tourId),
      enabled: !!tourId,
      staleTime: 30 * 1000, // 30 seconds
    },
    queryClient
  );
};
