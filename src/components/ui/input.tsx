import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva("input w-full", {
  variants: {
    // DaisyUI Color variants
    variant: {
      // DaisyUI Color variants
      neutral: "input-neutral",
      primary: "input-primary",
      secondary: "input-secondary",
      accent: "input-accent",
      info: "input-info",
      success: "input-success",
      warning: "input-warning",
      error: "input-error",

      // DaisyUI Style variants
      ghost: "input-ghost",
    },

    // DaisyUI Size variants
    size: {
      // DaisyUI sizes
      xs: "input-xs",
      sm: "input-sm",
      md: "input-md", // DaisyUI default
      lg: "input-lg",
      xl: "input-xl",

      // Legacy shadcn sizes for backward compatibility
      "shadcn-default": "h-10",
      "shadcn-sm": "h-9 rounded-md px-3 text-sm",
      "shadcn-lg": "h-11 rounded-md px-3 text-base",
    },
  },
  defaultVariants: {
    variant: "neutral",
    size: "md",
  },
});

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, variant, size, type, ...props }, ref) => {
  return <input type={type} className={cn(inputVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Input.displayName = "Input";

export { Input, inputVariants };
