import * as React from "react";

export interface CalendarWeekNumberProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
}

export const CalendarWeekNumber = React.forwardRef<HTMLTableCellElement, CalendarWeekNumberProps>(
  ({ children, ...props }, ref) => {
    return (
      <td ref={ref} {...props}>
        <div className="flex size-(--cell-size) items-center justify-center text-center">{children}</div>
      </td>
    );
  }
);

CalendarWeekNumber.displayName = "CalendarWeekNumber";
