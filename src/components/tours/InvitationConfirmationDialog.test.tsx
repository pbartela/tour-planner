import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InvitationConfirmationDialog } from "./InvitationConfirmationDialog";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Simple mock that returns the key
  }),
}));

describe("InvitationConfirmationDialog", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    validEmails: ["user1@example.com", "user2@example.com"],
    invalidEmails: [{ email: "invalid@.com", error: "Invalid domain" }],
    duplicates: ["dup@example.com"],
    isPending: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should not render when isOpen is false", () => {
      render(<InvitationConfirmationDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByText("invitations.confirmDialog.title")).not.toBeInTheDocument();
    });

    it("should render dialog when isOpen is true", () => {
      render(<InvitationConfirmationDialog {...defaultProps} />);
      expect(screen.getByText("invitations.confirmDialog.title")).toBeInTheDocument();
      expect(screen.getByText("invitations.confirmDialog.description")).toBeInTheDocument();
    });

    it("should display correct badge counts for valid/invalid/duplicate emails", () => {
      render(<InvitationConfirmationDialog {...defaultProps} />);

      // Check for valid emails badge
      expect(screen.getByText("2")).toBeInTheDocument(); // valid count
      // Check that sections with count 1 exist (invalid and duplicates)
      const badges = screen.getAllByText("1");
      expect(badges.length).toBeGreaterThanOrEqual(2); // invalid and duplicate badges
    });
  });

  describe("Email Display", () => {
    it("should display valid emails section when validEmails array is not empty", () => {
      render(<InvitationConfirmationDialog {...defaultProps} />);

      expect(screen.getByText("invitations.confirmDialog.validEmailsTitle")).toBeInTheDocument();
      expect(screen.getByText("user1@example.com")).toBeInTheDocument();
      expect(screen.getByText("user2@example.com")).toBeInTheDocument();
    });

    it("should display invalid emails section with error messages", () => {
      render(<InvitationConfirmationDialog {...defaultProps} />);

      expect(screen.getByText("invitations.confirmDialog.invalidEmailsTitle")).toBeInTheDocument();
      expect(screen.getByText("invalid@.com")).toBeInTheDocument();
      // Error is displayed but via t() function which returns the key in tests
      expect(screen.getByText(/Invalid domain/)).toBeInTheDocument();
    });

    it("should display duplicates section", () => {
      render(<InvitationConfirmationDialog {...defaultProps} />);

      expect(screen.getByText("invitations.confirmDialog.duplicatesTitle")).toBeInTheDocument();
      expect(screen.getByText("dup@example.com")).toBeInTheDocument();
      expect(screen.getByText("invitations.confirmDialog.duplicatesNote")).toBeInTheDocument();
    });

    it("should hide sections when their respective arrays are empty", () => {
      render(
        <InvitationConfirmationDialog
          {...defaultProps}
          validEmails={[]}
          invalidEmails={[]}
          duplicates={[]}
        />
      );

      expect(screen.queryByText("invitations.confirmDialog.validEmailsTitle")).not.toBeInTheDocument();
      expect(screen.queryByText("invitations.confirmDialog.invalidEmailsTitle")).not.toBeInTheDocument();
      expect(screen.queryByText("invitations.confirmDialog.duplicatesTitle")).not.toBeInTheDocument();
    });

    it("should display long email lists with scrolling", () => {
      const manyEmails = Array.from({ length: 25 }, (_, i) => `user${i}@example.com`);
      render(<InvitationConfirmationDialog {...defaultProps} validEmails={manyEmails} />);

      // Check that first and last emails are rendered
      expect(screen.getByText("user0@example.com")).toBeInTheDocument();
      expect(screen.getByText("user24@example.com")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("should call onClose when cancel button is clicked", () => {
      const onClose = vi.fn();
      render(<InvitationConfirmationDialog {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText("common.cancel");
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should call onConfirm when send button is clicked", () => {
      const onConfirm = vi.fn();
      render(<InvitationConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);

      // Find button with the send text (includes count)
      const sendButton = screen.getByRole("button", { name: /invitations\.confirmDialog\.sendButton/i });
      fireEvent.click(sendButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("should disable buttons when isPending is true", () => {
      render(<InvitationConfirmationDialog {...defaultProps} isPending={true} />);

      // Get all buttons and check that the primary action buttons are disabled
      const buttons = screen.getAllByRole("button");
      const sendButton = buttons.find((btn) => !btn.classList.contains("btn-ghost"));
      const cancelButton = screen.getByText("common.cancel");

      expect(sendButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it("should disable send button when no valid emails", () => {
      render(<InvitationConfirmationDialog {...defaultProps} validEmails={[]} />);

      const sendButton = screen.getByRole("button", { name: /invitations\.confirmDialog\.sendButton/i });
      expect(sendButton).toBeDisabled();
    });
  });

  describe("Conditional Logic", () => {
    it("should show 'with issues' text when hasIssues is true", () => {
      render(<InvitationConfirmationDialog {...defaultProps} />);

      // Should show summary with issues mentioned
      expect(screen.getByText(/invitations\.confirmDialog\.summary/)).toBeInTheDocument();
    });

    it("should show 'no valid emails' message when canProceed is false", () => {
      render(
        <InvitationConfirmationDialog
          {...defaultProps}
          validEmails={[]}
        />
      );

      expect(screen.getByText("invitations.confirmDialog.noValidEmails")).toBeInTheDocument();
    });

    it("should enable send button when validEmails.length > 0", () => {
      render(<InvitationConfirmationDialog {...defaultProps} validEmails={["test@example.com"]} />);

      const sendButton = screen.getByRole("button", { name: /invitations\.confirmDialog\.sendButton/i });
      expect(sendButton).not.toBeDisabled();
    });

    it("should show 'with issues' summary when invalidEmails exist", () => {
      render(
        <InvitationConfirmationDialog
          {...defaultProps}
          invalidEmails={[{ email: "bad@email", error: "Invalid format" }]}
        />
      );

      // Check that summary text is displayed
      expect(screen.getByText(/invitations\.confirmDialog\.summary/)).toBeInTheDocument();
    });

    it("should show 'with issues' summary when duplicates exist", () => {
      render(
        <InvitationConfirmationDialog
          {...defaultProps}
          invalidEmails={[]}
          duplicates={["dup@example.com"]}
        />
      );

      // Check that summary text is displayed
      expect(screen.getByText(/invitations\.confirmDialog\.summary/)).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty arrays for all email types", () => {
      render(
        <InvitationConfirmationDialog
          {...defaultProps}
          validEmails={[]}
          invalidEmails={[]}
          duplicates={[]}
        />
      );

      expect(screen.getByText("invitations.confirmDialog.noValidEmails")).toBeInTheDocument();
    });

    it("should handle very long email lists (50 emails)", () => {
      const fiftyEmails = Array.from({ length: 50 }, (_, i) => `user${i}@example.com`);
      render(<InvitationConfirmationDialog {...defaultProps} validEmails={fiftyEmails} />);

      // Check first and last
      expect(screen.getByText("user0@example.com")).toBeInTheDocument();
      expect(screen.getByText("user49@example.com")).toBeInTheDocument();
    });

    it("should handle emails with special characters", () => {
      render(
        <InvitationConfirmationDialog
          {...defaultProps}
          validEmails={["user+test@example.com", "user.name@sub.domain.com"]}
        />
      );

      expect(screen.getByText("user+test@example.com")).toBeInTheDocument();
      expect(screen.getByText("user.name@sub.domain.com")).toBeInTheDocument();
    });

    it("should handle invalid email with missing error property", () => {
      render(
        <InvitationConfirmationDialog
          {...defaultProps}
          invalidEmails={[{ email: "bad@email" }]} // No error property
        />
      );

      expect(screen.getByText("bad@email")).toBeInTheDocument();
    });

    it("should handle single valid email", () => {
      render(
        <InvitationConfirmationDialog
          {...defaultProps}
          validEmails={["single@example.com"]}
          invalidEmails={[]}
          duplicates={[]}
        />
      );

      expect(screen.getByText("single@example.com")).toBeInTheDocument();
      const sendButton = screen.getByRole("button", { name: /invitations\.confirmDialog\.sendButton/i });
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe("Error Types", () => {
    it("should display 'Invalid format' error", () => {
      render(
        <InvitationConfirmationDialog
          {...defaultProps}
          invalidEmails={[{ email: "notanemail", error: "Invalid format" }]}
        />
      );

      expect(screen.getByText("notanemail")).toBeInTheDocument();
      expect(screen.getByText(/Invalid format/)).toBeInTheDocument();
    });

    it("should display 'Invalid domain' error", () => {
      render(
        <InvitationConfirmationDialog
          {...defaultProps}
          invalidEmails={[{ email: "user@.com", error: "Invalid domain" }]}
        />
      );

      expect(screen.getByText("user@.com")).toBeInTheDocument();
      expect(screen.getByText(/Invalid domain/)).toBeInTheDocument();
    });

    it("should display 'Invalid email format' error", () => {
      render(
        <InvitationConfirmationDialog
          {...defaultProps}
          invalidEmails={[{ email: "bad@email", error: "Invalid email format" }]}
        />
      );

      expect(screen.getByText("bad@email")).toBeInTheDocument();
      expect(screen.getByText(/Invalid email format/)).toBeInTheDocument();
    });

    it("should display 'Invalid TLD' error", () => {
      render(
        <InvitationConfirmationDialog
          {...defaultProps}
          invalidEmails={[{ email: "user@domain.fake", error: "Invalid TLD" }]}
        />
      );

      expect(screen.getByText("user@domain.fake")).toBeInTheDocument();
      expect(screen.getByText(/Invalid TLD/)).toBeInTheDocument();
    });

    it("should handle multiple different error types", () => {
      render(
        <InvitationConfirmationDialog
          {...defaultProps}
          invalidEmails={[
            { email: "bad1", error: "Invalid format" },
            { email: "bad2@.com", error: "Invalid domain" },
            { email: "bad3@test.fake", error: "Invalid TLD" },
          ]}
        />
      );

      expect(screen.getByText("bad1")).toBeInTheDocument();
      expect(screen.getByText("bad2@.com")).toBeInTheDocument();
      expect(screen.getByText("bad3@test.fake")).toBeInTheDocument();
      expect(screen.getByText(/Invalid format/)).toBeInTheDocument();
      expect(screen.getByText(/Invalid domain/)).toBeInTheDocument();
      expect(screen.getByText(/Invalid TLD/)).toBeInTheDocument();
    });
  });
});
