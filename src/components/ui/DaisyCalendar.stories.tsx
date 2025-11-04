import type { Meta, StoryObj } from "@storybook/react-vite";
import { DaisyCalendar } from "./DaisyCalendar";
import { useState } from "react";

const meta = {
  title: "Components/UI/DaisyCalendar",
  component: DaisyCalendar,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "bordered", "dashed"],
      description: "DaisyUI card variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
      description: "DaisyUI card size",
    },
    buttonVariant: {
      control: "select",
      options: ["neutral", "primary", "secondary", "accent", "info", "success", "warning", "error", "ghost"],
      description: "Button variant for navigation",
    },
    showOutsideDays: {
      control: "boolean",
      description: "Whether to show days outside the current month",
    },
    captionLayout: {
      control: "select",
      options: ["label", "dropdown"],
      description: "Layout for the month/year caption",
    },
  },
} satisfies Meta<typeof DaisyCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "default",
    size: "md",
    buttonVariant: "ghost",
    showOutsideDays: true,
    captionLayout: "label",
  },
};

export const WithSelectedDate: Story = {
  args: {
    variant: "default",
    size: "md",
    buttonVariant: "ghost",
    showOutsideDays: true,
    captionLayout: "label",
    selected: new Date("2024-12-25"),
  },
};

export const WithDateRange: Story = {
  args: {
    variant: "default",
    size: "md",
    buttonVariant: "ghost",
    showOutsideDays: true,
    captionLayout: "label",
    mode: "range",
    selected: {
      from: new Date("2024-12-20"),
      to: new Date("2024-12-25"),
    },
  },
};

export const Interactive: Story = {
  render: function Render(args) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    return (
      <div className="space-y-4">
        <DaisyCalendar {...args} selected={selectedDate} onSelect={setSelectedDate} />
        <div className="text-sm text-base-content/70">
          Selected date: {selectedDate ? selectedDate.toLocaleDateString() : "None"}
        </div>
      </div>
    );
  },
  args: {
    variant: "default",
    size: "md",
    buttonVariant: "primary",
    showOutsideDays: true,
    captionLayout: "label",
  },
};

export const InteractiveRange: Story = {
  render: function Render(args) {
    const [selectedRange, setSelectedRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined);

    return (
      <div className="space-y-4">
        <DaisyCalendar {...args} mode="range" selected={selectedRange} onSelect={setSelectedRange} />
        <div className="text-sm text-base-content/70">
          Selected range: {selectedRange?.from ? selectedRange.from.toLocaleDateString() : "None"}
          {selectedRange?.to && ` - ${selectedRange.to.toLocaleDateString()}`}
        </div>
      </div>
    );
  },
  args: {
    variant: "bordered",
    size: "md",
    buttonVariant: "primary",
    showOutsideDays: true,
    captionLayout: "label",
  },
};

export const MultipleMonths: Story = {
  args: {
    variant: "default",
    size: "md",
    buttonVariant: "ghost",
    showOutsideDays: true,
    captionLayout: "label",
    numberOfMonths: 2,
  },
};

export const WithDisabledDates: Story = {
  args: {
    variant: "default",
    size: "md",
    buttonVariant: "ghost",
    showOutsideDays: true,
    captionLayout: "label",
    disabled: (date) => {
      // Disable weekends
      return date.getDay() === 0 || date.getDay() === 6;
    },
  },
};
