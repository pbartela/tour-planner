import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        // Default shadcn variant
        "default",

        // DaisyUI Color variants
        "neutral",
        "primary",
        "secondary",
        "accent",
        "info",
        "success",
        "warning",
        "error",

        // DaisyUI Style variants
        "ghost",
      ],
    },
    size: {
      control: "select",
      options: [
        "default",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        // Legacy shadcn sizes
        "shadcn-default",
        "shadcn-sm",
        "shadcn-lg",
      ],
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url", "search", "date", "time", "datetime-local"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

// Basic variants
export const Default: Story = {
  args: {
    variant: "default",
    placeholder: "Default input",
  },
};

// DaisyUI Color Variants
export const DaisyUIColors: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <Input variant="neutral" placeholder="Neutral input" />
      <Input variant="primary" placeholder="Primary input" />
      <Input variant="secondary" placeholder="Secondary input" />
      <Input variant="accent" placeholder="Accent input" />
      <Input variant="info" placeholder="Info input" />
      <Input variant="success" placeholder="Success input" />
      <Input variant="warning" placeholder="Warning input" />
      <Input variant="error" placeholder="Error input" />
    </div>
  ),
};

// DaisyUI Style Variants
export const DaisyUIGhost: Story = {
  render: () => (
    <div className="bg-base-200 p-4 rounded-lg">
      <Input variant="ghost" placeholder="Ghost input on gray background" />
    </div>
  ),
};

// DaisyUI Sizes
export const DaisyUISizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <Input variant="primary" size="xs" placeholder="Extra small" />
      <Input variant="primary" size="sm" placeholder="Small" />
      <Input variant="primary" size="md" placeholder="Medium (DaisyUI default)" />
      <Input variant="primary" size="lg" placeholder="Large" />
      <Input variant="primary" size="xl" placeholder="Extra large" />
    </div>
  ),
};

// Different Input Types
export const InputTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email input" />
      <Input type="password" placeholder="Password input" />
      <Input type="number" placeholder="Number input" />
      <Input type="tel" placeholder="Telephone input" />
      <Input type="url" placeholder="URL input" />
      <Input type="search" placeholder="Search input" />
      <Input type="date" />
      <Input type="time" />
      <Input type="datetime-local" />
    </div>
  ),
};

// Disabled State
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <Input variant="default" placeholder="Disabled default" disabled />
      <Input variant="primary" placeholder="Disabled primary" disabled />
      <Input variant="ghost" placeholder="Disabled ghost" disabled />
    </div>
  ),
};

// With Icons (using DaisyUI pattern)
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-full max-w-md">
      {/* Search input with icon */}
      <label className="input input-bordered flex items-center gap-2">
        <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </g>
        </svg>
        <Input variant="ghost" placeholder="Search..." className="grow" />
      </label>

      {/* Email input with icon */}
      <label className="input input-bordered flex items-center gap-2">
        <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor">
            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
          </g>
        </svg>
        <Input type="email" variant="ghost" placeholder="Email" className="grow" />
      </label>
    </div>
  ),
};

// Form Example
export const FormExample: Story = {
  render: () => (
    <form className="flex flex-col gap-4 w-full max-w-md">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Username</span>
        </label>
        <Input variant="primary" placeholder="Enter username" />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Email</span>
        </label>
        <Input type="email" variant="primary" placeholder="Enter email" />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Password</span>
        </label>
        <Input type="password" variant="primary" placeholder="Enter password" />
      </div>

      <button className="btn btn-primary" type="submit">
        Submit
      </button>
    </form>
  ),
};
