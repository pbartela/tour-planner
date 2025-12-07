import type { SupabaseClient } from "@/db/supabase.client";
import * as logger from "./logger.service";

/**
 * Audit log action types following the pattern: resource.action
 */
export const AuditActions = {
  // Account actions
  ACCOUNT_CREATED: "account.created",
  ACCOUNT_DELETED: "account.deleted",
  ACCOUNT_DELETION_BLOCKED: "account.deletion_blocked",

  // Profile actions
  PROFILE_UPDATED: "profile.updated",
  PROFILE_AVATAR_UPLOADED: "profile.avatar_uploaded",
  PROFILE_AVATAR_DELETED: "profile.avatar_deleted",

  // Tour actions
  TOUR_CREATED: "tour.created",
  TOUR_UPDATED: "tour.updated",
  TOUR_DELETED: "tour.deleted",
  TOUR_ARCHIVED: "tour.archived",

  // Participant actions
  PARTICIPANT_JOINED: "participant.joined",
  PARTICIPANT_LEFT: "participant.left",
  PARTICIPANT_REMOVED: "participant.removed",

  // Invitation actions
  INVITATION_SENT: "invitation.sent",
  INVITATION_ACCEPTED: "invitation.accepted",
  INVITATION_DECLINED: "invitation.declined",

  // Authentication actions
  AUTH_LOGIN_SUCCESS: "auth.login_success",
  AUTH_LOGIN_FAILED: "auth.login_failed",
  AUTH_LOGOUT: "auth.logout",
} as const;

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];

interface AuditLogEntry {
  userId: string | null;
  actionType: AuditAction;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Service for logging important user actions for compliance and security
 *
 * Usage:
 * ```ts
 * await auditLog(adminClient, {
 *   userId: user.id,
 *   actionType: AuditActions.ACCOUNT_DELETED,
 *   resourceType: "profile",
 *   resourceId: user.id,
 *   metadata: { reason: "user_request" },
 *   ipAddress: request.headers.get("x-forwarded-for"),
 *   userAgent: request.headers.get("user-agent"),
 * });
 * ```
 */
export async function auditLog(supabaseAdmin: SupabaseClient, entry: AuditLogEntry): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("audit_logs").insert({
      user_id: entry.userId,
      action_type: entry.actionType,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      metadata: entry.metadata || {},
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
    });

    if (error) {
      logger.error("Failed to write audit log", error);
    }
  } catch (error) {
    // Never throw - audit logging failures should not break the application
    logger.error("Unexpected error writing audit log", error instanceof Error ? error : undefined);
  }
}

/**
 * Helper to extract IP address from request
 */
export function getClientIp(request: Request): string | undefined {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined;
}

/**
 * Helper to extract user agent from request
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get("user-agent") || undefined;
}
