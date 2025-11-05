import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("badge", {
  variants: {
    // DaisyUI Color Variants
    variant: {
      neutral: "badge-neutral",
      primary: "badge-primary",
      secondary: "badge-secondary",
      accent: "badge-accent",
      info: "badge-info",
      success: "badge-success",
      warning: "badge-warning",
      error: "badge-error",
      ghost: "badge-ghost",
    },

    // DaisyUI Size variants
    size: {
      sm: "badge-sm",
      md: "badge-md", // default
      lg: "badge-lg",
    },

    // Additional styling options
    outline: {
      true: "badge-outline",
      false: "",
    },
  },
  defaultVariants: {
    variant: "neutral",
    size: "md",
    outline: false,
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  /**
   * Whether the badge should have a pulse animation
   */
  animated?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, outline, animated, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-slot="badge"
        className={cn(
          badgeVariants({ variant, size, outline }),
          animated && "animate-pulse",
          "inline-flex items-center justify-center gap-1",
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
