import type { Meta, StoryObj } from "@storybook/react-vite";
import { DateRangePicker, type DateRange } from "./DateRangePicker";
import { useState } from "react";

const meta = {
  title: "Components/UI/DateRangePicker",
  component: DateRangePicker,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["neutral", "primary", "secondary", "accent", "info", "success", "warning", "error", "ghost"],
      description: "DaisyUI color variant",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "DaisyUI size variant",
    },
    disabled: {
      control: "boolean",
      description: "Whether the date range picker is disabled",
    },
    required: {
      control: "boolean",
      description: "Whether the date range picker is required",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text when no date range is selected",
    },
  },
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Pick a date range",
    variant: "primary",
    size: "md",
  },
};

export const WithValue: Story = {
  args: {
    value: {
      from: new Date("2024-12-20"),
      to: new Date("2024-12-25"),
    },
    placeholder: "Pick a date range",
    variant: "primary",
    size: "md",
  },
};

export const PartialRange: Story = {
  args: {
    value: {
      from: new Date("2024-12-20"),
      to: undefined,
    },
    placeholder: "Pick a date range",
    variant: "primary",
    size: "md",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Pick a date range",
    variant: "neutral",
    size: "md",
    disabled: true,
  },
};

export const Required: Story = {
  args: {
    placeholder: "Pick a date range",
    variant: "primary",
    size: "md",
    required: true,
  },
};

export const Interactive: Story = {
  render: function Render(args) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    return (
      <div className="space-y-4">
        <DateRangePicker {...args} value={dateRange} onChange={setDateRange} />
        <div className="text-sm text-base-content/70">
          Selected range: {dateRange?.from ? dateRange.from.toLocaleDateString() : "None"}
          {dateRange?.to && ` - ${dateRange.to.toLocaleDateString()}`}
        </div>
      </div>
    );
  },
  args: {
    placeholder: "Pick a date range",
    variant: "primary",
    size: "md",
  },
};

export const WithForm: Story = {
  render: function Render(args) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const rangeText = dateRange?.from
        ? `${dateRange.from.toLocaleDateString()}${dateRange.to ? ` - ${dateRange.to.toLocaleDateString()}` : ""}`
        : "None";
      alert(`Form submitted with date range: ${rangeText}`);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="date-range-picker" className="label">
            <span className="label-text">Select a date range</span>
          </label>
          <DateRangePicker
            {...args}
            id="date-range-picker"
            name="dateRange"
            value={dateRange}
            onChange={setDateRange}
            aria-label="Select a date range"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Submit Form
        </button>
      </form>
    );
  },
  args: {
    placeholder: "Pick a date range",
    variant: "primary",
    size: "md",
    required: true,
  },
};
