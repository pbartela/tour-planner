import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post, del, handleApiResponse } from "@/lib/client/api-client";
import { queryClient as defaultQueryClient } from "@/lib/queryClient";
import type { TagDto } from "@/lib/services/tag.service";

/**
 * Hook to fetch tags for a specific tour
 */
export const useTourTags = (tourId: string) => {
  return useQuery(
    {
      queryKey: ["tour-tags", tourId],
      queryFn: async (): Promise<TagDto[]> => {
        const response = await get(`/api/tours/${tourId}/tags`);
        return handleApiResponse<TagDto[]>(response);
      },
    },
    defaultQueryClient
  );
};

/**
 * Hook to search/list all available tags
 */
export const useSearchTags = (query?: string) => {
  return useQuery(
    {
      queryKey: ["tags", { q: query }],
      queryFn: async (): Promise<TagDto[]> => {
        const params = query ? `?q=${encodeURIComponent(query)}` : "";
        const response = await get(`/api/tags${params}`);
        return handleApiResponse<TagDto[]>(response);
      },
      // Keep cached for a while since tags don't change often
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
    defaultQueryClient
  );
};

/**
 * Hook to add a tag to a tour
 */
export const useAddTag = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagName: string): Promise<TagDto> => {
      const response = await post(`/api/tours/${tourId}/tags`, {
        tag_name: tagName,
      });
      return handleApiResponse<TagDto>(response);
    },
    onSuccess: () => {
      // Invalidate tour tags query to refetch the list
      queryClient.invalidateQueries({ queryKey: ["tour-tags", tourId] });
      // Invalidate general tags list since a new tag might have been created
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
};

/**
 * Hook to remove a tag from a tour
 */
export const useRemoveTag = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: number): Promise<void> => {
      const response = await del(`/api/tours/${tourId}/tags/${tagId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to remove tag");
      }
    },
    onSuccess: () => {
      // Invalidate tour tags query to refetch the list
      queryClient.invalidateQueries({ queryKey: ["tour-tags", tourId] });
    },
  });
};
