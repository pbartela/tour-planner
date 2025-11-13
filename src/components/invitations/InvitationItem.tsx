import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { InvitationDto } from "@/types";
import { getDaysUntilExpiration, formatExpirationMessage } from "@/lib/utils/date-formatters";

/**
 * Individual invitation item component
 * Memoized to prevent unnecessary re-renders
 */
interface InvitationItemProps {
  invitation: InvitationDto;
  onAccept: (id: string, token?: string) => Promise<void>;
  onDecline: (id: string, token?: string) => Promise<void>;
  isProcessing: boolean;
}

const InvitationItemComponent = ({ invitation, onAccept, onDecline, isProcessing }: InvitationItemProps) => {
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
};

/**
 * Memoized InvitationItem component
 * Uses default shallow comparison to detect prop changes
 */
export const InvitationItem = React.memo(InvitationItemComponent);
