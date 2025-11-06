import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { navigate } from "astro:transitions/client";
import toast from "react-hot-toast";
import { useTourDetails } from "@/lib/hooks/useTourDetails";
import { useDeleteTourMutation, useLockVotingMutation, useUnlockVotingMutation } from "@/lib/hooks/useTourMutations";
import { useMarkTourAsViewedMutation } from "@/lib/hooks/useTourActivity";
import { CommentsList } from "./CommentsList";
import { VotingSection } from "./VotingSection";
import { InvitationForm } from "./InvitationForm";
import { InvitedUsersList } from "./InvitedUsersList";
import { EditTourModal } from "./EditTourModal";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";

interface TourDetailsViewProps {
  tourId: string;
  currentUserId: string;
}

export const TourDetailsView = ({ tourId, currentUserId }: TourDetailsViewProps) => {
  const { t } = useTranslation("tours");
  const { data: tour, isLoading, isError, error } = useTourDetails(tourId);
  const deleteMutation = useDeleteTourMutation();
  const lockVotingMutation = useLockVotingMutation();
  const unlockVotingMutation = useUnlockVotingMutation();
  const markAsViewedMutation = useMarkTourAsViewedMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isOwner = tour?.owner_id === currentUserId;

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
        setShowDeleteConfirm(false);
        // Navigate to home page after successful deletion using Astro View Transitions
        navigate("/");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl space-y-6 p-4">
        <SkeletonLoader />
        <SkeletonLoader />
        <SkeletonLoader />
      </div>
    );
  }

  if (isError || !tour) {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <div className="alert alert-error">
          <span>
            {t("tourDetails.loadingError")}: {error?.message || t("tourDetails.notFound")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-4">
      {/* Tour Header */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="card-title text-3xl">{tour.title}</h1>
              <p className="mt-2 text-lg text-base-content/70">
                📍{" "}
                <a href={tour.destination} target="_blank" rel="noopener noreferrer" className="link">
                  {tour.destination}
                </a>
              </p>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Button variant="neutral-outline" onClick={() => setIsEditModalOpen(true)}>
                  {t("tourDetails.edit")}
                </Button>
                <Button variant="neutral-outline" onClick={() => setShowDeleteConfirm(true)} className="text-error">
                  {t("tourDetails.delete")}
                </Button>
              </div>
            )}
          </div>

          <div className="divider"></div>

          {/* Tour Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-base-content/60">{t("tourDetails.startDate")}</p>
              <p className="text-lg font-semibold">{new Date(tour.start_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-base-content/60">{t("tourDetails.endDate")}</p>
              <p className="text-lg font-semibold">{new Date(tour.end_date).toLocaleDateString()}</p>
            </div>
            {tour.participant_limit && (
              <div>
                <p className="text-sm text-base-content/60">{t("tourDetails.participantLimit")}</p>
                <p className="text-lg font-semibold">{tour.participant_limit}</p>
              </div>
            )}
            {tour.like_threshold && (
              <div>
                <p className="text-sm text-base-content/60">{t("tourDetails.likeThreshold")}</p>
                <p className="text-lg font-semibold">{tour.like_threshold}</p>
              </div>
            )}
          </div>

          {tour.description && (
            <>
              <div className="divider"></div>
              <div>
                <p className="text-sm text-base-content/60">{t("tourDetails.description")}</p>
                <p className="mt-2 whitespace-pre-wrap">{tour.description}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Invitations Section (Owner only) */}
      {isOwner && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">{t("tourDetails.invitations.title")}</h2>
            <InvitationForm tourId={tourId} />
            <div className="divider"></div>
            <InvitedUsersList tourId={tourId} isOwner={isOwner} />
          </div>
        </div>
      )}

      {/* Voting Section */}
      <div className="space-y-4">
        {isOwner && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {tour.voting_locked ? t("voting.unlockVoting") : t("voting.lockVoting")}
                  </h3>
                  <p className="text-sm text-base-content/60">
                    {tour.voting_locked ? t("voting.votingLockedMessage") : "Allow participants to vote"}
                  </p>
                </div>
                <Button
                  variant={tour.voting_locked ? "error" : "neutral"}
                  onClick={handleToggleVotingLock}
                  disabled={lockVotingMutation.isPending || unlockVotingMutation.isPending}
                >
                  {lockVotingMutation.isPending || unlockVotingMutation.isPending
                    ? "..."
                    : tour.voting_locked
                      ? `🔓 ${t("voting.unlockVoting")}`
                      : `🔒 ${t("voting.lockVoting")}`}
                </Button>
              </div>
            </div>
          </div>
        )}
        <VotingSection
          tourId={tourId}
          currentUserId={currentUserId}
          areVotesHidden={tour.are_votes_hidden}
          votingLocked={tour.voting_locked}
        />
      </div>

      {/* Comments Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <CommentsList tourId={tourId} currentUserId={currentUserId} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={t("tourDetails.deleteConfirm.title")}
        message={t("tourDetails.deleteConfirm.message")}
        confirmText={t("tourDetails.deleteConfirm.confirm")}
        cancelText={t("tourDetails.deleteConfirm.cancel")}
        variant="error"
        isPending={deleteMutation.isPending}
        pendingText={t("tourDetails.deleteConfirm.deleting")}
        requireTextConfirmation={{
          expectedText: tour.title,
          placeholder: tour.title,
          prompt: t("tourDetails.deleteConfirm.typeTitlePrompt"),
        }}
      />

      {/* Edit Tour Modal */}
      {isEditModalOpen && (
        <EditTourModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} tour={tour} />
      )}
    </div>
  );
};
