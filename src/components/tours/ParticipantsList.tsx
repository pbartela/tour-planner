import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { useParticipants } from "@/lib/hooks/useParticipants";
import { useRemoveParticipantMutation } from "@/lib/hooks/useParticipantMutations";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import { formatDate } from "@/lib/utils/date-formatters";
import { getUserDisplayName } from "@/lib/utils/user-name.util";
import { useState } from "react";

interface ParticipantsListProps {
  tourId: string;
  ownerId: string;
  currentUserId: string;
}

/**
 * Component for displaying the list of tour participants with avatars
 * Shows all users who have joined the tour (accepted invitations)
 * Allows participants to leave and owner to remove participants
 */
export const ParticipantsList = ({ tourId, ownerId, currentUserId }: ParticipantsListProps) => {
  const { t, i18n } = useTranslation("tours");
  const locale = i18n.language;
  const { data: participants, isLoading, isError, error } = useParticipants(tourId);
  const removeParticipantMutation = useRemoveParticipantMutation(tourId);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    userId: string;
    displayName: string;
    isOwnerRemoving: boolean;
  }>({
    open: false,
    userId: "",
    displayName: "",
    isOwnerRemoving: false,
  });

  const isCurrentUserOwner = currentUserId === ownerId;

  const handleRemoveClick = (userId: string, displayName: string) => {
    setDialogState({
      open: true,
      userId,
      displayName,
      isOwnerRemoving: userId !== currentUserId,
    });
  };

  const handleRemoveConfirm = async () => {
    try {
      const isLeavingTour = !dialogState.isOwnerRemoving;
      await removeParticipantMutation.mutateAsync(dialogState.userId);
      if (dialogState.isOwnerRemoving) {
        toast.success(t("participants.removeSuccess", { name: dialogState.displayName }));
      } else {
        toast.success(t("participants.leaveSuccess"));
      }
      setDialogState({ open: false, userId: "", displayName: "", isOwnerRemoving: false });

      // Redirect to dashboard when user leaves the tour (self-removal)
      if (isLeavingTour) {
        window.location.href = `/${locale}`;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("participants.removeError");
      toast.error(errorMessage);
    }
  };

  const closeDialog = () => {
    setDialogState({ open: false, userId: "", displayName: "", isOwnerRemoving: false });
  };

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (isError) {
    return (
      <div className="alert alert-error">
        <span>
          {t("participants.loadError")}: {error?.message || t("participants.unknownError")}
        </span>
      </div>
    );
  }

  if (!participants || participants.length === 0) {
    return <div className="text-base-content/70 text-sm">{t("participants.noParticipants")}</div>;
  }

  return (
    <>
      <div className="space-y-2">
        <h3 className="font-semibold">
          {t("participants.title")} ({participants.length})
        </h3>
        <ul className="space-y-2">
          {participants.map((participant) => {
            const isOwner = participant.user_id === ownerId;
            const displayName = getUserDisplayName(
              participant.display_name,
              participant.email,
              t("participants.anonymousUser")
            );
            const isCurrentUser = participant.user_id === currentUserId;
            const canRemove = isCurrentUserOwner && !isOwner; // Owner can remove non-owner participants
            const canLeave = isCurrentUser && !isOwner; // Non-owner participants can leave

            return (
              <li key={participant.user_id} className="flex items-center gap-3 p-2 bg-base-200 rounded-lg">
                <Avatar src={participant.avatar_url} alt={displayName} size="md" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{displayName}</span>
                    {isOwner && <span className="badge badge-primary badge-sm">{t("participants.owner")}</span>}
                  </div>
                  <div className="text-xs text-base-content/60">
                    {t("participants.joinedOn")} {formatDate(participant.joined_at)}
                  </div>
                </div>
                {(canRemove || canLeave) && (
                  <Button
                    variant={canLeave ? "neutral-outline" : "error-outline"}
                    size="sm"
                    onClick={() => handleRemoveClick(participant.user_id, displayName)}
                    disabled={removeParticipantMutation.isPending}
                  >
                    {canLeave ? t("participants.leaveButton") : t("participants.removeButton")}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <Dialog open={dialogState.open} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="bg-base-100">
          <DialogHeader>
            <DialogTitle>
              {dialogState.isOwnerRemoving ? t("participants.removeTitle") : t("participants.leaveTitle")}
            </DialogTitle>
            <DialogDescription>
              {dialogState.isOwnerRemoving
                ? t("participants.removeConfirm", { name: dialogState.displayName })
                : t("participants.leaveConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="neutral-outline" onClick={closeDialog} disabled={removeParticipantMutation.isPending}>
              {t("common.cancel")}
            </Button>
            <Button variant="error" onClick={handleRemoveConfirm} disabled={removeParticipantMutation.isPending}>
              {removeParticipantMutation.isPending
                ? dialogState.isOwnerRemoving
                  ? t("participants.removing")
                  : t("participants.leaving")
                : t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
