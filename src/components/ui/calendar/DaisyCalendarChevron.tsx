import * as React from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DaisyCalendarChevronProps extends React.SVGProps<SVGSVGElement> {
  orientation?: "left" | "right" | "down" | "up";
}

export const DaisyCalendarChevron = React.forwardRef<SVGSVGElement, DaisyCalendarChevronProps>(
  ({ className, orientation, ...props }, ref) => {
    if (orientation === "left") {
      return <ChevronLeftIcon ref={ref} className={cn("size-4", className)} {...props} />;
    }

    if (orientation === "right") {
      return <ChevronRightIcon ref={ref} className={cn("size-4", className)} {...props} />;
    }

    return <ChevronDownIcon ref={ref} className={cn("size-4", className)} {...props} />;
  }
);

DaisyCalendarChevron.displayName = "DaisyCalendarChevron";
