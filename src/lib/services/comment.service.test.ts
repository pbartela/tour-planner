import { describe, it, expect, vi, beforeEach } from "vitest";
import { commentService } from "./comment.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateCommentCommand, UpdateCommentCommand } from "@/types";

// Mock dependencies
vi.mock("@/lib/server/logger.service", () => ({
  secureError: vi.fn(),
}));

vi.mock("@/lib/utils/tour-status.util", () => ({
  ensureTourNotArchived: vi.fn(),
}));

import { secureError } from "@/lib/server/logger.service";
import { ensureTourNotArchived } from "@/lib/utils/tour-status.util";

describe("comment.service", () => {
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
      order: vi.fn(() => mockSupabase),
      range: vi.fn(() => mockSupabase),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    } as unknown as SupabaseClient;
  });

  describe("listCommentsForTour", () => {
    const mockComments = [
      {
        id: "comment-1",
        tour_id: "tour-1",
        user_id: "user-1",
        content: "Great tour!",
        created_at: "2025-01-15T10:00:00Z",
        updated_at: "2025-01-15T10:00:00Z",
        profiles: {
          id: "user-1",
          display_name: "John Doe",
          email: "john@example.com",
        },
      },
      {
        id: "comment-2",
        tour_id: "tour-1",
        user_id: "user-2",
        content: "Looking forward to this!",
        created_at: "2025-01-15T11:00:00Z",
        updated_at: "2025-01-15T11:00:00Z",
        profiles: {
          id: "user-2",
          display_name: null,
          email: "jane@example.com",
        },
      },
    ];

    it("should list comments with pagination", async () => {
      vi.mocked(mockSupabase.range).mockResolvedValue({
        data: mockComments,
        error: null,
        count: 10,
      } as never);

      const result = await commentService.listCommentsForTour(mockSupabase, "tour-1", {
        page: 1,
        limit: 10,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("comments");
      expect(mockSupabase.eq).toHaveBeenCalledWith("tour_id", "tour-1");
      expect(mockSupabase.order).toHaveBeenCalledWith("created_at", { ascending: true });
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 9);
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 10,
      });
    });

    it("should transform comments with display_name (email hidden)", async () => {
      vi.mocked(mockSupabase.range).mockResolvedValue({
        data: [mockComments[0]],
        error: null,
        count: 1,
      } as never);

      const result = await commentService.listCommentsForTour(mockSupabase, "tour-1", {
        page: 1,
        limit: 10,
      });

      expect(result.data[0]).toEqual({
        id: "comment-1",
        tour_id: "tour-1",
        user_id: "user-1",
        content: "Great tour!",
        created_at: "2025-01-15T10:00:00Z",
        updated_at: "2025-01-15T10:00:00Z",
        display_name: "John Doe",
        user_email: null, // Email hidden when display_name is set
      });
    });

    it("should show email as fallback when display_name is null", async () => {
      vi.mocked(mockSupabase.range).mockResolvedValue({
        data: [mockComments[1]],
        error: null,
        count: 1,
      } as never);

      const result = await commentService.listCommentsForTour(mockSupabase, "tour-1", {
        page: 1,
        limit: 10,
      });

      expect(result.data[0]).toEqual({
        id: "comment-2",
        tour_id: "tour-1",
        user_id: "user-2",
        content: "Looking forward to this!",
        created_at: "2025-01-15T11:00:00Z",
        updated_at: "2025-01-15T11:00:00Z",
        display_name: null,
        user_email: "jane@example.com", // Email shown when display_name is null
      });
    });

    it("should handle profiles as array (Supabase quirk)", async () => {
      const commentWithArrayProfile = {
        ...mockComments[0],
        profiles: [mockComments[0].profiles], // Wrapped in array
      };

      vi.mocked(mockSupabase.range).mockResolvedValue({
        data: [commentWithArrayProfile],
        error: null,
        count: 1,
      } as never);

      const result = await commentService.listCommentsForTour(mockSupabase, "tour-1", {
        page: 1,
        limit: 10,
      });

      expect(result.data[0].display_name).toBe("John Doe");
    });

    it("should calculate correct pagination range for page 2", async () => {
      vi.mocked(mockSupabase.range).mockResolvedValue({
        data: [],
        error: null,
        count: 25,
      } as never);

      await commentService.listCommentsForTour(mockSupabase, "tour-1", {
        page: 2,
        limit: 10,
      });

      expect(mockSupabase.range).toHaveBeenCalledWith(10, 19);
    });

    it("should handle empty results", async () => {
      vi.mocked(mockSupabase.range).mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      } as never);

      const result = await commentService.listCommentsForTour(mockSupabase, "tour-1", {
        page: 1,
        limit: 10,
      });

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it("should throw error when database query fails", async () => {
      vi.mocked(mockSupabase.range).mockResolvedValue({
        data: null,
        error: { message: "Database error" },
        count: null,
      } as never);

      await expect(
        commentService.listCommentsForTour(mockSupabase, "tour-1", {
          page: 1,
          limit: 10,
        })
      ).rejects.toThrow("Failed to fetch comments from the database.");

      expect(secureError).toHaveBeenCalledWith("Error fetching comments from database", {
        message: "Database error",
      });
    });

    it("should handle null count gracefully", async () => {
      vi.mocked(mockSupabase.range).mockResolvedValue({
        data: mockComments,
        error: null,
        count: null,
      } as never);

      const result = await commentService.listCommentsForTour(mockSupabase, "tour-1", {
        page: 1,
        limit: 10,
      });

      expect(result.pagination.total).toBe(0);
    });
  });

  describe("createComment", () => {
    const mockProfile = {
      id: "user-1",
      display_name: "John Doe",
      email: "john@example.com",
    };

    const mockCreatedComment = {
      id: "new-comment-1",
      tour_id: "tour-1",
      user_id: "user-1",
      content: "New comment",
      created_at: "2025-01-15T12:00:00Z",
      updated_at: "2025-01-15T12:00:00Z",
      profiles: mockProfile,
    };

    it("should create a comment successfully", async () => {
      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: mockCreatedComment,
        error: null,
      } as never);

      const command: CreateCommentCommand = {
        content: "New comment",
      };

      const result = await commentService.createComment(mockSupabase, "user-1", "tour-1", command);

      expect(ensureTourNotArchived).toHaveBeenCalledWith(mockSupabase, "tour-1");
      expect(mockSupabase.from).toHaveBeenCalledWith("comments");
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        tour_id: "tour-1",
        user_id: "user-1",
        content: "New comment",
      });
      expect(result).toEqual({
        id: "new-comment-1",
        tour_id: "tour-1",
        user_id: "user-1",
        content: "New comment",
        created_at: "2025-01-15T12:00:00Z",
        updated_at: "2025-01-15T12:00:00Z",
        display_name: "John Doe",
        user_email: null, // Hidden when display_name is set
      });
    });

    it("should show email when display_name is null", async () => {
      const commentWithoutDisplayName = {
        ...mockCreatedComment,
        profiles: {
          ...mockProfile,
          display_name: null,
        },
      };

      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: commentWithoutDisplayName,
        error: null,
      } as never);

      const command: CreateCommentCommand = {
        content: "New comment",
      };

      const result = await commentService.createComment(mockSupabase, "user-1", "tour-1", command);

      expect(result.display_name).toBe(null);
      expect(result.user_email).toBe("john@example.com");
    });

    it("should throw error when tour is archived", async () => {
      vi.mocked(ensureTourNotArchived).mockRejectedValue(new Error("Tour is archived"));

      const command: CreateCommentCommand = {
        content: "New comment",
      };

      await expect(commentService.createComment(mockSupabase, "user-1", "tour-1", command)).rejects.toThrow(
        "Tour is archived"
      );

      expect(mockSupabase.insert).not.toHaveBeenCalled();
    });

    it("should throw error when insert fails", async () => {
      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      } as never);

      const command: CreateCommentCommand = {
        content: "New comment",
      };

      await expect(commentService.createComment(mockSupabase, "user-1", "tour-1", command)).rejects.toThrow(
        "Failed to create comment in the database."
      );

      expect(secureError).toHaveBeenCalledWith("Error creating comment", { message: "Insert failed" });
    });

    it("should throw error when created comment is not returned", async () => {
      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: null,
        error: null,
      } as never);

      const command: CreateCommentCommand = {
        content: "New comment",
      };

      await expect(commentService.createComment(mockSupabase, "user-1", "tour-1", command)).rejects.toThrow(
        "Failed to retrieve created comment."
      );
    });
  });

  describe("updateComment", () => {
    const mockProfile = {
      id: "user-1",
      display_name: "John Doe",
      email: "john@example.com",
    };

    const mockUpdatedComment = {
      id: "comment-1",
      tour_id: "tour-1",
      user_id: "user-1",
      content: "Updated content",
      created_at: "2025-01-15T10:00:00Z",
      updated_at: "2025-01-15T12:00:00Z",
      profiles: mockProfile,
    };

    it("should update a comment successfully", async () => {
      // Mock fetching existing comment
      vi.mocked(mockSupabase.single)
        .mockResolvedValueOnce({
          data: { tour_id: "tour-1" },
          error: null,
        } as never)
        .mockResolvedValueOnce({
          data: mockUpdatedComment,
          error: null,
        } as never);

      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      const command: UpdateCommentCommand = {
        content: "Updated content",
      };

      const result = await commentService.updateComment(mockSupabase, "comment-1", command);

      expect(mockSupabase.from).toHaveBeenCalledWith("comments");
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "comment-1");
      expect(ensureTourNotArchived).toHaveBeenCalledWith(mockSupabase, "tour-1");
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "Updated content",
        })
      );
      expect(result.content).toBe("Updated content");
    });

    it("should throw error when comment not found", async () => {
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      } as never);

      const command: UpdateCommentCommand = {
        content: "Updated content",
      };

      await expect(commentService.updateComment(mockSupabase, "comment-1", command)).rejects.toThrow(
        "Comment not found or you may not have permission."
      );

      expect(secureError).toHaveBeenCalledWith("Error fetching comment for update", { message: "Not found" });
    });

    it("should throw error when tour is archived", async () => {
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: { tour_id: "tour-1" },
        error: null,
      } as never);

      vi.mocked(ensureTourNotArchived).mockRejectedValue(new Error("Tour is archived"));

      const command: UpdateCommentCommand = {
        content: "Updated content",
      };

      await expect(commentService.updateComment(mockSupabase, "comment-1", command)).rejects.toThrow(
        "Tour is archived"
      );

      expect(mockSupabase.update).not.toHaveBeenCalled();
    });

    it("should throw error when update fails", async () => {
      vi.mocked(mockSupabase.single)
        .mockResolvedValueOnce({
          data: { tour_id: "tour-1" },
          error: null,
        } as never)
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Update failed" },
        } as never);

      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      const command: UpdateCommentCommand = {
        content: "Updated content",
      };

      await expect(commentService.updateComment(mockSupabase, "comment-1", command)).rejects.toThrow(
        "Failed to update comment. It may not exist or you may not have permission."
      );

      expect(secureError).toHaveBeenCalledWith("Error updating comment", { message: "Update failed" });
    });

    it("should throw error when updated comment is not returned", async () => {
      vi.mocked(mockSupabase.single)
        .mockResolvedValueOnce({
          data: { tour_id: "tour-1" },
          error: null,
        } as never)
        .mockResolvedValueOnce({
          data: null,
          error: null,
        } as never);

      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      const command: UpdateCommentCommand = {
        content: "Updated content",
      };

      await expect(commentService.updateComment(mockSupabase, "comment-1", command)).rejects.toThrow(
        "Failed to retrieve updated comment."
      );
    });
  });

  describe("deleteComment", () => {
    it("should delete a comment successfully", async () => {
      // First chain: from().select().eq().single()
      const mockFetchChain = {
        ...mockSupabase,
        single: vi.fn().mockResolvedValue({
          data: { tour_id: "tour-1" },
          error: null,
        }),
      };
      vi.mocked(mockSupabase.eq).mockReturnValueOnce(mockFetchChain as never);

      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      // Second chain: from().delete().eq() returns { error: null }
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({ error: null } as never);

      await commentService.deleteComment(mockSupabase, "comment-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("comments");
      expect(ensureTourNotArchived).toHaveBeenCalledWith(mockSupabase, "tour-1");
      expect(mockSupabase.delete).toHaveBeenCalled();
    });

    it("should throw error when comment not found", async () => {
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      } as never);

      await expect(commentService.deleteComment(mockSupabase, "comment-1")).rejects.toThrow(
        "Comment not found or you may not have permission."
      );

      expect(secureError).toHaveBeenCalledWith("Error fetching comment for deletion", { message: "Not found" });
    });

    it("should throw error when tour is archived", async () => {
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: { tour_id: "tour-1" },
        error: null,
      } as never);

      vi.mocked(ensureTourNotArchived).mockRejectedValue(new Error("Tour is archived"));

      await expect(commentService.deleteComment(mockSupabase, "comment-1")).rejects.toThrow("Tour is archived");

      expect(mockSupabase.delete).not.toHaveBeenCalled();
    });

    it("should throw error when delete fails", async () => {
      // First chain: from().select().eq().single()
      const mockFetchChain = {
        ...mockSupabase,
        single: vi.fn().mockResolvedValue({
          data: { tour_id: "tour-1" },
          error: null,
        }),
      };
      vi.mocked(mockSupabase.eq).mockReturnValueOnce(mockFetchChain as never);

      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      // Second chain: from().delete().eq() returns error
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({
        error: { message: "Delete failed" },
      } as never);

      await expect(commentService.deleteComment(mockSupabase, "comment-1")).rejects.toThrow(
        "Failed to delete comment. It may not exist or you may not have permission."
      );

      expect(secureError).toHaveBeenCalledWith("Error deleting comment", { message: "Delete failed" });
    });
  });
});
