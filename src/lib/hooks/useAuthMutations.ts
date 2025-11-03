import { useMutation } from "@tanstack/react-query";
import { post, handleApiResponse } from "@/lib/client/api-client";
import { queryClient } from "@/lib/queryClient";

/**
 * Request data for magic link authentication
 */
interface MagicLinkRequest {
  email: string;
  redirectTo?: string | null;
  locale: string;
}

/**
 * Response from magic link request
 */
interface MagicLinkResponse {
  message: string;
}

/**
 * Sends a magic link authentication request
 */
const requestMagicLink = async (data: MagicLinkRequest): Promise<MagicLinkResponse> => {
  const response = await post("/api/auth/magic-link", data);
  return handleApiResponse<MagicLinkResponse>(response);
};

/**
 * React Query mutation hook for requesting a magic link
 *
 * @example
 * ```tsx
 * const { mutate, isPending, isError, error } = useMagicLinkMutation();
 *
 * const handleSubmit = (data: { email: string }) => {
 *   mutate({
 *     email: data.email,
 *     redirectTo: '/dashboard',
 *     locale: 'en-US'
 *   });
 * };
 * ```
 */
export const useMagicLinkMutation = () => {
  return useMutation({
    mutationFn: requestMagicLink,
  }, queryClient);
};
