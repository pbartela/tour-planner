import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sparkles, CheckCircle, XCircle } from "lucide-react";

import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["neutral", "primary", "secondary", "accent", "info", "success", "warning", "error", "ghost"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    outline: {
      control: "boolean",
    },
    animated: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

// All color variants
export const Colors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="accent">Accent</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="ghost">Ghost</Badge>
    </div>
  ),
};

// Outline variants
export const Outline: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="primary" outline>
        Primary
      </Badge>
      <Badge variant="success" outline>
        Success
      </Badge>
      <Badge variant="warning" outline>
        Warning
      </Badge>
      <Badge variant="error" outline>
        Error
      </Badge>
    </div>
  ),
};

// Different sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="primary" size="sm">
        Small
      </Badge>
      <Badge variant="primary" size="md">
        Medium
      </Badge>
      <Badge variant="primary" size="lg">
        Large
      </Badge>
    </div>
  ),
};

// With icons (text + icon and icon only)
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success">
        <CheckCircle className="h-3 w-3" />
        Success
      </Badge>
      <Badge variant="error">
        <XCircle className="h-3 w-3" />
        Error
      </Badge>
      <Badge variant="primary">
        <Sparkles className="h-3 w-3" />
      </Badge>
    </div>
  ),
};

// Animated badges
export const Animated: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="primary" animated>
        <Sparkles className="h-3 w-3" />
        New Activity
      </Badge>
      <Badge variant="success" animated>
        Live
      </Badge>
    </div>
  ),
};
