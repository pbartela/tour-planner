import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ParticipantSummaryDto } from "@/types";

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
    anonymousLabel: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof AvatarGroup>;

const sampleParticipants: ParticipantSummaryDto[] = [
  {
    user_id: "1",
    display_name: "John Doe",
    avatar_url: "https://i.pravatar.cc/150?img=1",
    email: "john@example.com",
  },
  {
    user_id: "2",
    display_name: "Jane Smith",
    avatar_url: "https://i.pravatar.cc/150?img=2",
    email: "jane@example.com",
  },
  {
    user_id: "3",
    display_name: null,
    avatar_url: null,
    email: "bob@example.com",
  },
  {
    user_id: "4",
    display_name: "Alice Johnson",
    avatar_url: "https://i.pravatar.cc/150?img=4",
    email: "alice@example.com",
  },
  {
    user_id: "5",
    display_name: null,
    avatar_url: "https://i.pravatar.cc/150?img=5",
    email: "charlie@example.com",
  },
  {
    user_id: "6",
    display_name: "David Brown",
    avatar_url: null,
    email: "david@example.com",
  },
  {
    user_id: "7",
    display_name: "Emma Wilson",
    avatar_url: "https://i.pravatar.cc/150?img=7",
    email: "emma@example.com",
  },
  {
    user_id: "8",
    display_name: null,
    avatar_url: null,
    email: "frank@example.com",
  },
];

// With overflow indicator (+N more)
export const WithOverflow: Story = {
  args: {
    participants: sampleParticipants,
    maxVisible: 3,
  },
};

// Different sizes
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <AvatarGroup participants={sampleParticipants} maxVisible={4} size="sm" />
      <AvatarGroup participants={sampleParticipants} maxVisible={4} size="md" />
      <AvatarGroup participants={sampleParticipants} maxVisible={4} size="lg" />
    </div>
  ),
};

// Shows mix of avatars and initials
export const MixedAvatarsAndInitials: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-base-content/60">
        Demonstrates participants with avatars, without avatars (initials from display_name), and without display_name
        (initials from email)
      </p>
      <AvatarGroup participants={sampleParticipants} maxVisible={6} />
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
          <AvatarGroup participants={sampleParticipants} maxVisible={5} />
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
        <AvatarGroup participants={sampleParticipants.slice(0, 3)} />
        <ActivityIndicator hasActivity={true} label="New activity" />
      </div>
    );
  },
};
