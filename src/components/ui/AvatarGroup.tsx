import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Array of avatar image URLs
   */
  avatars: string[];
  /**
   * Maximum number of avatars to show before showing "+N more"
   */
  maxVisible?: number;
  /**
   * Size of the avatars
   */
  size?: "sm" | "md" | "lg";
  /**
   * Alt text prefix for avatars
   */
  altPrefix?: string;
}

const sizeClasses = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-12 w-12",
};

const borderClasses = "border-2 border-base-100 dark:border-base-300";

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ avatars, maxVisible = 5, size = "md", altPrefix = "Participant", className, ...props }, ref) => {
    if (!avatars || avatars.length === 0) {
      return null;
    }

    const visibleAvatars = avatars.slice(0, maxVisible);
    const remainingCount = avatars.length - maxVisible;
    const showRemaining = remainingCount > 0;

    return (
      <div ref={ref} className={cn("flex -space-x-3", className)} {...props}>
        {visibleAvatars.map((avatar, index) => (
          <img
            key={index}
            src={avatar}
            alt={`${altPrefix} ${index + 1}`}
            className={cn(sizeClasses[size], borderClasses, "rounded-full object-cover")}
          />
        ))}
        {showRemaining && (
          <div
            className={cn(
              sizeClasses[size],
              borderClasses,
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
