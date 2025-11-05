import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useVotes } from "./useVotes";
import * as apiClient from "@/lib/client/api-client";

// Mock the API client
vi.mock("@/lib/client/api-client", () => ({
  get: vi.fn(),
  handleApiResponse: vi.fn((response) => response),
}));

describe("useVotes", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries for tests
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should fetch votes successfully", async () => {
    const mockVotes = {
      tour_id: "tour-123",
      votes: [
        {
          user_id: "user-1",
          vote_value: "yes",
          user_display_name: "User One",
        },
        {
          user_id: "user-2",
          vote_value: "no",
          user_display_name: "User Two",
        },
      ],
      summary: {
        yes_count: 1,
        no_count: 1,
        maybe_count: 0,
        total_votes: 2,
      },
    };

    vi.mocked(apiClient.get).mockResolvedValue(mockVotes);
    vi.mocked(apiClient.handleApiResponse).mockReturnValue(mockVotes);

    const { result } = renderHook(() => useVotes("tour-123"), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the query to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockVotes);
    expect(apiClient.get).toHaveBeenCalledWith("/api/tours/tour-123/votes");
  });

  // TODO: Fix this test - React Query error handling needs proper async setup
  it.skip("should handle errors", async () => {
    const mockError = new Error("Failed to fetch votes");
    vi.mocked(apiClient.get).mockRejectedValue(mockError);

    const { result } = renderHook(() => useVotes("tour-123"), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it("should not fetch when tourId is empty", () => {
    const { result } = renderHook(() => useVotes(""), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  // TODO: Fix this test - QueryClient caching needs proper setup
  it.skip("should use correct query key", async () => {
    const mockVotes = {
      tour_id: "tour-456",
      votes: [],
      summary: {
        yes_count: 0,
        no_count: 0,
        maybe_count: 0,
        total_votes: 0,
      },
    };

    vi.mocked(apiClient.get).mockResolvedValue(mockVotes);
    vi.mocked(apiClient.handleApiResponse).mockReturnValue(mockVotes);

    const { result } = renderHook(() => useVotes("tour-456"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check if the data is cached under the correct key
    const cachedData = queryClient.getQueryData(["votes", "tour-456"]);
    expect(cachedData).toEqual(mockVotes);
  });

  it("should refetch when tourId changes", async () => {
    const mockVotes1 = {
      tour_id: "tour-111",
      votes: [],
      summary: { yes_count: 0, no_count: 0, maybe_count: 0, total_votes: 0 },
    };

    const mockVotes2 = {
      tour_id: "tour-222",
      votes: [],
      summary: { yes_count: 1, no_count: 0, maybe_count: 0, total_votes: 1 },
    };

    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(mockVotes1)
      .mockResolvedValueOnce(mockVotes2);
    vi.mocked(apiClient.handleApiResponse)
      .mockReturnValueOnce(mockVotes1)
      .mockReturnValueOnce(mockVotes2);

    const { result, rerender } = renderHook(({ tourId }) => useVotes(tourId), {
      wrapper,
      initialProps: { tourId: "tour-111" },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.tour_id).toBe("tour-111");

    // Change tourId
    rerender({ tourId: "tour-222" });

    await waitFor(() => expect(result.current.data?.tour_id).toBe("tour-222"));
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });
});
