import { useMutation, useQuery } from "@tanstack/react-query";
import { get, patch, handleApiResponse, apiRequest } from "@/lib/client/api-client";
import type { ProfileDto, UpdateProfileCommand } from "@/types";
import { queryClient } from "@/lib/queryClient";

/**
 * Fetches the current user's profile
 */
const fetchProfile = async (): Promise<ProfileDto> => {
  const response = await get("/api/profiles/me");
  return handleApiResponse<ProfileDto>(response);
};

/**
 * React Query hook for fetching user profile
 *
 * @param placeholderData - Optional placeholder data from SSR (e.g., from server)
 * @example
 * ```tsx
 * const { data: profile, isLoading } = useProfile();
 *
 * // With placeholder data from SSR
 * const { data: profile } = useProfile(serverProfile);
 * ```
 */
export const useProfile = (placeholderData?: ProfileDto) => {
  return useQuery(
    {
      queryKey: ["profile", "me"],
      queryFn: fetchProfile,
      placeholderData,
      staleTime: 0, // Always refetch to ensure fresh data
    },
    queryClient
  );
};

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
        console.log("[Avatar Upload] Success - New avatar_url:", data.avatar_url);
        // Update the profile cache with the new data
        queryClient.setQueryData(["profile", "me"], data);
        console.log("[Avatar Upload] Cache updated with new profile data");
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
