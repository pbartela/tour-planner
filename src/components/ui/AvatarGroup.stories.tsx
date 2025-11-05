import type { Meta, StoryObj } from "@storybook/react-vite";

import { AvatarGroup } from "./AvatarGroup";

const meta: Meta<typeof AvatarGroup> = {
  title: "UI/AvatarGroup",
  component: AvatarGroup,
  tags: ["autodocs"],
  argTypes: {
    maxVisible: {
      control: "number",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    altPrefix: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof AvatarGroup>;

const sampleAvatars = [
  "https://i.pravatar.cc/150?img=1",
  "https://i.pravatar.cc/150?img=2",
  "https://i.pravatar.cc/150?img=3",
  "https://i.pravatar.cc/150?img=4",
  "https://i.pravatar.cc/150?img=5",
  "https://i.pravatar.cc/150?img=6",
  "https://i.pravatar.cc/150?img=7",
  "https://i.pravatar.cc/150?img=8",
];

// With overflow indicator (+N more)
export const WithOverflow: Story = {
  args: {
    avatars: sampleAvatars,
    maxVisible: 3,
  },
};

// Different sizes
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <AvatarGroup avatars={sampleAvatars} maxVisible={4} size="sm" />
      <AvatarGroup avatars={sampleAvatars} maxVisible={4} size="md" />
      <AvatarGroup avatars={sampleAvatars} maxVisible={4} size="lg" />
    </div>
  ),
};

// In context (like in TourCard)
export const InTourCard: Story = {
  render: () => (
    <div className="card bg-base-100 shadow-xl w-80">
      <figure>
        <img src="https://picsum.photos/400/300" alt="Tour destination" />
      </figure>
      <div className="card-body">
        <h2 className="card-title">Summer Trip to Italy</h2>
        <p className="text-sm text-base-content/60">June 15 - June 30, 2024</p>
        <div className="mt-4">
          <AvatarGroup avatars={sampleAvatars} maxVisible={5} />
        </div>
      </div>
    </div>
  ),
};

// With activity indicator
export const WithActivityIndicator: Story = {
  render: () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ActivityIndicator } = require("./ActivityIndicator");
    return (
      <div className="flex items-center gap-2">
        <AvatarGroup avatars={sampleAvatars.slice(0, 3)} />
        <ActivityIndicator hasActivity={true} label="New activity" />
      </div>
    );
  },
};
