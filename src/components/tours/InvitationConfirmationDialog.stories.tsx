import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InvitationConfirmationDialog } from "./InvitationConfirmationDialog";
import { EmailValidationError } from "@/lib/utils/email-parser.util";

const meta: Meta<typeof InvitationConfirmationDialog> = {
  title: "Tours/InvitationConfirmationDialog",
  component: InvitationConfirmationDialog,
  tags: ["autodocs"],
  argTypes: {
    isPending: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof InvitationConfirmationDialog>;

// All valid emails - happy path
export const AllValid: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Show Dialog (All Valid)
        </Button>
        <InvitationConfirmationDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            // eslint-disable-next-line no-console
            console.log("Sending invitations...");
            setIsOpen(false);
          }}
          validEmails={["user1@example.com", "user2@example.com", "user3@example.com"]}
          invalidEmails={[]}
          duplicates={[]}
        />
      </>
    );
  },
};

// With invalid emails
export const WithInvalid: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Show Dialog (With Invalid)
        </Button>
        <InvitationConfirmationDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            // eslint-disable-next-line no-console
            console.log("Sending invitations...");
            setIsOpen(false);
          }}
          validEmails={["user1@example.com", "user2@example.com"]}
          invalidEmails={[
            { email: "r@.pl", error: EmailValidationError.INVALID_DOMAIN },
            { email: "not-an-email", error: EmailValidationError.INVALID_FORMAT },
          ]}
          duplicates={[]}
        />
      </>
    );
  },
};

// With duplicates
export const WithDuplicates: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Show Dialog (With Duplicates)
        </Button>
        <InvitationConfirmationDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            // eslint-disable-next-line no-console
            console.log("Sending invitations...");
            setIsOpen(false);
          }}
          validEmails={["user1@example.com", "user2@example.com"]}
          invalidEmails={[]}
          duplicates={["User1@Example.com", "user2@EXAMPLE.COM"]}
        />
      </>
    );
  },
};

// All invalid emails - button should be disabled
export const AllInvalid: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Show Dialog (All Invalid)
        </Button>
        <InvitationConfirmationDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            // This should not be called
            // eslint-disable-next-line no-console
            console.log("This should not happen!");
          }}
          validEmails={[]}
          invalidEmails={[
            { email: "r@.pl", error: EmailValidationError.INVALID_DOMAIN },
            { email: "invalid", error: EmailValidationError.INVALID_FORMAT },
            { email: "user@.com", error: EmailValidationError.INVALID_DOMAIN },
          ]}
          duplicates={[]}
        />
      </>
    );
  },
};

// Mixed issues - valid, invalid, and duplicates
export const MixedIssues: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Show Dialog (Mixed Issues)
        </Button>
        <InvitationConfirmationDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            // eslint-disable-next-line no-console
            console.log("Sending invitations to valid emails...");
            setIsOpen(false);
          }}
          validEmails={["user1@example.com", "user2@example.com", "user3@example.com"]}
          invalidEmails={[
            { email: "r@.pl", error: EmailValidationError.INVALID_DOMAIN },
            { email: "notvalid", error: EmailValidationError.INVALID_FORMAT },
          ]}
          duplicates={["User1@Example.COM", "USER2@example.com"]}
        />
      </>
    );
  },
};

// Long list of emails - tests scrolling
export const LongList: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    // Generate 25 valid emails
    const validEmails = Array.from({ length: 25 }, (_, i) => `user${i + 1}@example.com`);

    return (
      <>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Show Dialog (Long List)
        </Button>
        <InvitationConfirmationDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            // eslint-disable-next-line no-console
            console.log("Sending invitations to 25 users...");
            setIsOpen(false);
          }}
          validEmails={validEmails}
          invalidEmails={[]}
          duplicates={[]}
        />
      </>
    );
  },
};

// Pending state - loading
export const Pending: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const handleConfirm = () => {
      setIsPending(true);
      // Simulate async operation
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.log("Invitations sent!");
        setIsPending(false);
        setIsOpen(false);
      }, 2000);
    };

    return (
      <>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Show Dialog (With Loading)
        </Button>
        <InvitationConfirmationDialog
          isOpen={isOpen}
          onClose={() => !isPending && setIsOpen(false)}
          onConfirm={handleConfirm}
          validEmails={["user1@example.com", "user2@example.com", "user3@example.com"]}
          invalidEmails={[]}
          duplicates={[]}
          isPending={isPending}
        />
      </>
    );
  },
};
