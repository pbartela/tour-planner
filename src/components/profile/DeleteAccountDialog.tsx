import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

/**
 * Two-step confirmation dialog for account deletion
 * Requires user to:
 * 1. Check acknowledgment checkbox
 * 2. Type "DELETE" to confirm
 */
export const DeleteAccountDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}: DeleteAccountDialogProps) => {
  const { t } = useTranslation("common");
  const [isChecked, setIsChecked] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsChecked(false);
      setConfirmText("");
    }
    onOpenChange(newOpen);
  };

  // Get expected confirmation text from translation (removes any formatting/spaces)
  const expectedConfirmText = t("profile.deleteAccount.confirmPlaceholder");

  // Confirm button enabled only when both conditions met (normalized comparison)
  const isConfirmEnabled =
    isChecked && confirmText.trim().toUpperCase() === expectedConfirmText.trim().toUpperCase() && !isDeleting;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-base-100">
        <DialogHeader>
          <DialogTitle className="text-error">{t("profile.deleteAccount.title")}</DialogTitle>
          <DialogDescription>{t("profile.deleteAccount.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Checkbox confirmation */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="confirm-checkbox"
              className="checkbox checkbox-error"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              disabled={isDeleting}
              aria-required="true"
              aria-label={t("profile.deleteAccount.checkboxLabel")}
            />
            <label htmlFor="confirm-checkbox" className="text-sm font-medium leading-none cursor-pointer">
              {t("profile.deleteAccount.checkboxLabel")}
            </label>
          </div>

          {/* Text input confirmation */}
          <div className="space-y-2">
            <label htmlFor="confirm-text" className="text-sm font-medium">
              {t("profile.deleteAccount.confirmLabel")}
            </label>
            <Input
              id="confirm-text"
              type="text"
              placeholder={t("profile.deleteAccount.confirmPlaceholder")}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="neutral-outline" onClick={() => handleOpenChange(false)} disabled={isDeleting}>
            {t("common.cancel")}
          </Button>
          <Button variant="error" onClick={onConfirm} disabled={!isConfirmEnabled}>
            {isDeleting ? t("profile.deleteAccount.deleting") : t("profile.deleteAccount.confirmButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
