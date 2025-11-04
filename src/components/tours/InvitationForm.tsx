import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useSendInvitationsMutation } from "@/lib/hooks/useInvitationMutations";

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
  const sendMutation = useSendInvitationsMutation(tourId);

  const parseEmails = (input: string): string[] => {
    // Split by comma or newline, trim, filter empty, and normalize
    return input
      .split(/[,\n]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0)
      .map((email) => email.toLowerCase());
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emails = parseEmails(emailInput);
    if (emails.length === 0) {
      toast.error(t("invitations.noEmails"));
      return;
    }

    // Validate all emails
    const invalidEmails = emails.filter((email) => !validateEmail(email));
    if (invalidEmails.length > 0) {
      toast.error(t("invitations.invalidEmails", { emails: invalidEmails.join(", ") }));
      return;
    }

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

      // Clear form on success
      setEmailInput("");
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("invitations.sendError");
      toast.error(errorMessage);
    }
  };

  return (
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
      <Button type="submit" disabled={sendMutation.isPending || !emailInput.trim()}>
        {sendMutation.isPending ? t("invitations.sending") : t("invitations.sendButton")}
      </Button>
    </form>
  );
};
