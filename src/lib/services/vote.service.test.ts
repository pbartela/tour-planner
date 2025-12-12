import { describe, it, expect, vi, beforeEach } from "vitest";
import { voteService } from "./vote.service";
import type { SupabaseClient } from "@/db/supabase.client";

// Mock dependencies
vi.mock("@/lib/server/logger.service", () => ({
  secureError: vi.fn(),
}));

vi.mock("@/lib/utils/tour-status.util", () => ({
  ensureTourNotArchived: vi.fn(),
}));

import { secureError } from "@/lib/server/logger.service";
import { ensureTourNotArchived } from "@/lib/utils/tour-status.util";

describe("vote.service", () => {
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
      maybeSingle: vi.fn(),
    } as unknown as SupabaseClient;
  });

  describe("getTourVotes", () => {
    it("should get votes with count and user IDs", async () => {
      const mockVotes = [{ user_id: "user-1" }, { user_id: "user-2" }, { user_id: "user-3" }];

      // Mock chain: from().select().eq() returns { data, error }
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: mockVotes,
        error: null,
      } as never);

      const result = await voteService.getTourVotes(mockSupabase, "tour-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("votes");
      expect(mockSupabase.select).toHaveBeenCalledWith("user_id");
      expect(mockSupabase.eq).toHaveBeenCalledWith("tour_id", "tour-1");
      expect(result).toEqual({
        count: 3,
        users: ["user-1", "user-2", "user-3"],
      });
    });

    it("should handle tour with no votes", async () => {
      // Mock chain: from().select().eq() returns { data, error }
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: [],
        error: null,
      } as never);

      const result = await voteService.getTourVotes(mockSupabase, "tour-1");

      expect(result).toEqual({
        count: 0,
        users: [],
      });
    });

    it("should handle null data gracefully", async () => {
      // Mock chain: from().select().eq() returns { data, error }
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      } as never);

      const result = await voteService.getTourVotes(mockSupabase, "tour-1");

      expect(result).toEqual({
        count: 0,
        users: [],
      });
    });

    it("should throw error when database query fails", async () => {
      // Mock chain: from().select().eq() returns { data, error }
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      } as never);

      await expect(voteService.getTourVotes(mockSupabase, "tour-1")).rejects.toThrow(
        "Failed to fetch votes from the database."
      );

      expect(secureError).toHaveBeenCalledWith("Error fetching votes from database", { message: "Database error" });
    });
  });

  describe("toggleVote", () => {
    it("should add vote when user has not voted", async () => {
      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      // Mock chain: from().select().eq().eq().maybeSingle()
      const mockCheckChain2 = {
        ...mockSupabase,
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      const mockCheckChain1 = {
        ...mockSupabase,
        eq: vi.fn().mockReturnValue(mockCheckChain2),
      };
      vi.mocked(mockSupabase.eq).mockReturnValueOnce(mockCheckChain1 as never);

      // Insert succeeds: insert() returns { error: null }
      vi.mocked(mockSupabase.insert).mockResolvedValue({
        error: null,
      } as never);

      // Tour update succeeds: update().eq() returns { error: null }
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({
        error: null,
      } as never);

      const result = await voteService.toggleVote(mockSupabase, "user-1", "tour-1");

      expect(ensureTourNotArchived).toHaveBeenCalledWith(mockSupabase, "tour-1");
      expect(mockSupabase.from).toHaveBeenCalledWith("votes");
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        tour_id: "tour-1",
        user_id: "user-1",
      });
      expect(result).toEqual({ message: "Vote added" });

      // Should update tour timestamp
      expect(mockSupabase.from).toHaveBeenCalledWith("tours");
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updated_at: expect.any(String),
        })
      );
    });

    it("should remove vote when user has already voted", async () => {
      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      // Mock chain: from().select().eq().eq().maybeSingle()
      const mockCheckChain2 = {
        ...mockSupabase,
        maybeSingle: vi.fn().mockResolvedValue({
          data: { tour_id: "tour-1", user_id: "user-1" },
          error: null,
        }),
      };
      const mockCheckChain1 = {
        ...mockSupabase,
        eq: vi.fn().mockReturnValue(mockCheckChain2),
      };
      vi.mocked(mockSupabase.eq).mockReturnValueOnce(mockCheckChain1 as never);

      // Delete succeeds: delete().eq().eq() returns { error: null }
      const mockDeleteChain = {
        ...mockSupabase,
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(mockSupabase.eq).mockReturnValueOnce(mockDeleteChain as never);

      // Tour update: update().eq() returns { error: null }
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({ error: null } as never);

      const result = await voteService.toggleVote(mockSupabase, "user-1", "tour-1");

      expect(ensureTourNotArchived).toHaveBeenCalledWith(mockSupabase, "tour-1");
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(result).toEqual({ message: "Vote removed" });

      // Should update tour timestamp
      expect(mockSupabase.from).toHaveBeenCalledWith("tours");
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it("should throw error when tour is archived (adding vote)", async () => {
      vi.mocked(ensureTourNotArchived).mockRejectedValue(new Error("Tour is archived"));

      await expect(voteService.toggleVote(mockSupabase, "user-1", "tour-1")).rejects.toThrow("Tour is archived");

      expect(mockSupabase.insert).not.toHaveBeenCalled();
      expect(mockSupabase.delete).not.toHaveBeenCalled();
    });

    it("should throw error when checking existing vote fails", async () => {
      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      vi.mocked(mockSupabase.maybeSingle).mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      } as never);

      await expect(voteService.toggleVote(mockSupabase, "user-1", "tour-1")).rejects.toThrow(
        "Failed to check vote status."
      );

      expect(secureError).toHaveBeenCalledWith("Error checking existing vote", { message: "Database error" });
    });

    it("should throw error when adding vote fails", async () => {
      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      vi.mocked(mockSupabase.maybeSingle).mockResolvedValue({
        data: null,
        error: null,
      } as never);

      // Insert fails: insert() returns { error }
      vi.mocked(mockSupabase.insert).mockResolvedValue({
        error: { message: "Insert failed" },
      } as never);

      await expect(voteService.toggleVote(mockSupabase, "user-1", "tour-1")).rejects.toThrow(
        "Failed to add vote. Voting may be hidden or you may not have permission."
      );

      expect(secureError).toHaveBeenCalledWith("Error adding vote", { message: "Insert failed" });
    });

    it("should throw error when removing vote fails", async () => {
      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      // Mock chain: from().select().eq().eq().maybeSingle()
      const mockCheckChain2 = {
        ...mockSupabase,
        maybeSingle: vi.fn().mockResolvedValue({
          data: { tour_id: "tour-1", user_id: "user-1" },
          error: null,
        }),
      };
      const mockCheckChain1 = {
        ...mockSupabase,
        eq: vi.fn().mockReturnValue(mockCheckChain2),
      };
      vi.mocked(mockSupabase.eq).mockReturnValueOnce(mockCheckChain1 as never);

      // Delete fails: delete().eq().eq() returns { error }
      const mockDeleteChain = {
        ...mockSupabase,
        eq: vi.fn().mockResolvedValue({ error: { message: "Delete failed" } }),
      };
      vi.mocked(mockSupabase.eq).mockReturnValueOnce(mockDeleteChain as never);

      await expect(voteService.toggleVote(mockSupabase, "user-1", "tour-1")).rejects.toThrow(
        "Failed to remove vote. Voting may be hidden or you may not have permission."
      );

      expect(secureError).toHaveBeenCalledWith("Error removing vote", { message: "Delete failed" });
    });

    it("should not throw when tour timestamp update fails after adding vote", async () => {
      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      // Mock chain: from().select().eq().eq().maybeSingle()
      const mockCheckChain2 = {
        ...mockSupabase,
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      const mockCheckChain1 = {
        ...mockSupabase,
        eq: vi.fn().mockReturnValue(mockCheckChain2),
      };
      vi.mocked(mockSupabase.eq).mockReturnValueOnce(mockCheckChain1 as never);

      vi.mocked(mockSupabase.insert).mockResolvedValue({
        error: null,
      } as never);

      // Tour update fails (non-critical): update().eq() returns { error }
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({
        error: { message: "Update failed" },
      } as never);

      const result = await voteService.toggleVote(mockSupabase, "user-1", "tour-1");

      expect(result).toEqual({ message: "Vote added" });
      expect(secureError).toHaveBeenCalledWith("Error updating tour timestamp after vote addition", {
        message: "Update failed",
      });
    });

    it("should not throw when tour timestamp update fails after removing vote", async () => {
      vi.mocked(ensureTourNotArchived).mockResolvedValue(undefined);

      // Mock chain: from().select().eq().eq().maybeSingle()
      const mockCheckChain2 = {
        ...mockSupabase,
        maybeSingle: vi.fn().mockResolvedValue({
          data: { tour_id: "tour-1", user_id: "user-1" },
          error: null,
        }),
      };
      const mockCheckChain1 = {
        ...mockSupabase,
        eq: vi.fn().mockReturnValue(mockCheckChain2),
      };
      vi.mocked(mockSupabase.eq).mockReturnValueOnce(mockCheckChain1 as never);

      // Delete succeeds: delete().eq().eq() returns { error: null }
      const mockDeleteChain = {
        ...mockSupabase,
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(mockSupabase.eq).mockReturnValueOnce(mockDeleteChain as never);

      // Tour update fails (non-critical)
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({ error: { message: "Update failed" } } as never);

      const result = await voteService.toggleVote(mockSupabase, "user-1", "tour-1");

      expect(result).toEqual({ message: "Vote removed" });
      expect(secureError).toHaveBeenCalledWith("Error updating tour timestamp after vote removal", {
        message: "Update failed",
      });
    });
  });
});
