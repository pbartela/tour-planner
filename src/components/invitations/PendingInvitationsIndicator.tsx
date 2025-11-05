import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { useUserPendingInvitations } from "@/lib/hooks/useUserPendingInvitations";
import { useAcceptInvitationMutation, useDeclineInvitationMutation } from "@/lib/hooks/useInvitationMutations";
import type { InvitationDto } from "@/types";

/**
 * Calculate days until expiration
 */
function getDaysUntilExpiration(expiresAt: string): number {
  const now = new Date();
  const expiryDate = new Date(expiresAt);
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Format expiration message based on days remaining
 */
function formatExpirationMessage(
  expiresAt: string,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  const days = getDaysUntilExpiration(expiresAt);

  if (days <= 0) {
    return t("invitations.expiresToday");
  } else if (days === 1) {
    return t("invitations.expiresInOneDay");
  } else {
    return t("invitations.expiresIn", { days });
  }
}

/**
 * Individual invitation item component
 */
interface InvitationItemProps {
  invitation: InvitationDto;
  onAccept: (id: string, token?: string) => void;
  onDecline: (id: string, token?: string) => void;
  isProcessing: boolean;
}

function InvitationItem({ invitation, onAccept, onDecline, isProcessing }: InvitationItemProps) {
  const { t } = useTranslation("common");
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(invitation.id, invitation.token);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      await onDecline(invitation.id, invitation.token);
    } finally {
      setIsDeclining(false);
    }
  };

  const daysUntilExpiration = getDaysUntilExpiration(invitation.expires_at);
  const isExpiringSoon = daysUntilExpiration <= 2;

  return (
    <li className="border-b border-base-300 last:border-b-0">
      <div className="p-3 space-y-2">
        {/* Tour title */}
        <div className="font-semibold text-base-content">{invitation.tour_title || "Unnamed Tour"}</div>

        {/* Inviter info */}
        <div className="text-sm text-base-content/70">
          {t("invitations.invitedBy", {
            name: invitation.inviter_display_name || invitation.email || "Unknown",
          })}
        </div>

        {/* Expiration date */}
        <div className={`text-xs ${isExpiringSoon ? "text-warning" : "text-base-content/60"}`}>
          {formatExpirationMessage(invitation.expires_at, t)}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleAccept}
            disabled={isProcessing || isAccepting || isDeclining}
            className="btn btn-success btn-xs flex-1"
          >
            {isAccepting ? <span className="loading loading-spinner loading-xs"></span> : t("invitations.accept")}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            disabled={isProcessing || isAccepting || isDeclining}
            className="btn btn-error btn-xs flex-1"
          >
            {isDeclining ? <span className="loading loading-spinner loading-xs"></span> : t("invitations.decline")}
          </button>
        </div>
      </div>
    </li>
  );
}

/**
 * Pending invitations indicator component
 * Displays a bell icon with badge count and dropdown list of pending invitations
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
