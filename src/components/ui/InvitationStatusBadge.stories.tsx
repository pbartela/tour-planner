import type { Meta, StoryObj } from "@storybook/react-vite";

import { InvitationStatusBadge } from "./InvitationStatusBadge";

const meta: Meta<typeof InvitationStatusBadge> = {
  title: "UI/InvitationStatusBadge",
  component: InvitationStatusBadge,
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ["pending", "accepted", "declined"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    expired: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof InvitationStatusBadge>;

// All status variants
export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <InvitationStatusBadge status="pending">Pending</InvitationStatusBadge>
      <InvitationStatusBadge status="accepted">Accepted</InvitationStatusBadge>
      <InvitationStatusBadge status="declined">Declined</InvitationStatusBadge>
    </div>
  ),
};

// Expired invitations
export const Expired: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <InvitationStatusBadge status="pending" expired>
        Expired
      </InvitationStatusBadge>
      <InvitationStatusBadge status="accepted" expired>
        Expired
      </InvitationStatusBadge>
    </div>
  ),
};

// Different sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <InvitationStatusBadge status="accepted" size="sm">
        Small
      </InvitationStatusBadge>
      <InvitationStatusBadge status="accepted" size="md">
        Medium
      </InvitationStatusBadge>
      <InvitationStatusBadge status="accepted" size="lg">
        Large
      </InvitationStatusBadge>
    </div>
  ),
};

// In context (like in InvitedUsersList)
export const InContext: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src="https://i.pravatar.cc/150?img=1" alt="User" />
            </div>
          </div>
          <div>
            <p className="font-medium">John Doe</p>
            <p className="text-xs text-base-content/60">john@example.com</p>
          </div>
        </div>
        <InvitationStatusBadge status="accepted">Accepted</InvitationStatusBadge>
      </div>

      <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src="https://i.pravatar.cc/150?img=2" alt="User" />
            </div>
          </div>
          <div>
            <p className="font-medium">Jane Smith</p>
            <p className="text-xs text-base-content/60">jane@example.com</p>
          </div>
        </div>
        <InvitationStatusBadge status="pending">Pending</InvitationStatusBadge>
      </div>

      <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src="https://i.pravatar.cc/150?img=3" alt="User" />
            </div>
          </div>
          <div>
            <p className="font-medium">Bob Johnson</p>
            <p className="text-xs text-base-content/60">bob@example.com</p>
          </div>
        </div>
        <InvitationStatusBadge status="declined">Declined</InvitationStatusBadge>
      </div>
    </div>
  ),
};
