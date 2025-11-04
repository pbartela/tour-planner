import { useState } from "react";
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
import { useTourInvitations } from "@/lib/hooks/useInvitations";
import { useCancelInvitationMutation, useResendInvitationMutation } from "@/lib/hooks/useInvitationMutations";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";

interface InvitedUsersListProps {
  tourId: string;
  isOwner: boolean;
}

/**
 * Component for displaying the list of invited users with their statuses.
 * Shows pending, accepted, and declined invitations.
 */
export const InvitedUsersList = ({ tourId, isOwner }: InvitedUsersListProps) => {
  const { t } = useTranslation("tours");
  const { data: invitations, isLoading, isError, error } = useTourInvitations({ tourId });
  const cancelMutation = useCancelInvitationMutation(tourId);
  const resendMutation = useResendInvitationMutation(tourId);
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; invitationId: string; email: string }>({
    open: false,
    invitationId: "",
    email: "",
  });

  const handleCancelClick = (invitationId: string, email: string) => {
    setCancelDialog({ open: true, invitationId, email });
  };

  const handleCancelConfirm = async () => {
    try {
      await cancelMutation.mutateAsync(cancelDialog.invitationId);
      toast.success(t("invitations.cancelSuccess", { email: cancelDialog.email }));
      setCancelDialog({ open: false, invitationId: "", email: "" });
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

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case "pending":
        return "badge badge-warning";
      case "accepted":
        return "badge badge-success";
      case "declined":
        return "badge badge-error";
      default:
        return "badge badge-neutral";
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
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
          const isExpired = new Date(invitation.expires_at) < new Date();
          const status = invitation.status as "pending" | "accepted" | "declined";

          const canCancel = isOwner && status === "pending" && !isExpired;
          // Allow removing declined invitations or expired pending invitations
          const canRemove = isOwner && (status === "declined" || (status === "pending" && isExpired));
          // Allow resending declined invitations or expired pending invitations
          const canResend = isOwner && (status === "declined" || (status === "pending" && isExpired));

          return (
            <li key={invitation.id} className="flex items-center justify-between gap-4 p-3 bg-base-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{invitation.email}</span>
                  <span className={getStatusBadgeClass(status)}>{t(`invitations.status.${status}`)}</span>
                  {isExpired && status === "pending" && (
                    <span className="badge badge-neutral badge-sm">{t("invitations.expired")}</span>
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
                {canCancel && (
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
                {canResend && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleResend(invitation.id, invitation.email)}
                    disabled={resendMutation.isPending}
                  >
                    {resendMutation.isPending ? t("invitations.resending") : t("invitations.resendButton")}
                  </Button>
                )}
                {canRemove && (
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

      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) => !open && setCancelDialog({ open: false, invitationId: "", email: "" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("invitations.cancelTitle")}</DialogTitle>
            <DialogDescription>{t("invitations.cancelConfirm", { email: cancelDialog.email })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="neutral-outline"
              onClick={() => setCancelDialog({ open: false, invitationId: "", email: "" })}
              disabled={cancelMutation.isPending}
            >
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
