import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "./button";

import { ConfirmationDialog } from "./ConfirmationDialog";

const meta: Meta<typeof ConfirmationDialog> = {
  title: "UI/ConfirmationDialog",
  component: ConfirmationDialog,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["error", "warning", "info"],
    },
    isPending: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmationDialog>;

// Delete confirmation (error variant)
export const DeleteConfirmation: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="error" onClick={() => setIsOpen(true)}>
          Delete Item
        </Button>
        <ConfirmationDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            console.log("Deleted!");
            setIsOpen(false);
          }}
          title="Delete Confirmation"
          message="This action cannot be undone. Are you sure you want to delete this item?"
          confirmText="Delete"
          cancelText="Cancel"
          variant="error"
        />
      </>
    );
  },
};

// Warning variant
export const Warning: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="warning" onClick={() => setIsOpen(true)}>
          Proceed with Warning
        </Button>
        <ConfirmationDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            console.log("Proceeding...");
            setIsOpen(false);
          }}
          title="Warning"
          message="This action may have unintended consequences. Please review before proceeding."
          confirmText="Proceed Anyway"
          cancelText="Go Back"
          variant="warning"
        />
      </>
    );
  },
};

// With text confirmation (like delete tour)
export const WithTextConfirmation: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const tourTitle = "Summer Trip to Italy";

    return (
      <>
        <Button variant="error" onClick={() => setIsOpen(true)}>
          Delete Tour
        </Button>
        <ConfirmationDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            console.log("Tour deleted!");
            setIsOpen(false);
          }}
          title="Delete Tour"
          message="This will permanently delete the tour and all associated data. This action cannot be undone."
          confirmText="Delete Tour"
          cancelText="Cancel"
          variant="error"
          requireTextConfirmation={{
            expectedText: tourTitle,
            placeholder: tourTitle,
            prompt: "Type the tour title to confirm:",
          }}
        />
      </>
    );
  },
};

// Pending state
export const PendingState: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const handleConfirm = () => {
      setIsPending(true);
      // Simulate async operation
      setTimeout(() => {
        console.log("Operation completed!");
        setIsPending(false);
        setIsOpen(false);
      }, 2000);
    };

    return (
      <>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Trigger Action with Loading
        </Button>
        <ConfirmationDialog
          isOpen={isOpen}
          onClose={() => !isPending && setIsOpen(false)}
          onConfirm={handleConfirm}
          title="Process Data"
          message="This will process all the data. It may take a moment."
          confirmText="Process"
          cancelText="Cancel"
          variant="info"
          isPending={isPending}
          pendingText="Processing..."
        />
      </>
    );
  },
};

// Text confirmation with pending
export const TextConfirmationWithPending: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const itemName = "Important File";

    const handleConfirm = () => {
      setIsPending(true);
      setTimeout(() => {
        console.log("File deleted!");
        setIsPending(false);
        setIsOpen(false);
      }, 2000);
    };

    return (
      <>
        <Button variant="error" onClick={() => setIsOpen(true)}>
          Delete File
        </Button>
        <ConfirmationDialog
          isOpen={isOpen}
          onClose={() => !isPending && setIsOpen(false)}
          onConfirm={handleConfirm}
          title="Delete File"
          message="Are you absolutely sure? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="error"
          isPending={isPending}
          pendingText="Deleting..."
          requireTextConfirmation={{
            expectedText: itemName,
            placeholder: itemName,
            prompt: "Type the file name to confirm:",
          }}
        />
      </>
    );
  },
};
