import * as React from "react";
import { Sparkles } from "lucide-react";
import { Badge, type BadgeProps } from "./Badge";
import { cn } from "@/lib/utils";

export interface ActivityIndicatorProps extends Omit<BadgeProps, "variant" | "animated"> {
  /**
   * Whether there is new activity to display
   */
  hasActivity: boolean;
  /**
   * Accessible label for screen readers
   */
  label?: string;
  /**
   * Size of the indicator
   */
  size?: "sm" | "md" | "lg";
}

const ActivityIndicator = React.forwardRef<HTMLSpanElement, ActivityIndicatorProps>(
  ({ hasActivity, label = "New activity", size = "md", className, ...props }, ref) => {
    if (!hasActivity) {
      return null;
    }

    const iconSizeClasses = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    return (
      <Badge
        ref={ref}
        variant="primary"
        size={size}
        animated
        aria-label={label}
        title={label}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <Sparkles className={iconSizeClasses[size]} />
      </Badge>
    );
  }
);

ActivityIndicator.displayName = "ActivityIndicator";

export { ActivityIndicator };
