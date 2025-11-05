# Date Components

A comprehensive collection of date picker components built with shadcn/ui and styled with daisyUI for the Tour Planner application.

## Components

### DatePicker

A single date selection component with popover calendar.

```tsx
import { DatePicker } from "@/components/ui/DatePicker";

<DatePicker value={date} onChange={setDate} placeholder="Pick a date" variant="primary" size="md" />;
```

**Props:**

- `value?: Date` - Selected date
- `onChange?: (date: Date | undefined) => void` - Callback when date changes
- `placeholder?: string` - Placeholder text
- `variant?: "neutral" | "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" | "ghost"` - DaisyUI color variant
- `size?: "xs" | "sm" | "md" | "lg" | "xl"` - DaisyUI size variant
- `disabled?: boolean` - Whether the component is disabled
- `required?: boolean` - Whether the component is required
- `name?: string` - Form field name
- `id?: string` - Component ID
- `aria-label?: string` - Accessibility label
- `aria-describedby?: string` - Accessibility description

### DateRangePicker

A date range selection component with dual-month calendar.

```tsx
import { DateRangePicker } from "@/components/ui/DateRangePicker";

<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  placeholder="Pick a date range"
  variant="secondary"
  size="md"
/>;
```

**Props:**

- `value?: DateRange` - Selected date range
- `onChange?: (range: DateRange | undefined) => void` - Callback when range changes
- `placeholder?: string` - Placeholder text
- `variant?: "neutral" | "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" | "ghost"` - DaisyUI color variant
- `size?: "xs" | "sm" | "md" | "lg" | "xl"` - DaisyUI size variant
- `disabled?: boolean` - Whether the component is disabled
- `required?: boolean` - Whether the component is required
- `name?: string` - Form field name
- `id?: string` - Component ID
- `aria-label?: string` - Accessibility label
- `aria-describedby?: string` - Accessibility description

### DaisyCalendar

A standalone calendar component with daisyUI styling.

```tsx
import { DaisyCalendar } from "@/components/ui/DaisyCalendar";

<DaisyCalendar selected={date} onSelect={setDate} variant="bordered" size="lg" buttonVariant="primary" />;
```

**Props:**

- `variant?: "default" | "bordered" | "dashed"` - DaisyUI card variant
- `size?: "sm" | "md" | "lg" | "xl"` - DaisyUI card size
- `buttonVariant?: "neutral" | "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" | "ghost"` - Button variant for navigation
- `showOutsideDays?: boolean` - Whether to show days outside the current month
- `captionLayout?: "label" | "dropdown"` - Layout for the month/year caption
- All other props from `react-day-picker` DayPicker component

## Features

### Accessibility

- Full keyboard navigation support
- Screen reader compatible with proper ARIA attributes
- Focus management and visual indicators
- Semantic HTML structure

### Styling

- DaisyUI color variants (neutral, primary, secondary, accent, info, success, warning, error, ghost)
- DaisyUI size variants (xs, sm, md, lg, xl)
- Responsive design
- Dark mode support through DaisyUI themes

### Functionality

- Single date selection
- Date range selection
- Disabled date support
- Custom date formatting
- Form integration with hidden inputs
- Popover positioning and collision detection

## Usage Examples

### Basic Date Selection

```tsx
import { useState } from "react";
import { DatePicker } from "@/components/ui/DatePicker";

function MyComponent() {
  const [date, setDate] = useState<Date | undefined>(undefined);

  return <DatePicker value={date} onChange={setDate} placeholder="Select a date" variant="primary" />;
}
```

### Date Range Selection

```tsx
import { useState } from "react";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { DateRange } from "@/components/ui/DateRangePicker";

function MyComponent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  return (
    <DateRangePicker value={dateRange} onChange={setDateRange} placeholder="Select a date range" variant="secondary" />
  );
}
```

### Form Integration

```tsx
import { useState } from "react";
import { DatePicker } from "@/components/ui/DatePicker";

function MyForm() {
  const [date, setDate] = useState<Date | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Selected date:", date);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Event Date</span>
        </label>
        <DatePicker
          name="eventDate"
          value={date}
          onChange={setDate}
          placeholder="Select event date"
          variant="primary"
          required
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Submit
      </button>
    </form>
  );
}
```

### Standalone Calendar

```tsx
import { useState } from "react";
import { DaisyCalendar } from "@/components/ui/DaisyCalendar";

function MyComponent() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  return (
    <DaisyCalendar
      selected={selectedDate}
      onSelect={setSelectedDate}
      variant="bordered"
      size="lg"
      buttonVariant="primary"
    />
  );
}
```

## Dependencies

- `react-day-picker` - Calendar functionality
- `date-fns` - Date formatting
- `lucide-react` - Icons
- `@radix-ui/react-popover` - Popover functionality
- `class-variance-authority` - Variant management
- `tailwind-merge` - Class merging

## Storybook

All components are documented in Storybook with interactive examples:

- `DatePicker` stories
- `DateRangePicker` stories
- `DaisyCalendar` stories
- `DateComponents` overview

Run `npm run storybook` to view the documentation and examples.
