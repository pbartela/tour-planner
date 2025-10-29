import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        // Default shadcn variants
        "default",
        "destructive",

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
        "neutral-outline",
        "primary-outline",
        "secondary-outline",
        "accent-outline",
        "info-outline",
        "success-outline",
        "warning-outline",
        "error-outline",

        "neutral-dash",
        "primary-dash",
        "secondary-dash",
        "accent-dash",
        "info-dash",
        "success-dash",
        "warning-dash",
        "error-dash",

        "neutral-soft",
        "primary-soft",
        "secondary-soft",
        "accent-soft",
        "info-soft",
        "success-soft",
        "warning-soft",
        "error-soft",

        // DaisyUI Special variants
        "ghost",
        "link",

        // Active states
        "neutral-active",
        "primary-active",
        "secondary-active",
        "accent-active",
        "info-active",
        "success-active",
        "warning-active",
        "error-active",
      ],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "default", "lg", "xl", "shadcn-default", "shadcn-lg"],
    },
    shape: {
      control: "select",
      options: ["default", "wide", "block", "square", "circle"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Basic variants
export const Default: Story = {
  args: {
    variant: "primary",
    children: "Default Button",
  },
};

// DaisyUI Color Variants
export const DaisyUIColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="neutral">Neutral</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="accent">Accent</Button>
      <Button variant="info">Info</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="error">Error</Button>
    </div>
  ),
};

// DaisyUI Style Variants
export const DaisyUIOutlines: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="neutral-outline">Neutral</Button>
      <Button variant="primary-outline">Primary</Button>
      <Button variant="secondary-outline">Secondary</Button>
      <Button variant="accent-outline">Accent</Button>
      <Button variant="info-outline">Info</Button>
      <Button variant="success-outline">Success</Button>
      <Button variant="warning-outline">Warning</Button>
      <Button variant="error-outline">Error</Button>
    </div>
  ),
};

export const DaisyUIDash: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="neutral-dash">Neutral</Button>
      <Button variant="primary-dash">Primary</Button>
      <Button variant="secondary-dash">Secondary</Button>
      <Button variant="accent-dash">Accent</Button>
    </div>
  ),
};

export const DaisyUISoft: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="neutral-soft">Neutral</Button>
      <Button variant="primary-soft">Primary</Button>
      <Button variant="secondary-soft">Secondary</Button>
      <Button variant="accent-soft">Accent</Button>
    </div>
  ),
};

// DaisyUI Special Variants
export const DaisyUISpecial: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

// DaisyUI Sizes
export const DaisyUISizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary" size="xs">
        XS
      </Button>
      <Button variant="primary" size="sm">
        SM
      </Button>
      <Button variant="primary" size="default">
        Default
      </Button>
      <Button variant="primary" size="lg">
        LG
      </Button>
      <Button variant="primary" size="xl">
        XL
      </Button>
    </div>
  ),
};

// DaisyUI Shapes
export const DaisyUIShapes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary">Default</Button>
      <Button variant="primary" shape="wide">
        Wide
      </Button>
      <Button variant="primary" shape="square">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </Button>
      <Button variant="primary" shape="circle">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Button>
    </div>
  ),
};

// Active States
export const DaisyUIActive: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="primary-active">Active Primary</Button>
      <Button variant="success-active">Active Success</Button>
      <Button variant="warning-active">Active Warning</Button>
      <Button variant="error-active">Active Error</Button>
    </div>
  ),
};

// Block Button
export const DaisyUIBlock: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-2">
      <Button variant="primary" shape="block">
        Block Button
      </Button>
      <Button variant="secondary-outline" shape="block">
        Block Outline
      </Button>
    </div>
  ),
};
