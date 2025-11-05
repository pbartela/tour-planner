import * as React from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Label text to display
   */
  label: string;
  /**
   * HTML id of the form control this label is for
   */
  htmlFor: string;
  /**
   * Optional hint text to display below the label
   */
  hint?: string;
  /**
   * Optional error message to display
   */
  error?: string;
  /**
   * Whether the field is required
   */
  required?: boolean;
  /**
   * The form control element (Input, Textarea, etc.)
   */
  children: React.ReactNode;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, htmlFor, hint, error, required = false, children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        <div className="flex items-baseline gap-1">
          <Label htmlFor={htmlFor} className="text-sm font-medium text-base-content/60">
            {label}
            {required && <span className="text-error ml-0.5">*</span>}
          </Label>
        </div>

        {hint && !error && <p className="text-xs text-base-content/50">{hint}</p>}

        {children}

        {error && (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

export { FormField };
