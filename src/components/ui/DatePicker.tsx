import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const datePickerVariants = cva("input w-full", {
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

export interface DatePickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof datePickerVariants> {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  locale?: string;
  minDate?: Date;
  maxDate?: Date;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

/**
 * Get the date format pattern for a given locale
 * Returns the format string that shows the expected date pattern
 *
 * @param locale - The locale code (e.g., 'en-US', 'pl-PL', 'fr-FR')
 * @returns Format string like 'MM/DD/YYYY' or 'DD/MM/YYYY'
 */
export const getDateFormatHint = (locale: string): string => {
  // US locale uses MM/DD/YYYY format
  if (locale.startsWith("en-US") || locale === "en") {
    return "MM/DD/YYYY";
  }
  // All other locales use DD/MM/YYYY format
  return "DD/MM/YYYY";
};

/**
 * Format date with consistent slash separators
 * - en-US: MM/DD/YYYY (12/25/2025)
 * - All others: DD/MM/YYYY (25/12/2025)
 *
 * @param date - The date to format
 * @param locale - The locale to use for formatting
 * @returns Formatted date string
 */
const formatDateByLocale = (date: Date | undefined, locale: string): string => {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  // US locale uses MM/DD/YYYY format
  if (locale.startsWith("en-US") || locale === "en") {
    return `${month}/${day}/${year}`;
  }

  // All other locales use DD/MM/YYYY format
  return `${day}/${month}/${year}`;
};

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      className,
      variant,
      size,
      value,
      onChange,
      placeholder = "Pick a date",
      disabled = false,
      required = false,
      name,
      id,
      locale: propLocale,
      minDate,
      maxDate,
      "aria-label": ariaLabel,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    // Use provided locale, fallback to browser locale, or default to en-US
    const locale = propLocale || (typeof navigator !== "undefined" ? navigator.language : undefined) || "en-US";

    const handleDateSelect = (selectedDate: Date | undefined) => {
      onChange?.(selectedDate);
      setOpen(false);
    };

    const formatDate = (date: Date | undefined) => {
      return formatDateByLocale(date, locale);
    };

    // Determine disabled dates
    const isDateDisabled = (date: Date) => {
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;
      return false;
    };

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className={cn(
                datePickerVariants({ variant, size }),
                "justify-start text-left font-normal bg-base-200 border-none rounded-lg",
                !value && "text-base-content/40"
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
              {value ? formatDate(value) : <span>{placeholder}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-base-100" align="start">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {/* Hidden input for form submission */}
        {name && (
          <input
            type="hidden"
            id={id}
            name={name}
            value={value ? value.toISOString().split("T")[0] : ""}
            required={required}
          />
        )}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

export { DatePicker, datePickerVariants };
