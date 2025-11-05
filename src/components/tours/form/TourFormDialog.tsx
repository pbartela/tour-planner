import type { ReactNode } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";

interface TourFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isSubmitting: boolean;
  submitButtonText: string;
  formId: string;
  error: string | null;
  children: ReactNode;
}

export const TourFormDialog = ({
  isOpen,
  onClose,
  title,
  isSubmitting,
  submitButtonText,
  formId,
  error,
  children,
}: TourFormDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent
        showCloseButton={false}
        className="bg-base-100 max-w-full sm:max-w-container-sm md:max-w-container-md lg:max-w-xl sm:rounded-lg rounded-none p-0 h-screen sm:h-auto sm:max-h-screen-90 flex flex-col"
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-base-content/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-base-content hover:opacity-70 transition-opacity disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-base-content">{title}</h1>
          <div className="w-6" />
        </div>

        {/* Form content area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          {error && (
            <div className="alert alert-error mb-5 sm:mb-6">
              <span>{error}</span>
            </div>
          )}
          {children}
        </div>

        {/* Footer with Save button */}
        <div className="p-4 sm:p-4 border-t border-base-content/10">
          <Button
            type="submit"
            form={formId}
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-content font-bold py-3 sm:py-4 px-6 rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-300 disabled:opacity-50"
          >
            {submitButtonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
