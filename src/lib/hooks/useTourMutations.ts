import { useMutation } from "@tanstack/react-query";
import { post, patch, del, handleApiResponse } from "@/lib/client/api-client";
import type { CreateTourCommand, UpdateTourCommand, TourDetailsDto, PaginatedToursDto, TourSummaryDto } from "@/types";
import { setCachedMetadata } from "@/lib/utils/metadata-cache";
import { queryClient } from "@/lib/queryClient";

/**
 * Creates a new tour
 */
const createTour = async (data: CreateTourCommand): Promise<TourDetailsDto> => {
  const response = await post("/api/tours", data);
  return handleApiResponse<TourDetailsDto>(response);
};

/**
 * Updates an existing tour
 */
const updateTour = async (tourId: string, data: UpdateTourCommand): Promise<TourDetailsDto> => {
  const response = await patch(`/api/tours/${tourId}`, data);
  return handleApiResponse<TourDetailsDto>(response);
};

/**
 * Deletes a tour
 */
const deleteTour = async (tourId: string): Promise<void> => {
  const response = await del(`/api/tours/${tourId}`);
  if (!response.ok && response.status !== 204) {
    throw new Error("Failed to delete tour");
  }
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
  return useMutation(
    {
      mutationFn: createTour,
      onMutate: async () => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ["tours"] });

        // Snapshot previous value
        const previousToursList = queryClient.getQueryData<PaginatedToursDto>(["tours", { status: "active" }]);

        return { previousToursList };
      },
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
      onError: (err, variables, context) => {
        // Rollback on error
        if (context?.previousToursList) {
          queryClient.setQueryData(["tours", { status: "active" }], context.previousToursList);
        }
      },
      onSettled: () => {
        // Refetch to ensure consistency
        queryClient.invalidateQueries({ queryKey: ["tours"] });
      },
    },
    queryClient
  );
};

/**
 * React Query mutation hook for updating a tour with optimistic update
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useUpdateTourMutation();
 *
 * const handleUpdate = (tourId: string, data: UpdateTourCommand) => {
 *   mutate({ tourId, data }, {
 *     onSuccess: () => {
 *       toast.success('Tour updated successfully!');
 *     }
 *   });
 * };
 * ```
 */
export const useUpdateTourMutation = () => {
  return useMutation(
    {
      mutationFn: ({ tourId, data }: { tourId: string; data: UpdateTourCommand }) => updateTour(tourId, data),
      onMutate: async ({ tourId, data }) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ["tours"] });
        await queryClient.cancelQueries({ queryKey: ["tour", tourId] });

        // Snapshot previous values
        const previousToursList = queryClient.getQueryData<PaginatedToursDto>(["tours", { status: "active" }]);
        const previousTourDetails = queryClient.getQueryData<TourDetailsDto>(["tour", tourId]);

        // Optimistically update the tour list
        queryClient.setQueryData<PaginatedToursDto>(["tours", { status: "active" }], (old) => {
          if (!old) return old;

          return {
            ...old,
            data: old.data.map((tour) =>
              tour.id === tourId
                ? {
                    ...tour,
                    ...data,
                    start_date: data.start_date ? new Date(data.start_date).toISOString() : tour.start_date,
                    end_date: data.end_date ? new Date(data.end_date).toISOString() : tour.end_date,
                  }
                : tour
            ),
          };
        });

        // Optimistically update tour details cache if it exists
        if (previousTourDetails) {
          queryClient.setQueryData<TourDetailsDto>(["tour", tourId], {
            ...previousTourDetails,
            ...data,
            start_date: data.start_date ? new Date(data.start_date).toISOString() : previousTourDetails.start_date,
            end_date: data.end_date ? new Date(data.end_date).toISOString() : previousTourDetails.end_date,
          });
        }

        return { previousToursList, previousTourDetails };
      },
      onError: (err, variables, context) => {
        // Rollback on error
        if (context?.previousToursList) {
          queryClient.setQueryData(["tours", { status: "active" }], context.previousToursList);
        }
        if (context?.previousTourDetails) {
          queryClient.setQueryData(["tour", variables.tourId], context.previousTourDetails);
        }
      },
      onSettled: (data, error, variables) => {
        // Refetch to ensure consistency
        queryClient.invalidateQueries({ queryKey: ["tours"] });
        queryClient.invalidateQueries({ queryKey: ["tour", variables.tourId] });
      },
    },
    queryClient
  );
};

/**
 * React Query mutation hook for deleting a tour with optimistic update
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useDeleteTourMutation();
 *
 * const handleDelete = (tourId: string) => {
 *   mutate(tourId, {
 *     onSuccess: () => {
 *       navigate('/');
 *       toast.success('Tour deleted successfully!');
 *     }
 *   });
 * };
 * ```
 */
export const useDeleteTourMutation = () => {
  return useMutation(
    {
      mutationFn: (tourId: string) => deleteTour(tourId),
      onMutate: async (tourId) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ["tours"] });

        // Snapshot previous value
        const previousToursList = queryClient.getQueryData<PaginatedToursDto>(["tours", { status: "active" }]);

        // Optimistically remove the tour from the list
        queryClient.setQueryData<PaginatedToursDto>(["tours", { status: "active" }], (old) => {
          if (!old) return old;

          return {
            ...old,
            data: old.data.filter((tour) => tour.id !== tourId),
            pagination: {
              ...old.pagination,
              total: old.pagination.total - 1,
            },
          };
        });

        return { previousToursList };
      },
      onError: (err, tourId, context) => {
        // Rollback on error
        if (context?.previousToursList) {
          queryClient.setQueryData(["tours", { status: "active" }], context.previousToursList);
        }
      },
      onSettled: () => {
        // Refetch to ensure consistency
        queryClient.invalidateQueries({ queryKey: ["tours"] });
      },
    },
    queryClient
  );
};

/**
 * Locks voting for a tour
 */
const lockVoting = async (tourId: string): Promise<TourDetailsDto> => {
  const response = await post(`/api/tours/${tourId}/voting/lock`, {});
  return handleApiResponse<TourDetailsDto>(response);
};

/**
 * Unlocks voting for a tour
 */
const unlockVoting = async (tourId: string): Promise<TourDetailsDto> => {
  const response = await post(`/api/tours/${tourId}/voting/unlock`, {});
  return handleApiResponse<TourDetailsDto>(response);
};

/**
 * React Query mutation hook for locking voting on a tour (owner only)
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useLockVotingMutation();
 *
 * const handleLockVoting = (tourId: string) => {
 *   mutate(tourId, {
 *     onSuccess: () => {
 *       toast.success('Voting locked!');
 *     }
 *   });
 * };
 * ```
 */
export const useLockVotingMutation = () => {
  return useMutation(
    {
      mutationFn: (tourId: string) => lockVoting(tourId),
      onMutate: async (tourId) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ["tour", tourId] });

        // Snapshot previous value
        const previousTourDetails = queryClient.getQueryData<TourDetailsDto>(["tour", tourId]);

        // Optimistically update tour details
        if (previousTourDetails) {
          queryClient.setQueryData<TourDetailsDto>(["tour", tourId], {
            ...previousTourDetails,
            voting_locked: true,
          });
        }

        return { previousTourDetails };
      },
      onError: (err, tourId, context) => {
        // Rollback on error
        if (context?.previousTourDetails) {
          queryClient.setQueryData(["tour", tourId], context.previousTourDetails);
        }
      },
      onSettled: (data, error, tourId) => {
        // Refetch to ensure consistency
        queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      },
    },
    queryClient
  );
};

/**
 * React Query mutation hook for unlocking voting on a tour (owner only)
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useUnlockVotingMutation();
 *
 * const handleUnlockVoting = (tourId: string) => {
 *   mutate(tourId, {
 *     onSuccess: () => {
 *       toast.success('Voting unlocked!');
 *     }
 *   });
 * };
 * ```
 */
export const useUnlockVotingMutation = () => {
  return useMutation(
    {
      mutationFn: (tourId: string) => unlockVoting(tourId),
      onMutate: async (tourId) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ["tour", tourId] });

        // Snapshot previous value
        const previousTourDetails = queryClient.getQueryData<TourDetailsDto>(["tour", tourId]);

        // Optimistically update tour details
        if (previousTourDetails) {
          queryClient.setQueryData<TourDetailsDto>(["tour", tourId], {
            ...previousTourDetails,
            voting_locked: false,
          });
        }

        return { previousTourDetails };
      },
      onError: (err, tourId, context) => {
        // Rollback on error
        if (context?.previousTourDetails) {
          queryClient.setQueryData(["tour", tourId], context.previousTourDetails);
        }
      },
      onSettled: (data, error, tourId) => {
        // Refetch to ensure consistency
        queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      },
    },
    queryClient
  );
};
