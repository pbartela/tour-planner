import { useReducer, useEffect } from "react";
import { navigate } from "astro:transitions/client";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { get, handleApiResponse } from "@/lib/client/api-client";
import type { InvitationByTokenDto } from "@/types";
import { useAcceptInvitationMutation, useDeclineInvitationMutation } from "./useInvitationMutations";

// State types
type InvitationState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "expired"; invitation: InvitationByTokenDto }
  | { status: "email-mismatch"; invitation: InvitationByTokenDto }
  | { status: "success"; invitation: InvitationByTokenDto }
  | { status: "navigating" };

type InvitationAction =
  | { type: "FETCH_SUCCESS"; invitation: InvitationByTokenDto }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "START_NAVIGATION" };

// Reducer
const invitationReducer = (state: InvitationState, action: InvitationAction): InvitationState => {
  switch (action.type) {
    case "FETCH_SUCCESS":
      return { status: "success", invitation: action.invitation };
    case "FETCH_ERROR":
      return { status: "error", error: action.error };
    case "START_NAVIGATION":
      return { status: "navigating" };
    default:
      return state;
  }
};

/**
 * Custom hook that encapsulates invitation acceptance logic
 * Uses reducer pattern for state management and separates business logic from UI
 */
export const useInvitationAcceptance = (token: string, userEmail: string) => {
  const { i18n } = useTranslation();
  const [state, dispatch] = useReducer(invitationReducer, { status: "loading" });
  const acceptMutation = useAcceptInvitationMutation();
  const declineMutation = useDeclineInvitationMutation();

  // Fetch invitation data
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchInvitation = async () => {
      try {
        const response = await get(`/api/invitations?token=${encodeURIComponent(token)}`, {
          signal: abortController.signal,
        });
        const data = await handleApiResponse<InvitationByTokenDto>(response);

        // Don't update state if component unmounted
        if (!isMounted) return;

        // Check if invitation is expired or already processed
        if (data.is_expired || data.status !== "pending") {
          dispatch({ type: "FETCH_SUCCESS", invitation: data });
          return;
        }

        // Check email match
        const isEmailMatch = userEmail.toLowerCase() === data.email.toLowerCase();
        if (!isEmailMatch) {
          dispatch({ type: "FETCH_SUCCESS", invitation: data });
          return;
        }

        dispatch({ type: "FETCH_SUCCESS", invitation: data });
      } catch (err) {
        // Ignore errors from aborted requests
        if (abortController.signal.aborted) return;
        if (!isMounted) return;

        const errorMessage = err instanceof Error ? err.message : "Failed to fetch invitation";
        dispatch({ type: "FETCH_ERROR", error: errorMessage });
      }
    };

    fetchInvitation();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [token, userEmail]);

  const handleAccept = async () => {
    if (state.status !== "success") return;

    try {
      const result = await acceptMutation.mutateAsync({
        invitationId: state.invitation.id,
        token: state.invitation.is_expired ? undefined : token,
      });

      toast.success("Invitation accepted successfully");
      dispatch({ type: "START_NAVIGATION" });
      await navigate(`/${i18n.language}/tours/${result.tour_id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to accept invitation";
      toast.error(errorMessage);
    }
  };

  const handleDecline = async () => {
    if (state.status !== "success") return;

    try {
      await declineMutation.mutateAsync({
        invitationId: state.invitation.id,
        token: state.invitation.is_expired ? undefined : token,
      });

      toast.success("Invitation declined");
      dispatch({ type: "START_NAVIGATION" });
      await navigate(`/${i18n.language}/`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to decline invitation";
      toast.error(errorMessage);
    }
  };

  const handleGoHome = async () => {
    dispatch({ type: "START_NAVIGATION" });
    await navigate(`/${i18n.language}/`);
  };

  // Derive additional state
  const isEmailMatch =
    state.status === "success" ? userEmail.toLowerCase() === state.invitation.email.toLowerCase() : false;

  const isExpiredOrProcessed =
    state.status === "success" && (state.invitation.is_expired || state.invitation.status !== "pending");

  return {
    state,
    isEmailMatch,
    isExpiredOrProcessed,
    isProcessing: acceptMutation.isPending || declineMutation.isPending,
    actions: {
      handleAccept,
      handleDecline,
      handleGoHome,
    },
  };
};
