import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { getUserDisplayName } from "@/lib/utils/user-name.util";
import type { ParticipantSummaryDto } from "@/types";

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Array of participant objects with display name, email, and avatar URL
   */
  participants: ParticipantSummaryDto[];
  /**
   * Maximum number of avatars to show before showing "+N more"
   */
  maxVisible?: number;
  /**
   * Size of the avatars
   */
  size?: "sm" | "md" | "lg";
  /**
   * Label to use for anonymous users (when no display_name or email)
   */
  anonymousLabel?: string;
  /**
   * Hide avatar borders (useful for dense layouts)
   */
  borderless?: boolean;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
};

const borderClasses = "border-2 border-base-100 dark:border-base-300";

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  (
    { participants, maxVisible = 5, size = "md", anonymousLabel = "Anonymous", borderless = false, className, ...props },
    ref
  ) => {
    if (!participants || participants.length === 0) {
      return null;
    }

    const visibleParticipants = participants.slice(0, maxVisible);
    const remainingCount = participants.length - maxVisible;
    const showRemaining = remainingCount > 0;

    // Map Avatar component size prop to smaller sizes for group display
    const avatarSize = size === "sm" ? "xs" : size === "lg" ? "sm" : "xs";
    const countSizeClass = sizeClasses[avatarSize];

    return (
      <div ref={ref} className={cn("flex items-center", className)} {...props}>
        <div className="flex -space-x-3">
          {visibleParticipants.map((participant) => {
            const displayName = getUserDisplayName(participant.display_name, participant.email, anonymousLabel);

            return (
              <div key={participant.user_id} className={borderless ? undefined : borderClasses}>
                <Avatar src={participant.avatar_url} alt={displayName} size={avatarSize} />
              </div>
            );
          })}
        </div>
        {showRemaining && (
          <div
            className={cn(
              "ml-2",
              countSizeClass,
              borderless ? undefined : borderClasses,
              "rounded-full bg-base-200 flex items-center justify-center text-xs font-semibold text-base-content"
            )}
            aria-label={`${remainingCount} more ${remainingCount === 1 ? "participant" : "participants"}`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = "AvatarGroup";

export { AvatarGroup };
