import type { InvitationDto } from "@/types";
import { isPastDate } from "@/lib/utils/date-formatters";

/**
 * Service for managing invitation permissions logic
 * Encapsulates business rules for invitation actions (cancel, resend, remove)
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class InvitationPermissions {
  /**
   * Check if owner can cancel a pending invitation
   * Only pending, non-expired invitations can be cancelled
   */
  static canCancel(invitation: InvitationDto, isOwner: boolean): boolean {
    if (!isOwner) return false;

    const isExpired = isPastDate(invitation.expires_at);
    return invitation.status === "pending" && !isExpired;
  }

  /**
   * Check if owner can resend an invitation
   * Can resend declined or expired pending invitations
   */
  static canResend(invitation: InvitationDto, isOwner: boolean): boolean {
    if (!isOwner) return false;

    const isExpired = isPastDate(invitation.expires_at);
    return invitation.status === "declined" || (invitation.status === "pending" && isExpired);
  }

  /**
   * Check if owner can remove an invitation
   * Can remove declined or expired pending invitations
   */
  static canRemove(invitation: InvitationDto, isOwner: boolean): boolean {
    // Same logic as canResend
    return this.canResend(invitation, isOwner);
  }

  /**
   * Check if invitation is expired
   */
  static isExpired(invitation: InvitationDto): boolean {
    return isPastDate(invitation.expires_at);
  }

  /**
   * Get all available actions for an invitation
   */
  static getAvailableActions(
    invitation: InvitationDto,
    isOwner: boolean
  ): {
    canCancel: boolean;
    canResend: boolean;
    canRemove: boolean;
  } {
    return {
      canCancel: this.canCancel(invitation, isOwner),
      canResend: this.canResend(invitation, isOwner),
      canRemove: this.canRemove(invitation, isOwner),
    };
  }
}
