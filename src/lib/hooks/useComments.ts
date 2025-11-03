import { useQuery } from "@tanstack/react-query";
import { get, handleApiResponse } from "@/lib/client/api-client";
import type { PaginatedCommentsDto } from "@/types";
import { queryClient } from "@/lib/queryClient";

interface UseCommentsOptions {
  tourId: string;
  page?: number;
  limit?: number;
}

/**
 * Fetches comments for a tour
 */
const fetchComments = async (tourId: string, page: number, limit: number): Promise<PaginatedCommentsDto> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await get(`/api/tours/${tourId}/comments?${params}`);
  return handleApiResponse<PaginatedCommentsDto>(response);
};

/**
 * React Query hook for fetching comments for a tour
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, error } = useComments({
 *   tourId: '123',
 *   page: 1,
 *   limit: 20
 * });
 * ```
 */
export const useComments = ({ tourId, page = 1, limit = 20 }: UseCommentsOptions) => {
  return useQuery({
    queryKey: ["comments", tourId, { page, limit }],
    queryFn: () => fetchComments(tourId, page, limit),
    enabled: !!tourId,
    staleTime: 30 * 1000, // 30 seconds
  }, queryClient);
};
