import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva("btn", {
  variants: {
    // DaisyUI Color Variants
    variant: {
      // DaisyUI Color variants
      neutral: "btn-neutral",
      primary: "btn-primary",
      secondary: "btn-secondary",
      accent: "btn-accent",
      info: "btn-info",
      success: "btn-success",
      warning: "btn-warning",
      error: "btn-error",

      // DaisyUI Style variants (combined with colors above)
      "neutral-outline": "btn-neutral btn-outline",
      "primary-outline": "btn-primary btn-outline",
      "secondary-outline": "btn-secondary btn-outline",
      "accent-outline": "btn-accent btn-outline",
      "info-outline": "btn-info btn-outline",
      "success-outline": "btn-success btn-outline",
      "warning-outline": "btn-warning btn-outline",
      "error-outline": "btn-error btn-outline",

      "neutral-dash": "btn-neutral btn-dash",
      "primary-dash": "btn-primary btn-dash",
      "secondary-dash": "btn-secondary btn-dash",
      "accent-dash": "btn-accent btn-dash",
      "info-dash": "btn-info btn-dash",
      "success-dash": "btn-success btn-dash",
      "warning-dash": "btn-warning btn-dash",
      "error-dash": "btn-error btn-dash",

      "neutral-soft": "btn-neutral btn-soft",
      "primary-soft": "btn-primary btn-soft",
      "secondary-soft": "btn-secondary btn-soft",
      "accent-soft": "btn-accent btn-soft",
      "info-soft": "btn-info btn-soft",
      "success-soft": "btn-success btn-soft",
      "warning-soft": "btn-warning btn-soft",
      "error-soft": "btn-error btn-soft",

      // DaisyUI Special variants
      ghost: "btn-ghost",
      link: "btn-link",

      // Active states (can be combined)
      "neutral-active": "btn-neutral btn-active",
      "primary-active": "btn-primary btn-active",
      "secondary-active": "btn-secondary btn-active",
      "accent-active": "btn-accent btn-active",
      "info-active": "btn-info btn-active",
      "success-active": "btn-success btn-active",
      "warning-active": "btn-warning btn-active",
      "error-active": "btn-error btn-active",
    },

    // DaisyUI Size variants
    size: {
      xs: "btn-xs",
      sm: "btn-sm",
      default: "", // md is default
      lg: "btn-lg",
      xl: "btn-xl",
      // Legacy shadcn sizes for backward compatibility
      "shadcn-default": "h-9 px-4 py-2 has-[>svg]:px-3",
      "shadcn-lg": "h-12 px-5 rounded-xl",
    },

    // DaisyUI Shape variants
    shape: {
      default: "",
      wide: "btn-wide",
      block: "btn-block",
      square: "btn-square",
      circle: "btn-circle",
    },
  },
  defaultVariants: {
    variant: "neutral",
    size: "default",
    shape: "default",
  },
});

function Button({
  className,
  variant,
  size,
  shape,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, shape, className }))} {...props} />;
}

export { Button, buttonVariants };
