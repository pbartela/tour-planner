import * as React from "react";
import { cn } from "@/lib/utils";

export interface CalendarRootProps extends React.HTMLAttributes<HTMLDivElement> {
  rootRef?: React.Ref<HTMLDivElement>;
}

export const CalendarRoot = React.forwardRef<HTMLDivElement, CalendarRootProps>(
  ({ className, rootRef, ...props }, _ref) => {
    return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
  }
);

CalendarRoot.displayName = "CalendarRoot";
