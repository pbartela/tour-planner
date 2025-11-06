import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InvitationStatusBadge } from "@/components/ui/InvitationStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { useTourInvitations } from "@/lib/hooks/useInvitations";
import { useCancelInvitationMutation, useResendInvitationMutation } from "@/lib/hooks/useInvitationMutations";
import { useDialogState } from "@/lib/hooks/useDialogState";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import { InvitationPermissions } from "@/lib/services/invitation-permissions.service";
import { formatDate } from "@/lib/utils/date-formatters";

interface InvitedUsersListProps {
  tourId: string;
  isOwner: boolean;
}

/**
 * Component for displaying the list of invited users with their statuses
 * Uses InvitationPermissions service for business logic
 * Refactored to separate concerns and reduce complexity
 */
export const InvitedUsersList = ({ tourId, isOwner }: InvitedUsersListProps) => {
  const { t } = useTranslation("tours");
  const { data: invitations, isLoading, isError, error } = useTourInvitations({ tourId });
  const cancelMutation = useCancelInvitationMutation(tourId);
  const resendMutation = useResendInvitationMutation(tourId);
  const { dialogState, openDialog, closeDialog } = useDialogState();

  const handleCancelClick = (invitationId: string, email: string) => {
    openDialog(invitationId, email);
  };

  const handleCancelConfirm = async () => {
    try {
      await cancelMutation.mutateAsync(dialogState.invitationId);
      toast.success(t("invitations.cancelSuccess", { email: dialogState.email }));
      closeDialog();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("invitations.cancelError");
      toast.error(errorMessage);
    }
  };

  const handleResend = async (invitationId: string, email: string) => {
    try {
      await resendMutation.mutateAsync(invitationId);
      toast.success(t("invitations.resendSuccess", { email }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("invitations.resendError");
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (isError) {
    return (
      <div className="alert alert-error">
        <span>
          {t("invitations.loadError")}: {error?.message || t("invitations.unknownError")}
        </span>
      </div>
    );
  }

  if (!invitations || invitations.length === 0) {
    return <div className="text-base-content/70 text-sm">{t("invitations.noInvitations")}</div>;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">{t("invitations.listTitle")}</h3>
      <ul className="space-y-2">
        {invitations.map((invitation) => {
          const isExpired = InvitationPermissions.isExpired(invitation);
          const status = invitation.status as "pending" | "accepted" | "declined";
          const actions = InvitationPermissions.getAvailableActions(invitation, isOwner);

          // Dynamic status translation keys (extracted by i18next-parser):
          // t('invitations.status.pending'), t('invitations.status.accepted'), t('invitations.status.declined')

          return (
            <li key={invitation.id} className="flex items-center justify-between gap-4 p-3 bg-base-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{invitation.email}</span>
                  <InvitationStatusBadge status={status} expired={isExpired}>
                    {t(`invitations.status.${status}`)}
                  </InvitationStatusBadge>
                  {isExpired && status === "pending" && (
                    <Badge variant="neutral" size="sm">
                      {t("invitations.expired")}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-base-content/70 mt-1">
                  {t("invitations.invitedOn")} {formatDate(invitation.created_at)}
                  {invitation.expires_at && (
                    <>
                      {" • "}
                      {t("invitations.expiresOn")} {formatDate(invitation.expires_at)}
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {actions.canCancel && (
                  <Button
                    variant="neutral-outline"
                    size="sm"
                    onClick={() => handleCancelClick(invitation.id, invitation.email)}
                    disabled={cancelMutation.isPending}
                    className="text-error hover:text-error"
                  >
                    {cancelMutation.isPending ? t("invitations.canceling") : t("invitations.cancelButton")}
                  </Button>
                )}
                {actions.canResend && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleResend(invitation.id, invitation.email)}
                    disabled={resendMutation.isPending}
                  >
                    {resendMutation.isPending ? t("invitations.resending") : t("invitations.resendButton")}
                  </Button>
                )}
                {actions.canRemove && (
                  <Button
                    variant="neutral-outline"
                    size="sm"
                    onClick={() => handleCancelClick(invitation.id, invitation.email)}
                    disabled={cancelMutation.isPending}
                    className="text-error hover:text-error"
                  >
                    {cancelMutation.isPending ? t("invitations.removing") : t("invitations.removeButton")}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={dialogState.open} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("invitations.cancelTitle")}</DialogTitle>
            <DialogDescription>{t("invitations.cancelConfirm", { email: dialogState.email })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="neutral-outline" onClick={closeDialog} disabled={cancelMutation.isPending}>
              {t("common.cancel")}
            </Button>
            <Button variant="error" onClick={handleCancelConfirm} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? t("invitations.canceling") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
