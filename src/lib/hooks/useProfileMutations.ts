import { useMutation } from "@tanstack/react-query";
import { patch, handleApiResponse, apiRequest } from "@/lib/client/api-client";
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
 * Uploads a new avatar for the current user
 */
const uploadAvatar = async (file: File): Promise<ProfileDto> => {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await apiRequest("/api/profiles/avatar", {
    method: "POST",
    body: formData,
  });

  return handleApiResponse<ProfileDto>(response);
};

/**
 * Deletes the current user's avatar
 */
const deleteAvatar = async (): Promise<ProfileDto> => {
  const response = await apiRequest("/api/profiles/avatar", {
    method: "DELETE",
  });

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

/**
 * React Query mutation hook for uploading user avatar
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useUploadAvatarMutation();
 *
 * const handleFileChange = (file: File) => {
 *   mutate(file);
 * };
 * ```
 */
export const useUploadAvatarMutation = () => {
  return useMutation(
    {
      mutationFn: uploadAvatar,
      onSuccess: (data) => {
        // Update the profile cache with the new data
        queryClient.setQueryData(["profile", "me"], data);
        // Invalidate to refetch user data
        queryClient.invalidateQueries({ queryKey: ["user"] });
      },
    },
    queryClient
  );
};

/**
 * React Query mutation hook for deleting user avatar
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useDeleteAvatarMutation();
 *
 * const handleDeleteAvatar = () => {
 *   mutate();
 * };
 * ```
 */
export const useDeleteAvatarMutation = () => {
  return useMutation(
    {
      mutationFn: deleteAvatar,
      onSuccess: (data) => {
        // Update the profile cache with the new data
        queryClient.setQueryData(["profile", "me"], data);
        // Invalidate to refetch user data
        queryClient.invalidateQueries({ queryKey: ["user"] });
      },
    },
    queryClient
  );
};
