import * as React from "react";

export interface DaisyCalendarWeekNumberProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
}

export const DaisyCalendarWeekNumber = React.forwardRef<HTMLTableCellElement, DaisyCalendarWeekNumberProps>(
  ({ children, ...props }, ref) => {
    return (
      <td ref={ref} {...props}>
        <div className="flex size-(--cell-size) items-center justify-center text-center">{children}</div>
      </td>
    );
  }
);

DaisyCalendarWeekNumber.displayName = "DaisyCalendarWeekNumber";
