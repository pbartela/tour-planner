import type { ComponentProps } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

import { Input } from "./input";
import { Label } from "./label";

export interface InputWithLabelProps extends ComponentProps<typeof Input> {
  label: string;
  description?: string;
  error?: string;
}
const InputWithLabel = forwardRef<HTMLInputElement, InputWithLabelProps>(
  ({ id, label, description, className, error, ...props }, ref) => {
    return (
      <div className={cn("form-control w-full", className)}>
        <Label htmlFor={id} className="label">
          <span className="label-text">{label}</span>
        </Label>
        <Input ref={ref} id={id} {...props} className="input input-bordered" />
        {(description || error) && (
          <Label htmlFor={id} className="label">
            <span className={cn("label-text-alt", { "text-error": error })}>{error || description}</span>
          </Label>
        )}
      </div>
    );
  }
);

InputWithLabel.displayName = "InputWithLabel";

export { InputWithLabel };
