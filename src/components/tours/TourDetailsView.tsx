import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTourDetails } from "@/lib/hooks/useTourDetails";
import { useDeleteTourMutation } from "@/lib/hooks/useTourMutations";
import { CommentsList } from "./CommentsList";
import { VotingSection } from "./VotingSection";
import { InvitationForm } from "./InvitationForm";
import { InvitedUsersList } from "./InvitedUsersList";
import { Button } from "@/components/ui/button";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";

interface TourDetailsViewProps {
  tourId: string;
  currentUserId: string;
  onEdit?: () => void;
}

export const TourDetailsView = ({ tourId, currentUserId, onEdit }: TourDetailsViewProps) => {
  const { t } = useTranslation("tours");
  const { data: tour, isLoading, isError, error } = useTourDetails(tourId);
  const deleteMutation = useDeleteTourMutation();
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = tour?.owner_id === currentUserId;

  const handleDelete = () => {
    if (deleteConfirmInput === tour?.title) {
      deleteMutation.mutate(tourId, {
        onSuccess: () => {
          // Redirect to home page after successful deletion
          window.location.href = "/";
        },
      });
    }
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
                {onEdit && (
                  <Button variant="outline" onClick={onEdit}>
                    {t("tourDetails.edit")}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="text-error">
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
      <VotingSection tourId={tourId} currentUserId={currentUserId} areVotesHidden={tour.are_votes_hidden} />

      {/* Comments Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <CommentsList tourId={tourId} currentUserId={currentUserId} />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">{t("tourDetails.deleteConfirm.title")}</h3>
            <p className="py-4">
              {t("tourDetails.deleteConfirm.message")}
              <br />
              <br />
              {t("tourDetails.deleteConfirm.typeTitlePrompt")} <strong>{tour.title}</strong>{" "}
              {t("tourDetails.deleteConfirm.toConfirm")}
            </p>
            <input
              type="text"
              className="input input-bordered w-full"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              placeholder={tour.title}
            />
            <div className="modal-action">
              <Button
                variant="neutral-outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmInput("");
                }}
              >
                {t("tourDetails.deleteConfirm.cancel")}
              </Button>
              <Button
                variant="error"
                onClick={handleDelete}
                disabled={deleteConfirmInput !== tour.title || deleteMutation.isPending}
              >
                {deleteMutation.isPending
                  ? t("tourDetails.deleteConfirm.deleting")
                  : t("tourDetails.deleteConfirm.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
