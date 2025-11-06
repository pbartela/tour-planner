import { useState } from "react";

interface DialogState {
  open: boolean;
  invitationId: string;
  email: string;
}

/**
 * Custom hook for managing dialog state
 * Simplifies open/close and data management for confirmation dialogs
 */
export const useDialogState = () => {
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    invitationId: "",
    email: "",
  });

  const openDialog = (invitationId: string, email: string) => {
    setDialogState({ open: true, invitationId, email });
  };

  const closeDialog = () => {
    setDialogState({ open: false, invitationId: "", email: "" });
  };

  return {
    dialogState,
    openDialog,
    closeDialog,
  };
};
