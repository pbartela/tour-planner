import type { Meta, StoryObj } from "@storybook/react";
import { DatePicker } from "./DatePicker";
import { useState } from "react";

const meta = {
  title: "Components/UI/DatePicker",
  component: DatePicker,
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
      description: "Whether the date picker is disabled",
    },
    required: {
      control: "boolean",
      description: "Whether the date picker is required",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text when no date is selected",
    },
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Pick a date",
    variant: "primary",
    size: "md",
  },
};

export const WithValue: Story = {
  args: {
    value: new Date("2024-12-25"),
    placeholder: "Pick a date",
    variant: "primary",
    size: "md",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Pick a date",
    variant: "neutral",
    size: "md",
    disabled: true,
  },
};

export const Required: Story = {
  args: {
    placeholder: "Pick a date",
    variant: "primary",
    size: "md",
    required: true,
  },
};

export const Interactive: Story = {
  render: function Render(args) {
    const [date, setDate] = useState<Date | undefined>(undefined);
    
    return (
      <div className="space-y-4">
        <DatePicker
          {...args}
          value={date}
          onChange={setDate}
        />
        <div className="text-sm text-base-content/70">
          Selected date: {date ? date.toLocaleDateString() : "None"}
        </div>
      </div>
    );
  },
  args: {
    placeholder: "Pick a date",
    variant: "primary",
    size: "md",
  },
};

export const WithForm: Story = {
  render: function Render(args) {
    const [date, setDate] = useState<Date | undefined>(undefined);
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      alert(`Form submitted with date: ${date ? date.toLocaleDateString() : "None"}`);
    };
    
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="date-picker" className="label">
            <span className="label-text">Select a date</span>
          </label>
          <DatePicker
            {...args}
            id="date-picker"
            name="selectedDate"
            value={date}
            onChange={setDate}
            aria-label="Select a date"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Submit Form
        </button>
      </form>
    );
  },
  args: {
    placeholder: "Pick a date",
    variant: "primary",
    size: "md",
    required: true,
  },
};

