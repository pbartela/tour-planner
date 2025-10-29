import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// DateRange type definition matching react-day-picker v9
export type DateRange = {
  from: Date | undefined;
  to?: Date | undefined;
};

const dateRangePickerVariants = cva("input w-full", {
  variants: {
    // DaisyUI Color variants
    variant: {
      neutral: "input-neutral",
      primary: "input-primary",
      secondary: "input-secondary",
      accent: "input-accent",
      info: "input-info",
      success: "input-success",
      warning: "input-warning",
      error: "input-error",
      ghost: "input-ghost",
    },

    // DaisyUI Size variants
    size: {
      xs: "input-xs",
      sm: "input-sm",
      md: "input-md",
      lg: "input-lg",
      xl: "input-xl",
    },
  },
  defaultVariants: {
    variant: "neutral",
    size: "md",
  },
});

export interface DateRangePickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof dateRangePickerVariants> {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

const DateRangePicker = React.forwardRef<HTMLDivElement, DateRangePickerProps>(
  (
    {
      className,
      variant,
      size,
      value,
      onChange,
      placeholder = "Pick a date range",
      disabled = false,
      required = false,
      name,
      id,
      "aria-label": ariaLabel,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    const handleRangeSelect = (selectedRange: DateRange | undefined) => {
      onChange?.(selectedRange);
      // Keep popover open for range selection
      if (selectedRange?.from && !selectedRange?.to) {
        return;
      }
      setOpen(false);
    };

    const formatDateRange = (range: DateRange | undefined) => {
      if (!range?.from) return "";
      
      if (range.to) {
        return `${format(range.from, "MMM dd")} - ${format(range.to, "MMM dd, yyyy")}`;
      }
      
      return format(range.from, "MMM dd, yyyy");
    };

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                dateRangePickerVariants({ variant, size }),
                "justify-start text-left font-normal",
                !value?.from && "text-muted-foreground"
              )}
              disabled={disabled}
              aria-label={ariaLabel}
              aria-describedby={ariaDescribedBy}
              aria-required={required}
              aria-expanded={open}
              aria-haspopup="dialog"
              role="combobox"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value?.from ? formatDateRange(value) : <span>{placeholder}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={handleRangeSelect}
              numberOfMonths={2}
              disabled={(date) => date < new Date("1900-01-01")}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {/* Hidden inputs for form submission */}
        {name && (
          <>
            <input
              type="hidden"
              name={`${name}_from`}
              value={value?.from ? value.from.toISOString() : ""}
              required={required}
            />
            <input
              type="hidden"
              name={`${name}_to`}
              value={value?.to ? value.to.toISOString() : ""}
            />
          </>
        )}
      </div>
    );
  }
);

DateRangePicker.displayName = "DateRangePicker";

export { DateRangePicker, dateRangePickerVariants };

