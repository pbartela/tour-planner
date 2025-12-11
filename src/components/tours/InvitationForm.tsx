import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useSendInvitationsMutation } from "@/lib/hooks/useInvitationMutations";
import { parseEmails, type EmailParseResult } from "@/lib/utils/email-parser.util";
import { InvitationConfirmationDialog } from "./InvitationConfirmationDialog";
import { STORAGE_KEYS } from "@/lib/constants/storage";
import { EMAIL_VALIDATION } from "@/lib/constants/validation";
import { getStorageItem, setStorageItem } from "@/lib/client/storage";
import { notifyStorageError } from "@/lib/client/storage-notifications";

interface InvitationFormProps {
  tourId: string;
  onSuccess?: () => void;
}

/**
 * Component for sending invitations to a tour.
 * Allows owner to invite multiple users by entering email addresses.
 */
export const InvitationForm = ({ tourId, onSuccess }: InvitationFormProps) => {
  const { t } = useTranslation("tours");
  const [emailInput, setEmailInput] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmBeforeSend, setConfirmBeforeSend] = useState(true);
  const [parsedResult, setParsedResult] = useState<EmailParseResult | null>(null);
  const sendMutation = useSendInvitationsMutation(tourId);

  // Load confirmation preference from localStorage
  useEffect(() => {
    const result = getStorageItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION);
    // Only disable confirmation if explicitly set to true (meaning skip was enabled)
    if (result.success && result.value === true) {
      setConfirmBeforeSend(false);
    }
  }, []);

  // Save confirmation preference
  const handleConfirmBeforeSendChange = (checked: boolean) => {
    setConfirmBeforeSend(checked);
    // Store the inverse (skipConfirmation = !confirmBeforeSend) for backwards compatibility
    const result = setStorageItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION, !checked);
    if (!result.success && result.error) {
      notifyStorageError(result.error, "invitation settings");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailInput.trim()) {
      toast.error(t("invitations.noEmails"));
      return;
    }

    // Parse emails using new utility
    const result = parseEmails(emailInput);
    setParsedResult(result);

    // Check for input validation errors
    if (result.inputError) {
      toast.error(result.inputError);
      return;
    }

    // Check if there are any valid emails
    if (result.valid.length === 0) {
      toast.error(t("invitations.noValidEmails"));
      return;
    }

    // Check server limit
    if (result.valid.length > EMAIL_VALIDATION.MAX_EMAILS_PER_INVITATION) {
      toast.error(t("invitations.tooManyEmails", { max: EMAIL_VALIDATION.MAX_EMAILS_PER_INVITATION }));
      return;
    }

    // Show confirmation dialog or send immediately based on checkbox
    if (confirmBeforeSend) {
      setShowConfirmation(true);
    } else {
      // Show warning toast for invalid emails if any
      if (result.invalid.length > 0) {
        toast.error(
          t("invitations.invalidEmailsSkipped", {
            count: result.invalid.length,
            emails: result.invalid.map((i) => i.email).join(", "),
          })
        );
      }
      await sendInvitations(result.valid);
    }
  };

  const sendInvitations = async (emails: string[]) => {
    try {
      const result = await sendMutation.mutateAsync({ emails });

      // Show success message with details
      if (result.sent.length > 0) {
        toast.success(
          t("invitations.sentSuccess", {
            count: result.sent.length,
            emails: result.sent.join(", "),
          })
        );
      }

      if (result.skipped.length > 0) {
        toast(
          t("invitations.skippedMessage", {
            count: result.skipped.length,
            emails: result.skipped.join(", "),
          }),
          {
            icon: "ℹ️",
            duration: 5000,
          }
        );
      }

      if (result.errors.length > 0) {
        toast.error(
          t("invitations.errorsMessage", {
            count: result.errors.length,
          })
        );
      }

      // Clear form and close dialog
      setEmailInput("");
      setShowConfirmation(false);
      setParsedResult(null);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("invitations.sendError");
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="invitation-emails" className="label">
            <span className="label-text">{t("invitations.emailLabel")}</span>
          </label>
          <textarea
            id="invitation-emails"
            className="textarea textarea-bordered w-full"
            placeholder={t("invitations.emailPlaceholder")}
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            rows={3}
            disabled={sendMutation.isPending}
            required
          />
          <label className="label">
            <span className="label-text-alt">{t("invitations.emailHint")}</span>
          </label>
        </div>

        {/* Confirm before sending checkbox */}
        <label className="label cursor-pointer justify-start gap-3">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={confirmBeforeSend}
            onChange={(e) => handleConfirmBeforeSendChange(e.target.checked)}
            disabled={sendMutation.isPending}
          />
          <span className="label-text">{t("invitations.confirmBeforeSend")}</span>
        </label>

        <Button type="submit" disabled={sendMutation.isPending || !emailInput.trim()}>
          {sendMutation.isPending ? t("invitations.sending") : t("invitations.sendButton")}
        </Button>
      </form>

      {/* Confirmation Dialog */}
      {parsedResult && (
        <InvitationConfirmationDialog
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={() => sendInvitations(parsedResult.valid)}
          validEmails={parsedResult.valid}
          invalidEmails={parsedResult.invalid}
          duplicates={parsedResult.duplicates}
          isPending={sendMutation.isPending}
        />
      )}
    </>
  );
};
