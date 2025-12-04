import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/client/api-client";
import { queryClient } from "@/lib/queryClient";
import { supabaseBrowserClient } from "@/db/supabase.client";

/**
 * Deletes the current user's account permanently
 * This action is irreversible and will:
 * - Delete all user data
 * - Transfer tour ownership or delete tours
 * - Sign out the user
 * - Redirect to home page
 */
const deleteAccount = async (): Promise<void> => {
  const response = await apiRequest("/api/profiles/me", {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || "Failed to delete account");
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

        // Sign out the user
        await supabaseBrowserClient.auth.signOut();

        // Redirect to home page using replace to prevent back navigation
        window.location.replace("/");
      },
    },
    queryClient
  );
};
