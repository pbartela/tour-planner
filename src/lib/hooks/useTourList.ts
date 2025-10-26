import { useQuery } from "@tanstack/react-query";

import type { PaginatedToursDto } from "@/types";
import { get, handleApiResponse } from "@/lib/client/api-client";

const getTours = async (): Promise<PaginatedToursDto> => {
  const response = await get("/api/tours");
  return handleApiResponse<PaginatedToursDto>(response);
};

export const useTourList = () => {
  return useQuery({
    queryKey: ["tours", { status: "active" }],
    queryFn: getTours,
  });
};
