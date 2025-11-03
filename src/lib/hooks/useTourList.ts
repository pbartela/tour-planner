import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import type { PaginatedToursDto, TourMetadata } from "@/types";
import { get, handleApiResponse } from "@/lib/client/api-client";
import { getCachedMetadata, setBulkCachedMetadata, cleanupExpiredEntries } from "@/lib/utils/metadata-cache";
import { queryClient } from "@/lib/queryClient";

const getTours = async (): Promise<PaginatedToursDto> => {
  const response = await get("/api/tours");
  const data = await handleApiResponse<PaginatedToursDto>(response);

  // Merge with cached metadata for tours that might have missing metadata
  const toursWithCache = data.data.map((tour) => {
    // If tour already has metadata from API, use it
    if (tour.metadata?.image) {
      return tour;
    }

    // Otherwise, try to get from cache
    const cachedMetadata = getCachedMetadata(tour.id);
    if (cachedMetadata) {
      return {
        ...tour,
        metadata: cachedMetadata,
      };
    }

    return tour;
  });

  // Cache metadata for all tours that have it
  const metadataEntries = data.data
    .filter((tour) => tour.metadata && (tour.metadata.image || tour.metadata.title || tour.metadata.description))
    .map((tour) => ({
      tourId: tour.id,
      metadata: tour.metadata as TourMetadata,
    }));

  if (metadataEntries.length > 0) {
    setBulkCachedMetadata(metadataEntries);
  }

  return {
    ...data,
    data: toursWithCache,
  };
};

export const useTourList = () => {
  // Cleanup expired cache entries on mount
  useEffect(() => {
    cleanupExpiredEntries();
  }, []);

  return useQuery({
    queryKey: ["tours", { status: "active" }],
    queryFn: getTours,
  }, queryClient);
};
