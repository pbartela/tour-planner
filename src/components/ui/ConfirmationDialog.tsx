import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";

export interface ConfirmationDialogProps {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;
  /**
   * Callback when dialog should close
   */
  onClose: () => void;
  /**
   * Callback when user confirms the action
   */
  onConfirm: () => void;
  /**
   * Dialog title
   */
  title: string;
  /**
   * Dialog message/description
   */
  message: string;
  /**
   * Text for the confirm button
   */
  confirmText: string;
  /**
   * Text for the cancel button
   */
  cancelText: string;
  /**
   * Optional text confirmation requirement
   */
  requireTextConfirmation?: {
    /**
     * The exact text user must type to confirm
     */
    expectedText: string;
    /**
     * Placeholder for the input field
     */
    placeholder: string;
    /**
     * Prompt text explaining what to type
     */
    prompt: string;
  };
  /**
   * Visual variant of the dialog
   */
  variant?: "error" | "warning" | "info";
  /**
   * Whether the confirmation action is pending
   */
  isPending?: boolean;
  /**
   * Text to show on confirm button when pending
   */
  pendingText?: string;
}

const variantButtonMap = {
  error: "error" as const,
  warning: "warning" as const,
  info: "info" as const,
};

const ConfirmationDialog = React.forwardRef<HTMLDivElement, ConfirmationDialogProps>(
  (
    {
      isOpen,
      onClose,
      onConfirm,
      title,
      message,
      confirmText,
      cancelText,
      requireTextConfirmation,
      variant = "error",
      isPending = false,
      pendingText,
      ...props
    },
    ref
  ) => {
    const [confirmInput, setConfirmInput] = React.useState("");

    // Reset input when dialog closes
    React.useEffect(() => {
      if (!isOpen) {
        setConfirmInput("");
      }
    }, [isOpen]);

    const handleConfirm = () => {
      if (requireTextConfirmation && confirmInput !== requireTextConfirmation.expectedText) {
        return;
      }
      onConfirm();
    };

    const isConfirmDisabled =
      isPending || (requireTextConfirmation ? confirmInput !== requireTextConfirmation.expectedText : false);

    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent ref={ref} className="bg-base-100 sm:max-w-md" {...props}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="pt-2">{message}</DialogDescription>
          </DialogHeader>

          {requireTextConfirmation && (
            <div className="space-y-2">
              <p className="text-sm text-base-content/70">
                {requireTextConfirmation.prompt}{" "}
                <strong className="font-semibold">{requireTextConfirmation.expectedText}</strong>
              </p>
              <Input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={requireTextConfirmation.placeholder}
                disabled={isPending}
                className="w-full"
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="neutral-outline" onClick={onClose} disabled={isPending}>
              {cancelText}
            </Button>
            <Button variant={variantButtonMap[variant]} onClick={handleConfirm} disabled={isConfirmDisabled}>
              {isPending && pendingText ? pendingText : confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

ConfirmationDialog.displayName = "ConfirmationDialog";

export { ConfirmationDialog };
