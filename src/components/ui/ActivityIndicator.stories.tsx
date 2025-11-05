import type { Meta, StoryObj } from "@storybook/react-vite";

import { ActivityIndicator } from "./ActivityIndicator";

const meta: Meta<typeof ActivityIndicator> = {
  title: "UI/ActivityIndicator",
  component: ActivityIndicator,
  tags: ["autodocs"],
  argTypes: {
    hasActivity: {
      control: "boolean",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    label: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ActivityIndicator>;

// Different sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <ActivityIndicator hasActivity={true} size="sm" label="Small" />
      <ActivityIndicator hasActivity={true} size="md" label="Medium" />
      <ActivityIndicator hasActivity={true} size="lg" label="Large" />
    </div>
  ),
};

// In context with avatars (like in TourCard)
export const InContext: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-3">
        <img
          src="https://i.pravatar.cc/150?img=1"
          alt="Participant 1"
          className="h-9 w-9 rounded-full border-2 border-base-100 dark:border-base-300 object-cover"
        />
        <img
          src="https://i.pravatar.cc/150?img=2"
          alt="Participant 2"
          className="h-9 w-9 rounded-full border-2 border-base-100 dark:border-base-300 object-cover"
        />
        <img
          src="https://i.pravatar.cc/150?img=3"
          alt="Participant 3"
          className="h-9 w-9 rounded-full border-2 border-base-100 dark:border-base-300 object-cover"
        />
      </div>
      <ActivityIndicator hasActivity={true} label="New comments" />
    </div>
  ),
};
