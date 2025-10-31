import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post, handleApiResponse } from "@/lib/client/api-client";
import type { CreateTourCommand, TourDetailsDto, PaginatedToursDto, TourSummaryDto } from "@/types";
import { setCachedMetadata } from "@/lib/utils/metadata-cache";

/**
 * Creates a new tour
 */
const createTour = async (data: CreateTourCommand): Promise<TourDetailsDto> => {
  const response = await post("/api/tours", data);
  return handleApiResponse<TourDetailsDto>(response);
};

/**
 * React Query mutation hook for creating a new tour
 *
 * Optimistically updates the cache with the new tour data,
 * avoiding a full refetch and preserving cached metadata.
 *
 * @example
 * ```tsx
 * const { mutate, isPending, isError, error } = useCreateTourMutation();
 *
 * const handleSubmit = (data: CreateTourCommand) => {
 *   mutate(data, {
 *     onSuccess: () => {
 *       // Tour list cache is automatically updated
 *       toast.success('Tour created successfully!');
 *     }
 *   });
 * };
 * ```
 */
export const useCreateTourMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTour,
    onSuccess: (newTour: TourDetailsDto) => {
      // Convert TourDetailsDto to TourSummaryDto for the list
      const newTourSummary: TourSummaryDto = {
        id: newTour.id,
        title: newTour.title,
        destination: newTour.destination,
        start_date: newTour.start_date,
        end_date: newTour.end_date,
        status: newTour.status,
        has_new_activity: false,
        metadata: newTour.metadata,
      };

      // Cache metadata if available
      if (newTour.metadata && (newTour.metadata.image || newTour.metadata.title || newTour.metadata.description)) {
        setCachedMetadata(newTour.id, newTour.metadata);
      }

      // Update the tours list cache without refetching
      queryClient.setQueryData<PaginatedToursDto>(["tours", { status: "active" }], (oldData) => {
        if (!oldData) {
          return {
            data: [newTourSummary],
            pagination: {
              page: 1,
              limit: 10,
              total: 1,
            },
          };
        }

        return {
          ...oldData,
          data: [newTourSummary, ...oldData.data],
          pagination: {
            ...oldData.pagination,
            total: oldData.pagination.total + 1,
          },
        };
      });
    },
  });
};
