import * as React from "react";
import { Badge, type BadgeProps } from "./Badge";
import { cn } from "@/lib/utils";

export type InvitationStatus = "pending" | "accepted" | "declined";

export interface InvitationStatusBadgeProps extends Omit<BadgeProps, "variant"> {
  /**
   * The status of the invitation
   */
  status: InvitationStatus;
  /**
   * Whether the invitation has expired
   */
  expired?: boolean;
  /**
   * Size of the badge
   */
  size?: "sm" | "md" | "lg";
}

const statusVariantMap: Record<InvitationStatus, BadgeProps["variant"]> = {
  pending: "warning",
  accepted: "success",
  declined: "error",
};

const InvitationStatusBadge = React.forwardRef<HTMLSpanElement, InvitationStatusBadgeProps>(
  ({ status, expired = false, size = "md", className, children, ...props }, ref) => {
    const variant = expired ? "neutral" : statusVariantMap[status];

    return (
      <Badge ref={ref} variant={variant} size={size} className={cn(expired && "opacity-60", className)} {...props}>
        {children}
      </Badge>
    );
  }
);

InvitationStatusBadge.displayName = "InvitationStatusBadge";

export { InvitationStatusBadge };
