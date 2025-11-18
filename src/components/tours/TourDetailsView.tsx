import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTourDetailsLogic } from "@/lib/hooks/useTourDetailsLogic";
import { CommentsList } from "./CommentsList";
import { VotingSection } from "./VotingSection";
import { TourHeader } from "./TourHeader";
import { TourOwnerControls } from "./TourOwnerControls";
import { EditTourModal } from "./EditTourModal";
import { ParticipantsList } from "./ParticipantsList";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";

interface TourDetailsViewProps {
  tourId: string;
  currentUserId: string;
}

/**
 * Main tour details view component
 * Uses composition pattern with extracted sub-components for better maintainability
 */
export const TourDetailsView = ({ tourId, currentUserId }: TourDetailsViewProps) => {
  const { t } = useTranslation("tours");
  const { tour, isLoading, isError, error, mutations, actions } = useTourDetailsLogic(tourId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isOwner = tour?.owner_id === currentUserId;
  const isToggling = mutations.lockVoting.isPending || mutations.unlockVoting.isPending;

  const handleDelete = () => {
    actions.handleDelete();
    setShowDeleteConfirm(false);
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
      <TourHeader
        tour={tour}
        isOwner={isOwner}
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={() => setShowDeleteConfirm(true)}
      />

      {/* Owner Controls (Invitations & Voting Lock) */}
      {isOwner && (
        <TourOwnerControls
          tourId={tourId}
          tour={tour}
          onToggleVotingLock={actions.handleToggleVotingLock}
          isToggling={isToggling}
        />
      )}

      {/* Voting Section */}
      <VotingSection
        tourId={tourId}
        currentUserId={currentUserId}
        areVotesHidden={tour.are_votes_hidden}
        votingLocked={tour.voting_locked}
      />

      {/* Participants Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <ParticipantsList tourId={tourId} ownerId={tour.owner_id} currentUserId={currentUserId} />
        </div>
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
        isPending={mutations.delete.isPending}
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
