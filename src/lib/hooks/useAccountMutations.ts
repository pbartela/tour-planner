import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/client/api-client";
import { queryClient } from "@/lib/queryClient";
import { supabaseBrowserClient } from "@/db/supabase.client";

/**
 * Error thrown when account deletion is blocked
 * Contains structured data about why deletion cannot proceed
 */
export class AccountDeletionBlockedClientError extends Error {
  public readonly code = "ACCOUNT_DELETION_BLOCKED" as const;
  public readonly reasons: string[];

  constructor(message: string, reasons: string[]) {
    super(message);
    this.name = "AccountDeletionBlockedClientError";
    this.reasons = reasons;
  }
}

/**
 * Type guard to check if an error is an AccountDeletionBlockedClientError
 */
export function isAccountDeletionBlockedClientError(error: unknown): error is AccountDeletionBlockedClientError {
  return error instanceof AccountDeletionBlockedClientError;
}

/**
 * Deletes the current user's account permanently
 * This action is irreversible and will:
 * - Delete all user data
 * - Transfer tour ownership or delete tours
 * - Sign out the user
 * - Redirect to home page
 *
 * @throws AccountDeletionBlockedClientError if deletion is blocked due to validation
 * @throws Error for generic failures
 */
const deleteAccount = async (): Promise<void> => {
  const response = await apiRequest("/api/profiles/me", {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errorObj = errorData?.error;

    // Check if this is a structured account deletion blocked error
    if (errorObj?.code === "ACCOUNT_DELETION_BLOCKED" && Array.isArray(errorObj?.reasons)) {
      throw new AccountDeletionBlockedClientError(errorObj.message || "Account deletion blocked", errorObj.reasons);
    }

    // Generic error
    throw new Error(errorObj?.message || "Failed to delete account");
  }

  // Response is 204 No Content, no JSON to parse
  return;
};

/**
 * React Query mutation hook for deleting user account
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useDeleteAccountMutation();
 *
 * const handleDeleteAccount = () => {
 *   mutate();
 * };
 * ```
 */
export const useDeleteAccountMutation = () => {
  return useMutation(
    {
      mutationFn: deleteAccount,
      onSuccess: async () => {
        // Clear all React Query caches
        queryClient.clear();

        // Sign out the user (ignore errors since we're redirecting anyway)
        await supabaseBrowserClient.auth.signOut();

        // Redirect immediately after signOut completes
        window.location.replace("/");
      },
    },
    queryClient
  );
};
