import { describe, it, expect, vi, beforeEach } from "vitest";
import { tagService, ArchiveError } from "./tag.service";
import type { SupabaseClient } from "@/db/supabase.client";
import * as tourStatusUtil from "@/lib/utils/tour-status.util";
import * as profileServiceModule from "./profile.service";

// Mock the tour status utility
vi.mock("@/lib/utils/tour-status.util", () => ({
  isTourArchived: vi.fn(),
  TourNotFoundError: class TourNotFoundError extends Error {
    constructor(tourId: string) {
      super(`Tour not found: ${tourId}`);
      this.name = "TourNotFoundError";
    }
  },
  TourStatusVerificationError: class TourStatusVerificationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "TourStatusVerificationError";
    }
  },
}));

describe("TagService", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn(),
      rpc: vi.fn(),
    } as unknown as SupabaseClient;
  });

  describe("getTagsForTour", () => {
    it("should return tags for a tour", async () => {
      const mockData = [
        { tag_id: 1, tags: { id: 1, name: "summer" } },
        { tag_id: 2, tags: { id: 2, name: "europe" } },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: mockData, error: null });

      (mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await tagService.getTagsForTour(mockSupabase, "tour-123");

      expect(result).toEqual([
        { id: 1, name: "summer" },
        { id: 2, name: "europe" },
      ]);
      expect(mockSupabase.from).toHaveBeenCalledWith("tour_tags");
    });

    it("should return empty array when no tags exist", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });

      (mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await tagService.getTagsForTour(mockSupabase, "tour-123");

      expect(result).toEqual([]);
    });

    it("should throw error on database failure", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } });

      (mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      await expect(tagService.getTagsForTour(mockSupabase, "tour-123")).rejects.toThrow(
        "Failed to fetch tags from the database."
      );
    });

    it("should handle array tags response", async () => {
      const mockData = [{ tag_id: 1, tags: [{ id: 1, name: "adventure" }] }];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: mockData, error: null });

      (mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await tagService.getTagsForTour(mockSupabase, "tour-123");

      expect(result).toEqual([{ id: 1, name: "adventure" }]);
    });
  });

  describe("searchTags", () => {
    it("should search tags by query", async () => {
      const mockData = [
        { id: 1, name: "summer" },
        { id: 2, name: "sunshine" },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockIlike = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null });

      (mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        ilike: mockIlike,
      });
      mockIlike.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        limit: mockLimit,
      });

      const result = await tagService.searchTags(mockSupabase, "sum", 10);

      expect(result).toEqual(mockData);
      expect(mockSupabase.from).toHaveBeenCalledWith("tags");
      expect(mockIlike).toHaveBeenCalledWith("name", "sum%");
      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it("should use default limit of 10", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockIlike = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });

      (mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        ilike: mockIlike,
      });
      mockIlike.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        limit: mockLimit,
      });

      await tagService.searchTags(mockSupabase, "test");

      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it("should throw error on database failure", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockIlike = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } });

      (mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        ilike: mockIlike,
      });
      mockIlike.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        limit: mockLimit,
      });

      await expect(tagService.searchTags(mockSupabase, "test")).rejects.toThrow("Failed to search tags.");
    });
  });

  describe("addTagToTour", () => {
    beforeEach(() => {
      vi.spyOn(profileServiceModule.profileService, "updateRecentlyUsedTags").mockResolvedValue(undefined);
    });

    it("should throw ArchiveError when tour is not archived", async () => {
      vi.mocked(tourStatusUtil.isTourArchived).mockResolvedValue(false);

      await expect(tagService.addTagToTour(mockSupabase, "user-123", "tour-123", "summer")).rejects.toThrow(
        ArchiveError
      );
      await expect(tagService.addTagToTour(mockSupabase, "user-123", "tour-123", "summer")).rejects.toThrow(
        "Tags can only be added to archived tours."
      );
    });

    it("should add tag to archived tour successfully", async () => {
      vi.mocked(tourStatusUtil.isTourArchived).mockResolvedValue(true);

      // Mock RPC for get_or_create_tag
      (mockSupabase.rpc as any).mockResolvedValue({ data: 1, error: null });

      // Mock insert
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      // Mock select for fetching the tag
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 1, name: "summer" }, error: null });

      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === "tour_tags") {
          return { insert: mockInsert };
        }
        if (table === "tags") {
          return { select: mockSelect };
        }
        return {};
      });

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      const result = await tagService.addTagToTour(mockSupabase, "user-123", "tour-123", "summer");

      expect(result).toEqual({ id: 1, name: "summer" });
      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_or_create_tag", { tag_name: "summer" });
    });

    it("should return existing tag on unique constraint violation", async () => {
      vi.mocked(tourStatusUtil.isTourArchived).mockResolvedValue(true);

      // Mock RPC for get_or_create_tag
      (mockSupabase.rpc as any).mockResolvedValue({ data: 1, error: null });

      // Mock insert with unique constraint error
      const mockInsert = vi.fn().mockResolvedValue({ error: { code: "23505" } });
      // Mock select for fetching the existing tag
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 1, name: "summer" }, error: null });

      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === "tour_tags") {
          return { insert: mockInsert };
        }
        if (table === "tags") {
          return { select: mockSelect };
        }
        return {};
      });

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      const result = await tagService.addTagToTour(mockSupabase, "user-123", "tour-123", "summer");

      expect(result).toEqual({ id: 1, name: "summer" });
    });

    it("should throw on RLS policy violation", async () => {
      vi.mocked(tourStatusUtil.isTourArchived).mockResolvedValue(true);

      // Mock RPC for get_or_create_tag
      (mockSupabase.rpc as any).mockResolvedValue({ data: 1, error: null });

      // Mock insert with RLS error
      const mockInsert = vi.fn().mockResolvedValue({ error: { code: "42501" } });

      (mockSupabase.from as any).mockReturnValue({ insert: mockInsert });

      await expect(tagService.addTagToTour(mockSupabase, "user-123", "tour-123", "summer")).rejects.toThrow(
        "You don't have permission to add tags to this tour"
      );
    });

    it("should update recently used tags after adding", async () => {
      const updateRecentlyUsedTagsSpy = vi.spyOn(profileServiceModule.profileService, "updateRecentlyUsedTags");
      vi.mocked(tourStatusUtil.isTourArchived).mockResolvedValue(true);

      // Mock RPC for get_or_create_tag
      (mockSupabase.rpc as any).mockResolvedValue({ data: 1, error: null });

      // Mock insert
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      // Mock select for fetching the tag
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 1, name: "summer" }, error: null });

      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === "tour_tags") {
          return { insert: mockInsert };
        }
        if (table === "tags") {
          return { select: mockSelect };
        }
        return {};
      });

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      await tagService.addTagToTour(mockSupabase, "user-123", "tour-123", "summer");

      expect(updateRecentlyUsedTagsSpy).toHaveBeenCalledWith(mockSupabase, "user-123", "summer");
    });
  });

  describe("removeTagFromTour", () => {
    it("should throw ArchiveError when tour is not archived", async () => {
      vi.mocked(tourStatusUtil.isTourArchived).mockResolvedValue(false);

      await expect(tagService.removeTagFromTour(mockSupabase, "tour-123", 1)).rejects.toThrow(ArchiveError);
      await expect(tagService.removeTagFromTour(mockSupabase, "tour-123", 1)).rejects.toThrow(
        "Tags can only be removed from archived tours."
      );
    });

    it("should remove tag from archived tour successfully", async () => {
      vi.mocked(tourStatusUtil.isTourArchived).mockResolvedValue(true);

      const mockDelete = vi.fn().mockReturnThis();
      const mockEqTourId = vi.fn().mockReturnThis();
      const mockEqTagId = vi.fn().mockResolvedValue({ error: null });

      (mockSupabase.from as any).mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEqTourId,
      });
      mockEqTourId.mockReturnValue({
        eq: mockEqTagId,
      });

      await expect(tagService.removeTagFromTour(mockSupabase, "tour-123", 1)).resolves.not.toThrow();
      expect(mockSupabase.from).toHaveBeenCalledWith("tour_tags");
    });

    it("should throw on RLS policy violation", async () => {
      vi.mocked(tourStatusUtil.isTourArchived).mockResolvedValue(true);

      const mockDelete = vi.fn().mockReturnThis();
      const mockEqTourId = vi.fn().mockReturnThis();
      const mockEqTagId = vi.fn().mockResolvedValue({ error: { code: "42501" } });

      (mockSupabase.from as any).mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEqTourId,
      });
      mockEqTourId.mockReturnValue({
        eq: mockEqTagId,
      });

      await expect(tagService.removeTagFromTour(mockSupabase, "tour-123", 1)).rejects.toThrow(
        "You don't have permission to remove tags from this tour"
      );
    });

    it("should throw on generic database error", async () => {
      vi.mocked(tourStatusUtil.isTourArchived).mockResolvedValue(true);

      const mockDelete = vi.fn().mockReturnThis();
      const mockEqTourId = vi.fn().mockReturnThis();
      const mockEqTagId = vi.fn().mockResolvedValue({ error: { message: "DB error" } });

      (mockSupabase.from as any).mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEqTourId,
      });
      mockEqTourId.mockReturnValue({
        eq: mockEqTagId,
      });

      await expect(tagService.removeTagFromTour(mockSupabase, "tour-123", 1)).rejects.toThrow(
        "Failed to remove tag from tour."
      );
    });
  });

  describe("getAllTags", () => {
    it("should return all tags ordered by name", async () => {
      const mockData = [
        { id: 1, name: "adventure" },
        { id: 2, name: "summer" },
        { id: 3, name: "winter" },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });

      (mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        order: mockOrder,
      });

      const result = await tagService.getAllTags(mockSupabase);

      expect(result).toEqual(mockData);
      expect(mockSupabase.from).toHaveBeenCalledWith("tags");
      expect(mockOrder).toHaveBeenCalledWith("name");
    });

    it("should return empty array when no tags exist", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });

      (mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        order: mockOrder,
      });

      const result = await tagService.getAllTags(mockSupabase);

      expect(result).toEqual([]);
    });

    it("should throw error on database failure", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } });

      (mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        order: mockOrder,
      });

      await expect(tagService.getAllTags(mockSupabase)).rejects.toThrow("Failed to fetch tags.");
    });
  });

  describe("ArchiveError", () => {
    it("should have correct name and message", () => {
      const error = new ArchiveError("Test message");
      expect(error.name).toBe("ArchiveError");
      expect(error.message).toBe("Test message");
      expect(error).toBeInstanceOf(Error);
    });
  });
});

