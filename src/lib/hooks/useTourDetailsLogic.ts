import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { navigate } from "astro:transitions/client";
import toast from "react-hot-toast";
import { useTourDetails } from "./useTourDetails";
import { useDeleteTourMutation, useLockVotingMutation, useUnlockVotingMutation } from "./useTourMutations";
import { useMarkTourAsViewedMutation } from "./useTourActivity";

/**
 * Custom hook that encapsulates all tour details business logic
 * Separates data fetching, mutations, and actions from UI rendering
 */
export const useTourDetailsLogic = (tourId: string) => {
  const { t } = useTranslation("tours");
  const { data: tour, isLoading, isError, error } = useTourDetails(tourId);
  const deleteMutation = useDeleteTourMutation();
  const lockVotingMutation = useLockVotingMutation();
  const unlockVotingMutation = useUnlockVotingMutation();
  const markAsViewedMutation = useMarkTourAsViewedMutation();

  // Mark tour as viewed when component mounts
  useEffect(() => {
    if (tourId) {
      markAsViewedMutation.mutate(tourId);
    }
  }, [tourId, markAsViewedMutation]);

  const handleToggleVotingLock = () => {
    if (tour?.voting_locked) {
      unlockVotingMutation.mutate(tourId, {
        onSuccess: () => {
          toast.success(t("voting.unlockVotingSuccess"));
        },
        onError: () => {
          toast.error(t("voting.unlockVotingError"));
        },
      });
    } else {
      lockVotingMutation.mutate(tourId, {
        onSuccess: () => {
          toast.success(t("voting.lockVotingSuccess"));
        },
        onError: () => {
          toast.error(t("voting.lockVotingError"));
        },
      });
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate(tourId, {
      onSuccess: () => {
        // Navigate to home page after successful deletion using Astro View Transitions
        navigate("/");
      },
    });
  };

  return {
    // Data
    tour,
    isLoading,
    isError,
    error,
    // Mutations
    mutations: {
      delete: deleteMutation,
      lockVoting: lockVotingMutation,
      unlockVoting: unlockVotingMutation,
    },
    // Actions
    actions: {
      handleToggleVotingLock,
      handleDelete,
    },
  };
};
