import { useQuery } from "@tanstack/react-query";
import { get, handleApiResponse } from "@/lib/client/api-client";
import type { InvitationDto } from "@/types";
import { queryClient } from "@/lib/queryClient";

/**
 * Fetches pending invitations for the current authenticated user
 */
const fetchUserPendingInvitations = async (): Promise<InvitationDto[]> => {
  const response = await get("/api/invitations/pending");
  return handleApiResponse<InvitationDto[]>(response);
};

/**
 * React Query hook for fetching pending invitations for the authenticated user
 * Automatically refetches every 60 seconds to keep the invitation count up-to-date
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, error, refetch } = useUserPendingInvitations();
 * ```
 */
export const useUserPendingInvitations = () => {
  return useQuery(
    {
      queryKey: ["user-invitations", "pending"],
      queryFn: fetchUserPendingInvitations,
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // Refetch every 60 seconds
      retry: 2, // Retry failed requests up to 2 times
    },
    queryClient
  );
};
