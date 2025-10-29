import * as React from "react";
import { cn } from "@/lib/utils";

export interface DaisyCalendarRootProps extends React.HTMLAttributes<HTMLDivElement> {
  rootRef?: React.Ref<HTMLDivElement>;
}

export const DaisyCalendarRoot = React.forwardRef<HTMLDivElement, DaisyCalendarRootProps>(
  ({ className, rootRef, ...props }, _ref) => {
    return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
  }
);

DaisyCalendarRoot.displayName = "DaisyCalendarRoot";
