import { useQuery } from "@tanstack/react-query";

import type { PaginatedToursDto } from "@/types";

const getTours = async (): Promise<PaginatedToursDto> => {
  const response = await fetch("/api/tours");
  if (!response.ok) {
    throw new Error("Failed to fetch tours");
  }
  return response.json();
};

export const useTourList = () => {
  return useQuery({
    queryKey: ["tours", { status: "active" }],
    queryFn: getTours,
  });
};
