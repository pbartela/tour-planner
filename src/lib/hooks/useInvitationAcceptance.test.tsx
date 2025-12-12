import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useInvitationAcceptance } from "./useInvitationAcceptance";
import type { InvitationByTokenDto } from "@/types";

// Mock all dependencies
vi.mock("astro:transitions/client", () => ({
  navigate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/client/api-client", () => ({
  get: vi.fn(),
  handleApiResponse: vi.fn(),
}));

vi.mock("./useInvitationMutations", () => ({
  useAcceptInvitationMutation: vi.fn(),
  useDeclineInvitationMutation: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "en-US",
      changeLanguage: vi.fn(),
    },
  }),
}));

// Import mocked modules
import { navigate } from "astro:transitions/client";
import toast from "react-hot-toast";
import * as apiClient from "@/lib/client/api-client";
import { useAcceptInvitationMutation, useDeclineInvitationMutation } from "./useInvitationMutations";

describe("useInvitationAcceptance", () => {
  // Mock mutation functions
  const mockAcceptMutateAsync = vi.fn();
  const mockDeclineMutateAsync = vi.fn();

  // Mock invitation data
  const createMockInvitation = (overrides: Partial<InvitationByTokenDto> = {}): InvitationByTokenDto => ({
    id: "invitation-123",
    tour_id: "tour-456",
    tour_title: "Summer Vacation 2025",
    inviter_email: "inviter@example.com",
    inviter_display_name: "John Doe",
    email: "invitee@example.com",
    status: "pending",
    expires_at: "2025-12-31T23:59:59Z",
    is_expired: false,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mutation mocks
    vi.mocked(useAcceptInvitationMutation).mockReturnValue({
      mutateAsync: mockAcceptMutateAsync,
      isPending: false,
    } as any);

    vi.mocked(useDeclineInvitationMutation).mockReturnValue({
      mutateAsync: mockDeclineMutateAsync,
      isPending: false,
    } as any);

    // Default: successful API response
    vi.mocked(apiClient.get).mockResolvedValue({});
    vi.mocked(apiClient.handleApiResponse).mockResolvedValue(createMockInvitation());
  });

  describe("initial state and fetch", () => {
    it("should start in loading state", () => {
      // Mock get to never resolve so useEffect doesn't update state
      vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "user@example.com"));

      expect(result.current.state.status).toBe("loading");
    });

    it("should fetch invitation on mount", async () => {
      const mockInvitation = createMockInvitation();
      vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

      renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          "/api/invitations?token=test-token",
          expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
      });
    });

    it("should transition to success state with valid invitation", async () => {
      const mockInvitation = createMockInvitation({
        email: "invitee@example.com",
        status: "pending",
        is_expired: false,
      });
      vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("success");
      });

      if (result.current.state.status === "success") {
        expect(result.current.state.invitation).toEqual(mockInvitation);
      }
    });

    it("should handle API errors", async () => {
      const errorMessage = "Failed to fetch invitation";
      vi.mocked(apiClient.handleApiResponse).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "user@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("error");
      });

      if (result.current.state.status === "error") {
        expect(result.current.state.error).toBe(errorMessage);
      }
    });

    it("should handle non-Error exceptions", async () => {
      vi.mocked(apiClient.handleApiResponse).mockRejectedValue("String error");

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "user@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("error");
      });

      if (result.current.state.status === "error") {
        expect(result.current.state.error).toBe("Failed to fetch invitation");
      }
    });

    it("should encode token in URL", async () => {
      const specialToken = "token+with/special=chars";
      renderHook(() => useInvitationAcceptance(specialToken, "user@example.com"));

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          `/api/invitations?token=${encodeURIComponent(specialToken)}`,
          expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
      });
    });

    it("should fetch successfully even for expired invitation", async () => {
      const mockInvitation = createMockInvitation({
        is_expired: true,
        status: "pending",
      });
      vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("success");
      });
    });

    it("should fetch successfully even for already accepted invitation", async () => {
      const mockInvitation = createMockInvitation({
        status: "accepted",
        is_expired: false,
      });
      vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("success");
      });
    });

    it("should fetch successfully even for already declined invitation", async () => {
      const mockInvitation = createMockInvitation({
        status: "declined",
        is_expired: false,
      });
      vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("success");
      });
    });

    it("should fetch successfully even for email mismatch", async () => {
      const mockInvitation = createMockInvitation({
        email: "different@example.com",
        status: "pending",
        is_expired: false,
      });
      vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "user@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("success");
      });
    });
  });

  describe("handleAccept", () => {
    it("should accept invitation successfully", async () => {
      const mockInvitation = createMockInvitation({
        email: "invitee@example.com",
        status: "pending",
        is_expired: false,
      });
      vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);
      mockAcceptMutateAsync.mockResolvedValue({ tour_id: mockInvitation.tour_id });

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("success");
      });

      // Call handleAccept
      await act(async () => {
        await result.current.actions.handleAccept();
      });

      // Verify mutation was called with correct params
      expect(mockAcceptMutateAsync).toHaveBeenCalledWith({
        invitationId: mockInvitation.id,
        token: "test-token",
      });

      // Verify success toast
      expect(toast.success).toHaveBeenCalledWith("Invitation accepted successfully");

      // Verify navigation
      expect(navigate).toHaveBeenCalledWith(`/en-US/tours/${mockInvitation.tour_id}`);

      // Verify state changed to navigating
      await waitFor(() => {
        expect(result.current.state.status).toBe("navigating");
      });
    });

    it("should handle expired invitation (no token)", async () => {
      const mockInvitation = createMockInvitation({
        email: "invitee@example.com",
        status: "pending",
        is_expired: true,
      });
      vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);
      mockAcceptMutateAsync.mockResolvedValue({ tour_id: mockInvitation.tour_id });

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("success");
      });

      await act(async () => {
        await result.current.actions.handleAccept();
      });

      // Verify mutation was called without token for expired invitation
      expect(mockAcceptMutateAsync).toHaveBeenCalledWith({
        invitationId: mockInvitation.id,
        token: undefined,
      });
    });

    it("should handle mutation error", async () => {
      const mockInvitation = createMockInvitation({
        email: "invitee@example.com",
        status: "pending",
        is_expired: false,
      });
      vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

      const errorMessage = "Invitation already accepted";
      mockAcceptMutateAsync.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("success");
      });

      await result.current.actions.handleAccept();

      // Verify error toast
      expect(toast.error).toHaveBeenCalledWith(errorMessage);

      // Verify navigation was NOT called
      expect(navigate).not.toHaveBeenCalled();

      // State should still be success (not navigating)
      expect(result.current.state.status).toBe("success");
    });

    it("should handle non-Error mutation exception", async () => {
      const mockInvitation = createMockInvitation({
        email: "invitee@example.com",
        status: "pending",
        is_expired: false,
      });
      vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);
      mockAcceptMutateAsync.mockRejectedValue("String error");

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("success");
      });

      await result.current.actions.handleAccept();

      expect(toast.error).toHaveBeenCalledWith("Failed to accept invitation");
    });

    it("should do nothing if state is not success", async () => {
      // Start with error state
      vi.mocked(apiClient.handleApiResponse).mockRejectedValue(new Error("API error"));

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "user@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("error");
      });

      await result.current.actions.handleAccept();

      // Verify mutation was NOT called
      expect(mockAcceptMutateAsync).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe("handleDecline", () => {
    it("should decline invitation successfully", async () => {
      const mockInvitation = createMockInvitation({
        email: "invitee@example.com",
        status: "pending",
        is_expired: false,
      });
      vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);
      mockDeclineMutateAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("success");
      });

      await act(async () => {
        await result.current.actions.handleDecline();
      });

      // Verify mutation was called with correct params
      expect(mockDeclineMutateAsync).toHaveBeenCalledWith({
        invitationId: mockInvitation.id,
        token: "test-token",
      });

      // Verify success toast
      expect(toast.success).toHaveBeenCalledWith("Invitation declined");

      // Verify navigation to home
      expect(navigate).toHaveBeenCalledWith("/en-US/");

      // Verify state changed to navigating
      await waitFor(() => {
        expect(result.current.state.status).toBe("navigating");
      });
    });

    it("should handle expired invitation (no token)", async () => {
      const mockInvitation = createMockInvitation({
        email: "invitee@example.com",
        status: "pending",
        is_expired: true,
      });
      vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);
      mockDeclineMutateAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("success");
      });

      await act(async () => {
        await result.current.actions.handleDecline();
      });

      // Verify mutation was called without token for expired invitation
      expect(mockDeclineMutateAsync).toHaveBeenCalledWith({
        invitationId: mockInvitation.id,
        token: undefined,
      });
    });

    it("should handle mutation error", async () => {
      const mockInvitation = createMockInvitation({
        email: "invitee@example.com",
        status: "pending",
        is_expired: false,
      });
      vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

      const errorMessage = "Database error";
      mockDeclineMutateAsync.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("success");
      });

      await result.current.actions.handleDecline();

      // Verify error toast
      expect(toast.error).toHaveBeenCalledWith(errorMessage);

      // Verify navigation was NOT called
      expect(navigate).not.toHaveBeenCalled();

      // State should still be success (not navigating)
      expect(result.current.state.status).toBe("success");
    });

    it("should handle non-Error mutation exception", async () => {
      const mockInvitation = createMockInvitation({
        email: "invitee@example.com",
        status: "pending",
        is_expired: false,
      });
      vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);
      mockDeclineMutateAsync.mockRejectedValue("String error");

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("success");
      });

      await result.current.actions.handleDecline();

      expect(toast.error).toHaveBeenCalledWith("Failed to decline invitation");
    });

    it("should do nothing if state is not success", async () => {
      vi.mocked(apiClient.handleApiResponse).mockRejectedValue(new Error("API error"));

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "user@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("error");
      });

      await result.current.actions.handleDecline();

      expect(mockDeclineMutateAsync).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe("handleGoHome", () => {
    it("should navigate to home page", async () => {
      const mockInvitation = createMockInvitation();
      vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("success");
      });

      await act(async () => {
        await result.current.actions.handleGoHome();
      });

      expect(navigate).toHaveBeenCalledWith("/en-US/");

      await waitFor(() => {
        expect(result.current.state.status).toBe("navigating");
      });
    });

    it("should work from any state", async () => {
      vi.mocked(apiClient.handleApiResponse).mockRejectedValue(new Error("API error"));

      const { result } = renderHook(() => useInvitationAcceptance("test-token", "user@example.com"));

      await waitFor(() => {
        expect(result.current.state.status).toBe("error");
      });

      await act(async () => {
        await result.current.actions.handleGoHome();
      });

      expect(navigate).toHaveBeenCalledWith("/en-US/");
    });
  });

  describe("derived state", () => {
    describe("isEmailMatch", () => {
      it("should return true for matching emails (case-insensitive)", async () => {
        const mockInvitation = createMockInvitation({
          email: "InViTeE@ExAmPlE.com",
        });
        vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

        const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

        await waitFor(() => {
          expect(result.current.state.status).toBe("success");
        });

        expect(result.current.isEmailMatch).toBe(true);
      });

      it("should return false for non-matching emails", async () => {
        const mockInvitation = createMockInvitation({
          email: "other@example.com",
        });
        vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

        const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

        await waitFor(() => {
          expect(result.current.state.status).toBe("success");
        });

        expect(result.current.isEmailMatch).toBe(false);
      });

      it("should return false when state is not success", async () => {
        vi.mocked(apiClient.handleApiResponse).mockRejectedValue(new Error("API error"));

        const { result } = renderHook(() => useInvitationAcceptance("test-token", "user@example.com"));

        await waitFor(() => {
          expect(result.current.state.status).toBe("error");
        });

        expect(result.current.isEmailMatch).toBe(false);
      });
    });

    describe("isExpiredOrProcessed", () => {
      it("should return true for expired invitation", async () => {
        const mockInvitation = createMockInvitation({
          is_expired: true,
          status: "pending",
        });
        vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

        const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

        await waitFor(() => {
          expect(result.current.state.status).toBe("success");
        });

        expect(result.current.isExpiredOrProcessed).toBe(true);
      });

      it("should return true for accepted invitation", async () => {
        const mockInvitation = createMockInvitation({
          is_expired: false,
          status: "accepted",
        });
        vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

        const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

        await waitFor(() => {
          expect(result.current.state.status).toBe("success");
        });

        expect(result.current.isExpiredOrProcessed).toBe(true);
      });

      it("should return true for declined invitation", async () => {
        const mockInvitation = createMockInvitation({
          is_expired: false,
          status: "declined",
        });
        vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

        const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

        await waitFor(() => {
          expect(result.current.state.status).toBe("success");
        });

        expect(result.current.isExpiredOrProcessed).toBe(true);
      });

      it("should return false for pending, non-expired invitation", async () => {
        const mockInvitation = createMockInvitation({
          is_expired: false,
          status: "pending",
        });
        vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

        const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

        await waitFor(() => {
          expect(result.current.state.status).toBe("success");
        });

        expect(result.current.isExpiredOrProcessed).toBe(false);
      });

      it("should return false when state is not success", async () => {
        vi.mocked(apiClient.handleApiResponse).mockRejectedValue(new Error("API error"));

        const { result } = renderHook(() => useInvitationAcceptance("test-token", "user@example.com"));

        await waitFor(() => {
          expect(result.current.state.status).toBe("error");
        });

        expect(result.current.isExpiredOrProcessed).toBe(false);
      });
    });

    describe("isProcessing", () => {
      it("should return true when accept mutation is pending", async () => {
        vi.mocked(useAcceptInvitationMutation).mockReturnValue({
          mutateAsync: mockAcceptMutateAsync,
          isPending: true,
        } as any);

        const mockInvitation = createMockInvitation();
        vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

        const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

        await waitFor(() => {
          expect(result.current.state.status).toBe("success");
        });

        expect(result.current.isProcessing).toBe(true);
      });

      it("should return true when decline mutation is pending", async () => {
        vi.mocked(useDeclineInvitationMutation).mockReturnValue({
          mutateAsync: mockDeclineMutateAsync,
          isPending: true,
        } as any);

        const mockInvitation = createMockInvitation();
        vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

        const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

        await waitFor(() => {
          expect(result.current.state.status).toBe("success");
        });

        expect(result.current.isProcessing).toBe(true);
      });

      it("should return true when both mutations are pending", async () => {
        vi.mocked(useAcceptInvitationMutation).mockReturnValue({
          mutateAsync: mockAcceptMutateAsync,
          isPending: true,
        } as any);

        vi.mocked(useDeclineInvitationMutation).mockReturnValue({
          mutateAsync: mockDeclineMutateAsync,
          isPending: true,
        } as any);

        const mockInvitation = createMockInvitation();
        vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

        const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

        await waitFor(() => {
          expect(result.current.state.status).toBe("success");
        });

        expect(result.current.isProcessing).toBe(true);
      });

      it("should return false when neither mutation is pending", async () => {
        const mockInvitation = createMockInvitation();
        vi.mocked(apiClient.handleApiResponse).mockResolvedValue(mockInvitation);

        const { result } = renderHook(() => useInvitationAcceptance("test-token", "invitee@example.com"));

        await waitFor(() => {
          expect(result.current.state.status).toBe("success");
        });

        expect(result.current.isProcessing).toBe(false);
      });
    });
  });
});
