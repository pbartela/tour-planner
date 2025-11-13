import React from "react";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { useUserPendingInvitations } from "@/lib/hooks/useUserPendingInvitations";
import { useAcceptInvitationMutation, useDeclineInvitationMutation } from "@/lib/hooks/useInvitationMutations";
import { InvitationItem } from "./InvitationItem";

/**
 * Pending invitations indicator component
 * Displays a bell icon with badge count and dropdown list of pending invitations
 * Refactored to use extracted InvitationItem component and utility functions
 */
export function PendingInvitationsIndicator(): React.JSX.Element {
  const { t } = useTranslation("common");
  const { data: invitations, isLoading, isError, refetch } = useUserPendingInvitations();
  const acceptMutation = useAcceptInvitationMutation();
  const declineMutation = useDeclineInvitationMutation();

  const pendingCount = invitations?.length || 0;
  const isProcessing = acceptMutation.isPending || declineMutation.isPending;

  const handleAccept = async (invitationId: string, token?: string) => {
    try {
      await acceptMutation.mutateAsync({ invitationId, token });
      // Refetch pending invitations to update the list
      await refetch();
      // Show success message (you can add a toast notification here)
    } catch {
      // Error is already handled by the mutation
      // Show error message (you can add a toast notification here)
    }
  };

  const handleDecline = async (invitationId: string, token?: string) => {
    try {
      await declineMutation.mutateAsync({ invitationId, token });
      // Refetch pending invitations to update the list
      await refetch();
      // Show success message (you can add a toast notification here)
    } catch {
      // Error is already handled by the mutation
      // Show error message (you can add a toast notification here)
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="dropdown dropdown-end">
      {/* Bell icon button with badge */}
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        <div className="indicator">
          {pendingCount > 0 && <span className="indicator-item badge badge-error badge-sm">{pendingCount}</span>}
          <Bell className="h-5 w-5" />
        </div>
      </div>

      {/* Dropdown content */}
      <div className="dropdown-content bg-base-300 rounded-box z-50 w-96 shadow-2xl mt-2">
        {/* Header */}
        <div className="p-3 border-b border-base-300 flex justify-between items-center">
          <h3 className="font-semibold text-base-content">{t("invitations.pending")}</h3>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn btn-ghost btn-xs"
            aria-label={t("invitations.refresh")}
          >
            {isLoading ? <span className="loading loading-spinner loading-xs"></span> : t("invitations.refresh")}
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading && !invitations ? (
            <div className="p-6 text-center text-base-content/70">
              <span className="loading loading-spinner loading-md"></span>
              <p className="mt-2">{t("invitations.loading")}</p>
            </div>
          ) : isError ? (
            <div className="p-6 text-center text-error">
              <p>{t("invitations.error")}</p>
              <button type="button" onClick={handleRefresh} className="btn btn-sm btn-ghost mt-2">
                {t("invitations.refresh")}
              </button>
            </div>
          ) : pendingCount === 0 ? (
            <div className="p-6 text-center text-base-content/70">
              <p>{t("invitations.noPending")}</p>
            </div>
          ) : (
            <ul className="menu p-0">
              {invitations?.map((invitation) => (
                <InvitationItem
                  key={invitation.id}
                  invitation={invitation}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  isProcessing={isProcessing}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
