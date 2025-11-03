import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useTourInvitations } from "@/lib/hooks/useInvitations";
import { useCancelInvitationMutation } from "@/lib/hooks/useInvitationMutations";
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

  const handleCancel = async (invitationId: string, email: string) => {
    if (!confirm(t("invitations.cancelConfirm", { email }))) {
      return;
    }

    try {
      await cancelMutation.mutateAsync(invitationId);
      toast.success(t("invitations.cancelSuccess", { email }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("invitations.cancelError");
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
          const canCancel = isOwner && invitation.status === "pending" && !isExpired;

          return (
            <li key={invitation.id} className="flex items-center justify-between gap-4 p-3 bg-base-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{invitation.email}</span>
                  <span className={getStatusBadgeClass(invitation.status)}>
                    {t(`invitations.status.${invitation.status}`)}
                  </span>
                  {isExpired && invitation.status === "pending" && (
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
              {canCancel && (
                <Button
                  variant="neutral-outline"
                  size="sm"
                  onClick={() => handleCancel(invitation.id, invitation.email)}
                  disabled={cancelMutation.isPending}
                  className="text-error hover:text-error"
                >
                  {cancelMutation.isPending ? t("invitations.canceling") : t("invitations.cancelButton")}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
