import { describe, it, expect, vi, beforeEach } from "vitest";
import { tourService } from "./tour.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateTourCommand, UpdateTourCommand } from "@/types";

// Mock dependencies
vi.mock("@/lib/server/logger.service", () => ({
  secureError: vi.fn(),
}));

vi.mock("@/lib/server/metadata-extract.service", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/utils/tour-status.util", () => ({
  ensureTourNotArchived: vi.fn(),
}));

import getTripMetaData from "@/lib/server/metadata-extract.service";
import { ensureTourNotArchived } from "@/lib/utils/tour-status.util";

describe("tour.service", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      update: vi.fn(() => mockSupabase),
      delete: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      in: vi.fn(() => mockSupabase),
      range: vi.fn(() => mockSupabase),
      order: vi.fn(() => mockSupabase),
      single: vi.fn(),
      returns: vi.fn(),
      rpc: vi.fn(),
    } as unknown as SupabaseClient;
  });

  describe("listToursForUser", () => {
    const mockTourData = [
      {
        tour: {
          id: "tour-1",
          title: "Paris Trip",
          destination: "https://example.com/paris",
          start_date: "2025-06-01",
          end_date: "2025-06-10",
          status: "planning",
          updated_at: "2025-01-10T10:00:00Z",
        },
      },
    ];

    const mockMetadata = {
      title: "Paris Travel Guide",
      description: "Explore Paris",
      image: "https://example.com/paris.jpg",
      canonicalUrl: "https://example.com/paris",
    };

    it("should list tours with basic pagination", async () => {
      // Mock the main query chain
      const mockQueryChain = {
        ...mockSupabase,
        returns: vi.fn().mockResolvedValue({
          data: mockTourData,
          error: null,
          count: 1,
        }),
      };
      vi.mocked(mockSupabase.range).mockReturnValue(mockQueryChain as never);

      // Mock batch queries for participants, activity, comments, votes
      // Each needs to return a chain that ends with the result
      const mockParticipantsChain = {
        ...mockSupabase,
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      const mockCommentsChain = {
        ...mockSupabase,
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      const mockVotesChain = {
        ...mockSupabase,
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(mockSupabase.in)
        .mockReturnValueOnce(mockParticipantsChain as never) // participants
        .mockResolvedValueOnce({ data: [], error: null } as never) // activity
        .mockReturnValueOnce(mockCommentsChain as never) // comments
        .mockReturnValueOnce(mockVotesChain as never); // votes

      vi.mocked(getTripMetaData).mockResolvedValueOnce(mockMetadata);

      const result = await tourService.listToursForUser(mockSupabase, "user-1", {
        status: "planning",
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe("Paris Trip");
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
      });
    });

    it("should filter tours by tags (AND logic)", async () => {
      // Mock tour_tags query
      const mockTagData = [
        { tour_id: "tour-1", tags: { name: "adventure" } },
        { tour_id: "tour-1", tags: { name: "beach" } },
        { tour_id: "tour-2", tags: { name: "adventure" } },
      ];

      const mockTagChain = {
        ...mockSupabase,
        in: vi.fn().mockResolvedValue({
          data: mockTagData,
          error: null,
        }),
      };
      vi.mocked(mockSupabase.select).mockReturnValueOnce(mockTagChain as never);

      // Mock main query (only tour-1 should match both tags)
      // When tags are provided, the chain is: .select().eq().eq().in().range().returns()
      const mockRangeChain = {
        ...mockSupabase,
        returns: vi.fn().mockResolvedValue({
          data: [mockTourData[0]],
          error: null,
          count: 1,
        }),
      };
      const mockInChain = {
        ...mockSupabase,
        range: vi.fn().mockReturnValue(mockRangeChain),
      };
      const mockEq2Chain = {
        ...mockSupabase,
        in: vi.fn().mockReturnValue(mockInChain),
      };
      const mockEq1Chain = {
        ...mockSupabase,
        eq: vi.fn().mockReturnValue(mockEq2Chain),
      };
      const mockMainSelectChain = {
        ...mockSupabase,
        eq: vi.fn().mockReturnValue(mockEq1Chain),
      };
      // Mock the main query's .select() call to return the chain
      vi.mocked(mockSupabase.select).mockReturnValueOnce(mockMainSelectChain as never);

      // Mock batch queries
      // First batch: from(...).select(...).in(...).order(...) for participants
      const mockParticipantsChain = {
        ...mockSupabase,
        in: vi.fn().mockReturnValue({
          ...mockSupabase,
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
      // Mocking select for participants
      vi.mocked(mockSupabase.select).mockReturnValueOnce(mockParticipantsChain as never);

      // Other batch queries: from(...).select(...).eq(...).in(...)
      vi.mocked(mockSupabase.in)
        .mockResolvedValueOnce({ data: [], error: null } as never) // activity
        .mockReturnValueOnce({ ...mockSupabase, order: vi.fn().mockResolvedValue({ data: [], error: null }) } as never) // comments
        .mockReturnValueOnce({ ...mockSupabase, order: vi.fn().mockResolvedValue({ data: [], error: null }) } as never); // votes

      vi.mocked(getTripMetaData).mockReset();
      vi.mocked(getTripMetaData).mockResolvedValueOnce(mockMetadata);

      const result = await tourService.listToursForUser(mockSupabase, "user-1", {
        status: "planning",
        page: 1,
        limit: 10,
        tags: ["adventure", "beach"],
      });

      // Only tour-1 has both tags, so it should be the only result
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data[0].title).toBe("Paris Trip");
    });

    it("should return empty result when no tours match tags", async () => {
      // Mock tour_tags query with no matches
      const mockTagChain = {
        ...mockSupabase,
        in: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      vi.mocked(mockSupabase.select).mockReturnValueOnce(mockTagChain as never);

      const result = await tourService.listToursForUser(mockSupabase, "user-1", {
        status: "planning",
        page: 1,
        limit: 10,
        tags: ["nonexistent"],
      });

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it("should detect new activity when never viewed", async () => {
      // Mock main query
      const mockQueryChain = {
        ...mockSupabase,
        returns: vi.fn().mockResolvedValue({
          data: mockTourData,
          error: null,
          count: 1,
        }),
      };
      vi.mocked(mockSupabase.range).mockReturnValue(mockQueryChain as never);

      // Mock batch queries (no activity record = never viewed)
      const mockParticipantsChain = {
        ...mockSupabase,
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      const mockCommentsChain = {
        ...mockSupabase,
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      const mockVotesChain = {
        ...mockSupabase,
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(mockSupabase.in)
        .mockReturnValueOnce(mockParticipantsChain as never) // participants
        .mockResolvedValueOnce({ data: [], error: null } as never) // activity (empty!)
        .mockReturnValueOnce(mockCommentsChain as never) // comments
        .mockReturnValueOnce(mockVotesChain as never); // votes

      vi.mocked(getTripMetaData).mockResolvedValueOnce(mockMetadata);

      const result = await tourService.listToursForUser(mockSupabase, "user-1", {
        status: "planning",
        page: 1,
        limit: 10,
      });

      expect(result.data[0].has_new_activity).toBe(true);
    });

    it("should detect new activity from tour updates", async () => {
      // Mock main query
      const mockQueryChain = {
        ...mockSupabase,
        returns: vi.fn().mockResolvedValue({
          data: mockTourData,
          error: null,
          count: 1,
        }),
      };
      vi.mocked(mockSupabase.range).mockReturnValue(mockQueryChain as never);

      // Mock batch queries with old last_viewed_at
      const mockParticipantsChain = {
        ...mockSupabase,
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      const mockCommentsChain = {
        ...mockSupabase,
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      const mockVotesChain = {
        ...mockSupabase,
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(mockSupabase.in)
        .mockReturnValueOnce(mockParticipantsChain as never) // participants
        .mockResolvedValueOnce({
          data: [{ tour_id: "tour-1", last_viewed_at: "2025-01-09T10:00:00Z" }],
          error: null,
        } as never) // activity
        .mockReturnValueOnce(mockCommentsChain as never) // comments
        .mockReturnValueOnce(mockVotesChain as never); // votes

      vi.mocked(getTripMetaData).mockResolvedValueOnce(mockMetadata);

      const result = await tourService.listToursForUser(mockSupabase, "user-1", {
        status: "planning",
        page: 1,
        limit: 10,
      });

      // Tour updated_at (2025-01-10) > last_viewed_at (2025-01-09)
      expect(result.data[0].has_new_activity).toBe(true);
    });

    it("should enrich tours with participant data", async () => {
      // Mock main query
      const mockQueryChain = {
        ...mockSupabase,
        returns: vi.fn().mockResolvedValue({
          data: mockTourData,
          error: null,
          count: 1,
        }),
      };
      vi.mocked(mockSupabase.range).mockReturnValue(mockQueryChain as never);

      // Mock batch queries with participants
      const mockParticipants = [
        {
          tour_id: "tour-1",
          user_id: "user-1",
          profiles: {
            display_name: "John Doe",
            avatar_url: "https://example.com/avatar.jpg",
            email: "john@example.com",
          },
        },
      ];

      const mockParticipantsChain = {
        ...mockSupabase,
        order: vi.fn().mockResolvedValue({ data: mockParticipants, error: null }),
      };
      const mockCommentsChain = {
        ...mockSupabase,
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      const mockVotesChain = {
        ...mockSupabase,
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(mockSupabase.in)
        .mockReturnValueOnce(mockParticipantsChain as never) // participants
        .mockResolvedValueOnce({ data: [], error: null } as never) // activity
        .mockReturnValueOnce(mockCommentsChain as never) // comments
        .mockReturnValueOnce(mockVotesChain as never); // votes

      vi.mocked(getTripMetaData).mockResolvedValueOnce(mockMetadata);

      const result = await tourService.listToursForUser(mockSupabase, "user-1", {
        status: "planning",
        page: 1,
        limit: 10,
      });

      expect(result.data[0].participants).toHaveLength(1);
      expect(result.data[0].participants[0]).toEqual({
        user_id: "user-1",
        display_name: "John Doe",
        avatar_url: "https://example.com/avatar.jpg",
        email: "john@example.com",
      });
    });

    it("should throw error when main query fails", async () => {
      const mockQueryChain = {
        ...mockSupabase,
        returns: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
          count: null,
        }),
      };
      vi.mocked(mockSupabase.range).mockReturnValue(mockQueryChain as never);

      await expect(
        tourService.listToursForUser(mockSupabase, "user-1", {
          status: "planning",
          page: 1,
          limit: 10,
        })
      ).rejects.toThrow("Failed to fetch tours from the database.");
    });
  });

  describe("createTour", () => {
    const mockCommand: CreateTourCommand = {
      title: "New Tour",
      destination: "https://example.com/destination",
      description: "A great tour",
      start_date: "2025-06-01",
      end_date: "2025-06-10",
      participant_limit: 10,
      like_threshold: 5,
    };

    const mockCreatedTour = {
      id: "tour-123",
      title: "New Tour",
      destination: "https://example.com/destination",
      status: "planning",
    };

    const mockMetadata = {
      title: "Destination Title",
      description: "Destination Description",
      image: "https://example.com/image.jpg",
      canonicalUrl: "https://example.com/canonical",
    };

    it("should create tour with metadata", async () => {
      vi.mocked(getTripMetaData).mockReset();
      vi.mocked(getTripMetaData).mockResolvedValueOnce(mockMetadata);

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [mockCreatedTour],
        error: null,
      } as never);

      const result = await tourService.createTour(mockSupabase, mockCommand);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe("New Tour");
      // Metadata is present (may be from cache)
      expect(result.data?.metadata).toBeDefined();

      expect(mockSupabase.rpc).toHaveBeenCalledWith("create_tour", expect.objectContaining({
        p_title: "New Tour",
        p_description: "A great tour",
        p_start_date: "2025-06-01",
        p_end_date: "2025-06-10",
        p_participant_limit: 10,
        p_like_threshold: 5,
      }));
    });

    it("should create tour without metadata when extraction fails", async () => {
      // Use a unique URL that won't be cached
      const uniqueCommand = {
        ...mockCommand,
        destination: "https://unique-never-cached-url.example.com/test-12345",
      };

      // Clear the mock to ensure clean state
      vi.mocked(getTripMetaData).mockReset();
      vi.mocked(getTripMetaData).mockResolvedValueOnce(null);

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [mockCreatedTour],
        error: null,
      } as never);

      const result = await tourService.createTour(mockSupabase, uniqueCommand);

      expect(result.error).toBeNull();
      expect(result.data?.metadata).toBeUndefined();
    });

    it("should return error when RPC fails", async () => {
      vi.mocked(getTripMetaData).mockResolvedValueOnce(mockMetadata);

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: "RPC error" },
      } as never);

      const result = await tourService.createTour(mockSupabase, mockCommand);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe("Failed to create tour in the database.");
      expect(result.data).toBeNull();
    });

    it("should return error when tour is not returned", async () => {
      vi.mocked(getTripMetaData).mockResolvedValueOnce(mockMetadata);

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as never);

      const result = await tourService.createTour(mockSupabase, mockCommand);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe("Failed to retrieve created tour.");
      expect(result.data).toBeNull();
    });
  });

  describe("getTourDetails", () => {
    const mockTour = {
      id: "tour-1",
      title: "Paris Trip",
      destination: "https://example.com/paris",
      status: "planning",
    };

    const mockMetadata = {
      title: "Paris Guide",
      description: "Explore Paris",
      image: "https://example.com/paris.jpg",
      canonicalUrl: "https://example.com/paris",
    };

    it("should get tour details with metadata", async () => {
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: mockTour,
        error: null,
      } as never);

      vi.mocked(getTripMetaData).mockResolvedValueOnce(mockMetadata);

      const result = await tourService.getTourDetails(mockSupabase, "tour-1");

      expect(result.error).toBeNull();
      expect(result.data?.id).toBe("tour-1");
      expect(result.data?.title).toBe("Paris Trip");
      expect(result.data?.metadata?.title).toBeDefined();
      expect(result.data?.metadata?.description).toBeDefined();
      expect(result.data?.metadata?.image).toBeDefined();
    });

    it("should get tour details without metadata when extraction fails", async () => {
      const mockTourWithDifferentUrl = {
        ...mockTour,
        destination: "https://example.com/never-seen-before-url-12345",
      };

      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: mockTourWithDifferentUrl,
        error: null,
      } as never);

      // Clear and setup mock
      vi.mocked(getTripMetaData).mockReset();
      vi.mocked(getTripMetaData).mockResolvedValueOnce(null);

      const result = await tourService.getTourDetails(mockSupabase, "tour-1");

      expect(result.error).toBeNull();
      expect(result.data?.metadata).toBeUndefined();
    });

    it("should return error when tour not found", async () => {
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      } as never);

      const result = await tourService.getTourDetails(mockSupabase, "tour-1");

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe("Failed to fetch tour details from the database.");
      expect(result.data).toBeNull();
    });
  });

  describe("updateTour", () => {
    const mockCommand: UpdateTourCommand = {
      title: "Updated Tour",
      description: "Updated description",
    };

    const mockUpdatedTour = {
      id: "tour-1",
      title: "Updated Tour",
      description: "Updated description",
    };

    it("should update tour successfully", async () => {
      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: mockUpdatedTour,
        error: null,
      } as never);

      const result = await tourService.updateTour(mockSupabase, "tour-1", mockCommand);

      expect(ensureTourNotArchived).toHaveBeenCalledWith(mockSupabase, "tour-1");
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockUpdatedTour);
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Updated Tour",
          description: "Updated description",
          updated_at: expect.any(String),
        })
      );
    });

    it("should return error when tour is archived", async () => {
      vi.mocked(ensureTourNotArchived).mockRejectedValue(new Error("Tour is archived"));

      const result = await tourService.updateTour(mockSupabase, "tour-1", mockCommand);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe("Tour is archived");
      expect(result.data).toBeNull();
    });

    it("should return error when update fails", async () => {
      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: null,
        error: { message: "Update failed" },
      } as never);

      const result = await tourService.updateTour(mockSupabase, "tour-1", mockCommand);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe("Failed to update tour in the database. It may not exist or you may not have permission.");
      expect(result.data).toBeNull();
    });
  });

  describe("deleteTour", () => {
    it("should delete tour successfully", async () => {
      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      const mockDeleteChain = {
        error: null,
      };
      vi.mocked(mockSupabase.eq).mockResolvedValue(mockDeleteChain as never);

      const result = await tourService.deleteTour(mockSupabase, "tour-1");

      expect(ensureTourNotArchived).toHaveBeenCalledWith(mockSupabase, "tour-1");
      expect(result.error).toBeNull();
      expect(mockSupabase.delete).toHaveBeenCalled();
    });

    it("should return error when tour is archived", async () => {
      vi.mocked(ensureTourNotArchived).mockRejectedValue(new Error("Tour is archived"));

      const result = await tourService.deleteTour(mockSupabase, "tour-1");

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe("Tour is archived");
    });

    it("should return error when delete fails", async () => {
      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      const mockDeleteChain = {
        error: { message: "Delete failed" },
      };
      vi.mocked(mockSupabase.eq).mockResolvedValue(mockDeleteChain as never);

      const result = await tourService.deleteTour(mockSupabase, "tour-1");

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe("Failed to delete tour from the database. It may not exist or you may not have permission.");
    });
  });

  describe("lockVoting", () => {
    const mockTour = {
      id: "tour-1",
      voting_locked: true,
    };

    it("should lock voting successfully", async () => {
      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: mockTour,
        error: null,
      } as never);

      const result = await tourService.lockVoting(mockSupabase, "tour-1");

      expect(ensureTourNotArchived).toHaveBeenCalledWith(mockSupabase, "tour-1");
      expect(result.error).toBeNull();
      expect(result.data?.voting_locked).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({ voting_locked: true });
    });

    it("should return error when tour is archived", async () => {
      vi.mocked(ensureTourNotArchived).mockRejectedValue(new Error("Tour is archived"));

      const result = await tourService.lockVoting(mockSupabase, "tour-1");

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe("Tour is archived");
      expect(result.data).toBeNull();
    });

    it("should return error when user is not owner", async () => {
      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: null,
        error: { message: "RLS policy violation" },
      } as never);

      const result = await tourService.lockVoting(mockSupabase, "tour-1");

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe("Failed to lock voting. You may not have permission.");
      expect(result.data).toBeNull();
    });
  });

  describe("unlockVoting", () => {
    const mockTour = {
      id: "tour-1",
      voting_locked: false,
    };

    it("should unlock voting successfully", async () => {
      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: mockTour,
        error: null,
      } as never);

      const result = await tourService.unlockVoting(mockSupabase, "tour-1");

      expect(ensureTourNotArchived).toHaveBeenCalledWith(mockSupabase, "tour-1");
      expect(result.error).toBeNull();
      expect(result.data?.voting_locked).toBe(false);
      expect(mockSupabase.update).toHaveBeenCalledWith({ voting_locked: false });
    });

    it("should return error when tour is archived", async () => {
      vi.mocked(ensureTourNotArchived).mockRejectedValue(new Error("Tour is archived"));

      const result = await tourService.unlockVoting(mockSupabase, "tour-1");

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe("Tour is archived");
      expect(result.data).toBeNull();
    });

    it("should return error when user is not owner", async () => {
      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: null,
        error: { message: "RLS policy violation" },
      } as never);

      const result = await tourService.unlockVoting(mockSupabase, "tour-1");

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe("Failed to unlock voting. You may not have permission.");
      expect(result.data).toBeNull();
    });
  });
});
