import { useMutation } from "@tanstack/react-query";
import { post, del, handleApiResponse } from "@/lib/client/api-client";
import type {
  InviteParticipantsCommand,
  SendInvitationsResponse,
  AcceptInvitationResponse,
  InvitationDto,
} from "@/types";
import { queryClient } from "@/lib/queryClient";

/**
 * Sends invitations to a list of email addresses
 */
const sendInvitations = async (tourId: string, data: InviteParticipantsCommand): Promise<SendInvitationsResponse> => {
  const response = await post(`/api/tours/${tourId}/invitations`, data);
  return handleApiResponse<SendInvitationsResponse>(response);
};

/**
 * Cancels (deletes) an invitation
 */
const cancelInvitation = async (invitationId: string): Promise<void> => {
  const response = await del(`/api/invitations/${invitationId}`);
  if (!response.ok && response.status !== 204) {
    throw new Error("Failed to cancel invitation");
  }
};

/**
 * Resends an invitation for declined or expired invitations
 */
const resendInvitation = async (invitationId: string): Promise<void> => {
  const response = await post(`/api/invitations/${invitationId}/resend`, {});
  if (!response.ok && response.status !== 204) {
    const error = await response.json().catch(() => ({ error: { message: "Failed to resend invitation" } }));
    throw new Error(error.error?.message || "Failed to resend invitation");
  }
};

/**
 * Accepts an invitation
 */
const acceptInvitation = async (invitationId: string, token?: string): Promise<AcceptInvitationResponse> => {
  const body = token ? { token } : {};
  const response = await post(`/api/invitations/${invitationId}/accept`, body);
  return handleApiResponse<AcceptInvitationResponse>(response);
};

/**
 * Declines an invitation
 */
const declineInvitation = async (invitationId: string, token?: string): Promise<AcceptInvitationResponse> => {
  const body = token ? { token } : {};
  const response = await post(`/api/invitations/${invitationId}/decline`, body);
  return handleApiResponse<AcceptInvitationResponse>(response);
};

/**
 * React Query mutation hook for sending invitations
 */
export const useSendInvitationsMutation = (tourId: string) => {
  return useMutation({
    mutationFn: (data: InviteParticipantsCommand) => sendInvitations(tourId, data),
    onSuccess: () => {
      // Invalidate and refetch invitations list
      queryClient.invalidateQueries({ queryKey: ["invitations", tourId] });
    },
  }, queryClient);
};

/**
 * React Query mutation hook for canceling an invitation
 */
export const useCancelInvitationMutation = (tourId: string) => {
  return useMutation({
    mutationFn: (invitationId: string) => cancelInvitation(invitationId),
    onMutate: async (invitationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["invitations", tourId] });

      // Snapshot previous value
      const previousInvitations = queryClient.getQueryData<InvitationDto[]>(["invitations", tourId]);

      // Optimistically remove the invitation
      queryClient.setQueryData<InvitationDto[]>(["invitations", tourId], (old) => {
        if (!old) return old;
        return old.filter((inv) => inv.id !== invitationId);
      });

      return { previousInvitations };
    },
    onError: (err, invitationId, context) => {
      // Rollback on error
      if (context?.previousInvitations) {
        queryClient.setQueryData(["invitations", tourId], context.previousInvitations);
      }
    },
    onSettled: () => {
      // Refetch to get the actual data from server
      queryClient.invalidateQueries({ queryKey: ["invitations", tourId] });
    },
  }, queryClient);
};

/**
 * React Query mutation hook for accepting an invitation
 */
export const useAcceptInvitationMutation = () => {
  return useMutation({
    mutationFn: ({ invitationId, token }: { invitationId: string; token?: string }) =>
      acceptInvitation(invitationId, token),
    onSuccess: (data) => {
      // Invalidate any related queries (tour details, participants, etc.)
      queryClient.invalidateQueries({ queryKey: ["tour", data.tour_id] });
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      // Also invalidate invitations for that tour (if user navigates back)
      queryClient.invalidateQueries({ queryKey: ["invitations", data.tour_id] });
    },
  }, queryClient);
};

/**
 * React Query mutation hook for declining an invitation
 */
export const useDeclineInvitationMutation = () => {
  return useMutation({
    mutationFn: ({ invitationId, token }: { invitationId: string; token?: string }) =>
      declineInvitation(invitationId, token),
    onSuccess: (data) => {
      // Invalidate invitations list for that tour
      queryClient.invalidateQueries({ queryKey: ["invitations", data.tour_id] });
    },
  }, queryClient);
};

/**
 * React Query mutation hook for resending an invitation
 */
export const useResendInvitationMutation = (tourId: string) => {
  return useMutation({
    mutationFn: (invitationId: string) => resendInvitation(invitationId),
    onSuccess: () => {
      // Invalidate and refetch invitations list to get updated status
      queryClient.invalidateQueries({ queryKey: ["invitations", tourId] });
    },
  }, queryClient);
};

