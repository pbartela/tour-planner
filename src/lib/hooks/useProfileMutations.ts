import { useMutation } from "@tanstack/react-query";
import { patch, handleApiResponse } from "@/lib/client/api-client";
import type { ProfileDto, UpdateProfileCommand } from "@/types";
import { queryClient } from "@/lib/queryClient";

/**
 * Updates the current user's profile
 */
const updateProfile = async (data: UpdateProfileCommand): Promise<ProfileDto> => {
  const response = await patch("/api/profiles/me", data);
  return handleApiResponse<ProfileDto>(response);
};

/**
 * React Query mutation hook for updating user profile
 *
 * @example
 * ```tsx
 * const { mutate, isPending, isSuccess } = useUpdateProfileMutation();
 *
 * const handleCompleteOnboarding = () => {
 *   mutate({ onboarding_completed: true });
 * };
 * ```
 */
export const useUpdateProfileMutation = () => {
  return useMutation(
    {
      mutationFn: updateProfile,
      onSuccess: (data) => {
        // Update the profile cache with the new data
        queryClient.setQueryData(["profile", "me"], data);
      },
    },
    queryClient
  );
};
