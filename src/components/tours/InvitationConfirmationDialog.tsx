import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { useTranslation } from "react-i18next";
import { EmailValidationError } from "@/lib/utils/email-parser.util";

export interface InvitationConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  validEmails: string[];
  invalidEmails: { email: string; error?: EmailValidationError }[];
  duplicates: string[];
  isPending?: boolean;
}

/**
 * Confirmation dialog for reviewing email invitations before sending.
 * Shows valid, invalid, and duplicate emails categorized with badges.
 */
export function InvitationConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  validEmails,
  invalidEmails,
  duplicates,
  isPending = false,
}: InvitationConfirmationDialogProps) {
  const { t } = useTranslation("tours");

  const hasIssues = invalidEmails.length > 0 || duplicates.length > 0;
  const canProceed = validEmails.length > 0;

  // Dynamic error translation keys (extracted by i18next-parser):
  // t('invitations.confirmDialog.errors.Invalid format'), t('invitations.confirmDialog.errors.Invalid domain'), t('invitations.confirmDialog.errors.Invalid email format'), t('invitations.confirmDialog.errors.Invalid TLD')

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-base-100 sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("invitations.confirmDialog.title")}</DialogTitle>
          <DialogDescription>{t("invitations.confirmDialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Valid Emails Section */}
          {validEmails.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                {t("invitations.confirmDialog.validEmailsTitle")}
                <Badge variant="success">{validEmails.length}</Badge>
              </h4>
              <ul className="max-h-40 overflow-y-auto space-y-1 bg-base-200 rounded-lg p-3">
                {validEmails.map((email) => (
                  <li key={email} className="text-sm pl-4 py-1 border-l-2 border-success">
                    {email}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Invalid Emails Section */}
          {invalidEmails.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-error">
                {t("invitations.confirmDialog.invalidEmailsTitle")}
                <Badge variant="error">{invalidEmails.length}</Badge>
              </h4>
              <ul className="max-h-40 overflow-y-auto space-y-1 bg-base-200 rounded-lg p-3">
                {invalidEmails.map((item) => (
                  <li key={item.email} className="text-sm pl-4 py-1 border-l-2 border-error">
                    <span className="font-mono">{item.email}</span>
                    {item.error && (
                      <span className="text-xs text-base-content/60 ml-2">
                        ({t(`invitations.confirmDialog.errors.${item.error}`)})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Duplicates Section */}
          {duplicates.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-warning">
                {t("invitations.confirmDialog.duplicatesTitle")}
                <Badge variant="warning">{duplicates.length}</Badge>
              </h4>
              <ul className="max-h-40 overflow-y-auto space-y-1 bg-base-200 rounded-lg p-3">
                {duplicates.map((email) => (
                  <li key={email} className="text-sm pl-4 py-1 border-l-2 border-warning">
                    {email}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-base-content/60">{t("invitations.confirmDialog.duplicatesNote")}</p>
            </div>
          )}

          {/* Summary */}
          <div className="bg-base-200 rounded-lg p-4">
            <p className="text-sm">
              {canProceed
                ? t("invitations.confirmDialog.summary", {
                    count: validEmails.length,
                    hasIssues: hasIssues ? t("invitations.confirmDialog.withIssues") : "",
                  })
                : t("invitations.confirmDialog.noValidEmails")}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="neutral-outline" onClick={onClose} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={!canProceed || isPending}>
            {isPending
              ? t("invitations.sending")
              : t("invitations.confirmDialog.sendButton", { count: validEmails.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
