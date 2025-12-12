import { describe, it, expect, vi, beforeEach } from "vitest";
import { participantService } from "./participant.service";
import type { SupabaseClient } from "@/db/supabase.client";

// Mock dependencies
vi.mock("@/lib/server/logger.service", () => ({
  secureError: vi.fn(),
}));

import { secureError } from "@/lib/server/logger.service";

describe("participant.service", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      delete: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      maybeSingle: vi.fn(),
    } as unknown as SupabaseClient;
  });

  describe("removeParticipant", () => {
    const mockTour = {
      id: "tour-1",
      owner_id: "owner-user-id",
    };

    it("should allow participant to remove themselves (leave tour)", async () => {
      // Mock chain: from().select().eq().maybeSingle()
      const mockFetchChain = {
        ...mockSupabase,
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockTour,
          error: null,
        }),
      };
      vi.mocked(mockSupabase.eq).mockReturnValueOnce(mockFetchChain as never);

      // Mock delete chains: from().delete().eq().eq() returns { error: null }
      const mockVoteDeleteChain = {
        ...mockSupabase,
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      const mockParticipantDeleteChain = {
        ...mockSupabase,
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(mockSupabase.eq)
        .mockReturnValueOnce(mockVoteDeleteChain as never) // Vote deletion first eq (returns chain for second eq)
        .mockReturnValueOnce(mockParticipantDeleteChain as never); // Participant deletion first eq

      await participantService.removeParticipant(mockSupabase, "tour-1", "participant-user-id", "participant-user-id");

      expect(mockSupabase.from).toHaveBeenCalledWith("tours");

      // Should delete vote first
      expect(mockSupabase.from).toHaveBeenCalledWith("votes");
      expect(mockSupabase.delete).toHaveBeenCalled();

      // Then delete participant
      expect(mockSupabase.from).toHaveBeenCalledWith("participants");
      expect(mockSupabase.delete).toHaveBeenCalled();
    });

    it("should allow owner to remove another participant", async () => {
      // Mock chain: from().select().eq().maybeSingle()
      const mockFetchChain = {
        ...mockSupabase,
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockTour,
          error: null,
        }),
      };
      vi.mocked(mockSupabase.eq).mockReturnValueOnce(mockFetchChain as never);

      // Mock delete chains: from().delete().eq().eq() returns { error: null }
      const mockVoteDeleteChain = {
        ...mockSupabase,
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      const mockParticipantDeleteChain = {
        ...mockSupabase,
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(mockSupabase.eq)
        .mockReturnValueOnce(mockVoteDeleteChain as never)
        .mockReturnValueOnce(mockParticipantDeleteChain as never);

      await participantService.removeParticipant(mockSupabase, "tour-1", "participant-user-id", "owner-user-id");

      expect(mockSupabase.delete).toHaveBeenCalledTimes(2);
    });

    it("should throw error when owner tries to leave their own tour", async () => {
      vi.mocked(mockSupabase.maybeSingle).mockResolvedValue({
        data: mockTour,
        error: null,
      } as never);

      await expect(
        participantService.removeParticipant(mockSupabase, "tour-1", "owner-user-id", "owner-user-id")
      ).rejects.toThrow("Tour owner cannot leave the tour. Delete the tour instead.");

      expect(mockSupabase.delete).not.toHaveBeenCalled();
    });

    it("should throw error when non-owner tries to remove another participant", async () => {
      vi.mocked(mockSupabase.maybeSingle).mockResolvedValue({
        data: mockTour,
        error: null,
      } as never);

      await expect(
        participantService.removeParticipant(mockSupabase, "tour-1", "other-participant-id", "requesting-user-id")
      ).rejects.toThrow("You are not authorized to remove this participant.");

      expect(mockSupabase.delete).not.toHaveBeenCalled();
    });

    it("should throw error when tour not found", async () => {
      vi.mocked(mockSupabase.maybeSingle).mockResolvedValue({
        data: null,
        error: null,
      } as never);

      await expect(
        participantService.removeParticipant(mockSupabase, "tour-1", "participant-user-id", "participant-user-id")
      ).rejects.toThrow("Tour not found.");

      expect(mockSupabase.delete).not.toHaveBeenCalled();
    });

    it("should throw error when fetching tour fails", async () => {
      vi.mocked(mockSupabase.maybeSingle).mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      } as never);

      await expect(
        participantService.removeParticipant(mockSupabase, "tour-1", "participant-user-id", "participant-user-id")
      ).rejects.toThrow("Failed to fetch tour details.");

      expect(secureError).toHaveBeenCalledWith("Error fetching tour for participant removal", {
        message: "Database error",
      });
    });

    it("should throw error when vote deletion fails", async () => {
      // Mock chain: from().select().eq().maybeSingle()
      const mockFetchChain = {
        ...mockSupabase,
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockTour,
          error: null,
        }),
      };
      vi.mocked(mockSupabase.eq).mockReturnValueOnce(mockFetchChain as never);

      // Mock delete chain: from().delete().eq().eq() returns error
      const mockVoteDeleteChain = {
        ...mockSupabase,
        eq: vi.fn().mockResolvedValue({ error: { message: "Vote delete failed" } }),
      };
      vi.mocked(mockSupabase.eq).mockReturnValueOnce(mockVoteDeleteChain as never);

      await expect(
        participantService.removeParticipant(mockSupabase, "tour-1", "participant-user-id", "participant-user-id")
      ).rejects.toThrow("Failed to remove participant vote from the tour.");

      expect(secureError).toHaveBeenCalledWith("Error removing participant vote from tour", {
        message: "Vote delete failed",
      });
    });

    it("should throw error when participant deletion fails", async () => {
      // Mock chain: from().select().eq().maybeSingle()
      const mockFetchChain = {
        ...mockSupabase,
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockTour,
          error: null,
        }),
      };
      vi.mocked(mockSupabase.eq).mockReturnValueOnce(mockFetchChain as never);

      // Mock delete chains: vote succeeds, participant fails
      const mockVoteDeleteChain = {
        ...mockSupabase,
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      const mockParticipantDeleteChain = {
        ...mockSupabase,
        eq: vi.fn().mockResolvedValue({ error: { message: "Participant delete failed" } }),
      };
      vi.mocked(mockSupabase.eq)
        .mockReturnValueOnce(mockVoteDeleteChain as never)
        .mockReturnValueOnce(mockParticipantDeleteChain as never);

      await expect(
        participantService.removeParticipant(mockSupabase, "tour-1", "participant-user-id", "participant-user-id")
      ).rejects.toThrow("Failed to remove participant from the tour.");

      expect(secureError).toHaveBeenCalledWith("Error removing participant from tour", {
        message: "Participant delete failed",
      });
    });

    it("should delete vote even if participant has no vote", async () => {
      // Mock chain: from().select().eq().maybeSingle()
      const mockFetchChain = {
        ...mockSupabase,
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockTour,
          error: null,
        }),
      };
      vi.mocked(mockSupabase.eq).mockReturnValueOnce(mockFetchChain as never);

      // Vote deletion succeeds even with no vote (no rows affected is not an error)
      const mockVoteDeleteChain = {
        ...mockSupabase,
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      const mockParticipantDeleteChain = {
        ...mockSupabase,
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(mockSupabase.eq)
        .mockReturnValueOnce(mockVoteDeleteChain as never)
        .mockReturnValueOnce(mockParticipantDeleteChain as never);

      await participantService.removeParticipant(mockSupabase, "tour-1", "participant-user-id", "participant-user-id");

      expect(mockSupabase.delete).toHaveBeenCalledTimes(2);
    });
  });
});
