import { toast } from "react-hot-toast";
import type { StorageError } from "./storage";

/**
 * User-friendly error messages for storage failures.
 * Can be internationalized later by passing t() function.
 */
const ERROR_MESSAGES: Record<StorageError["type"], string> = {
  unavailable:
    "Unable to save preferences (browser privacy mode may be enabled)",
  quota_exceeded:
    "Storage quota exceeded. Please clear browser data or disable unnecessary features.",
  serialization_error: "Failed to save settings due to data format error",
  unknown: "Failed to save preferences. Please try again.",
};

/**
 * Show a toast notification for storage operation failure.
 *
 * @param error - Storage error details
 * @param context - Optional context for the user (e.g., "theme preference", "invitation settings")
 */
export function notifyStorageError(
  error: StorageError,
  context?: string
): void {
  const baseMessage = ERROR_MESSAGES[error.type];
  const fullMessage = context ? `${baseMessage} (${context})` : baseMessage;

  toast.error(fullMessage);

  // Log detailed error in development
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error("[Storage Error]", {
      type: error.type,
      message: error.message,
      context,
      originalError: error.originalError,
    });
  }
}
