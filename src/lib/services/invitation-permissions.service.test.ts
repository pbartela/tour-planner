import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { InvitationPermissions } from "./invitation-permissions.service";
import type { InvitationDto } from "@/types";

describe("InvitationPermissions", () => {
  // Helper to create mock invitation with defaults
  const createMockInvitation = (overrides: Partial<InvitationDto> = {}): InvitationDto => {
    return {
      id: "test-invitation-id",
      tour_id: "test-tour-id",
      email: "invitee@example.com",
      status: "pending",
      expires_at: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    } as InvitationDto;
  };

  beforeEach(() => {
    // Use fake timers to set a fixed time
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("canCancel", () => {
    it("should return true for owner with pending, non-expired invitation", () => {
      const invitation = createMockInvitation({
        status: "pending",
        expires_at: "2025-01-20T12:00:00Z", // Future date
      });

      expect(InvitationPermissions.canCancel(invitation, true)).toBe(true);
    });

    it("should return false for non-owner", () => {
      const invitation = createMockInvitation({
        status: "pending",
        expires_at: "2025-01-20T12:00:00Z",
      });

      expect(InvitationPermissions.canCancel(invitation, false)).toBe(false);
    });

    it("should return false for expired invitation", () => {
      const invitation = createMockInvitation({
        status: "pending",
        expires_at: "2025-01-10T12:00:00Z", // Past date
      });

      expect(InvitationPermissions.canCancel(invitation, true)).toBe(false);
    });

    it("should return false for accepted invitation", () => {
      const invitation = createMockInvitation({
        status: "accepted",
        expires_at: "2025-01-20T12:00:00Z",
      });

      expect(InvitationPermissions.canCancel(invitation, true)).toBe(false);
    });

    it("should return false for declined invitation", () => {
      const invitation = createMockInvitation({
        status: "declined",
        expires_at: "2025-01-20T12:00:00Z",
      });

      expect(InvitationPermissions.canCancel(invitation, true)).toBe(false);
    });

    it("should return true for invitation expiring at current time (boundary case)", () => {
      const invitation = createMockInvitation({
        status: "pending",
        expires_at: "2025-01-15T12:00:00Z", // Exact current time
      });

      // Since check uses <, invitation at exact time is NOT expired yet
      expect(InvitationPermissions.canCancel(invitation, true)).toBe(true);
    });
  });

  describe("canResend", () => {
    it("should return true for owner with declined invitation", () => {
      const invitation = createMockInvitation({
        status: "declined",
        expires_at: "2025-01-20T12:00:00Z",
      });

      expect(InvitationPermissions.canResend(invitation, true)).toBe(true);
    });

    it("should return true for owner with pending, expired invitation", () => {
      const invitation = createMockInvitation({
        status: "pending",
        expires_at: "2025-01-10T12:00:00Z", // Past date
      });

      expect(InvitationPermissions.canResend(invitation, true)).toBe(true);
    });

    it("should return false for non-owner", () => {
      const invitation = createMockInvitation({
        status: "declined",
        expires_at: "2025-01-20T12:00:00Z",
      });

      expect(InvitationPermissions.canResend(invitation, false)).toBe(false);
    });

    it("should return false for pending, non-expired invitation", () => {
      const invitation = createMockInvitation({
        status: "pending",
        expires_at: "2025-01-20T12:00:00Z",
      });

      expect(InvitationPermissions.canResend(invitation, true)).toBe(false);
    });

    it("should return false for accepted invitation", () => {
      const invitation = createMockInvitation({
        status: "accepted",
        expires_at: "2025-01-20T12:00:00Z",
      });

      expect(InvitationPermissions.canResend(invitation, true)).toBe(false);
    });
  });

  describe("canRemove", () => {
    it("should delegate to canResend and return true for declined invitation", () => {
      const invitation = createMockInvitation({
        status: "declined",
        expires_at: "2025-01-20T12:00:00Z",
      });

      expect(InvitationPermissions.canRemove(invitation, true)).toBe(true);
      // Verify it behaves identically to canResend
      expect(InvitationPermissions.canRemove(invitation, true)).toBe(
        InvitationPermissions.canResend(invitation, true)
      );
    });

    it("should delegate to canResend and return true for pending, expired invitation", () => {
      const invitation = createMockInvitation({
        status: "pending",
        expires_at: "2025-01-10T12:00:00Z",
      });

      expect(InvitationPermissions.canRemove(invitation, true)).toBe(true);
      expect(InvitationPermissions.canRemove(invitation, true)).toBe(
        InvitationPermissions.canResend(invitation, true)
      );
    });

    it("should delegate to canResend and return false for non-owner", () => {
      const invitation = createMockInvitation({
        status: "declined",
        expires_at: "2025-01-20T12:00:00Z",
      });

      expect(InvitationPermissions.canRemove(invitation, false)).toBe(false);
      expect(InvitationPermissions.canRemove(invitation, false)).toBe(
        InvitationPermissions.canResend(invitation, false)
      );
    });

    it("should delegate to canResend for all cases", () => {
      // Test multiple scenarios to ensure delegation is consistent
      const scenarios = [
        { status: "pending" as const, expires_at: "2025-01-20T12:00:00Z", isOwner: true },
        { status: "accepted" as const, expires_at: "2025-01-20T12:00:00Z", isOwner: true },
        { status: "declined" as const, expires_at: "2025-01-10T12:00:00Z", isOwner: false },
      ];

      scenarios.forEach(({ status, expires_at, isOwner }) => {
        const invitation = createMockInvitation({ status, expires_at });
        expect(InvitationPermissions.canRemove(invitation, isOwner)).toBe(
          InvitationPermissions.canResend(invitation, isOwner)
        );
      });
    });
  });

  describe("isExpired", () => {
    it("should return true for expired invitation", () => {
      const invitation = createMockInvitation({
        expires_at: "2025-01-10T12:00:00Z", // Past date
      });

      expect(InvitationPermissions.isExpired(invitation)).toBe(true);
    });

    it("should return false for non-expired invitation", () => {
      const invitation = createMockInvitation({
        expires_at: "2025-01-20T12:00:00Z", // Future date
      });

      expect(InvitationPermissions.isExpired(invitation)).toBe(false);
    });

    it("should return false for invitation expiring at current time (boundary case)", () => {
      const invitation = createMockInvitation({
        expires_at: "2025-01-15T12:00:00Z", // Exact current time
      });

      // Since check uses <, invitation at exact time is NOT expired
      expect(InvitationPermissions.isExpired(invitation)).toBe(false);
    });

    it("should return true for invitation one millisecond in the past", () => {
      const invitation = createMockInvitation({
        expires_at: "2025-01-15T11:59:59.999Z", // Just before current time
      });

      expect(InvitationPermissions.isExpired(invitation)).toBe(true);
    });

    it("should return false for invitation one millisecond in the future", () => {
      const invitation = createMockInvitation({
        expires_at: "2025-01-15T12:00:00.001Z", // Just after current time
      });

      expect(InvitationPermissions.isExpired(invitation)).toBe(false);
    });
  });

  describe("getAvailableActions", () => {
    it("should return all available actions for owner with pending, non-expired invitation", () => {
      const invitation = createMockInvitation({
        status: "pending",
        expires_at: "2025-01-20T12:00:00Z",
      });

      const actions = InvitationPermissions.getAvailableActions(invitation, true);

      expect(actions).toEqual({
        canCancel: true,
        canResend: false,
        canRemove: false,
      });
    });

    it("should return all available actions for owner with pending, expired invitation", () => {
      const invitation = createMockInvitation({
        status: "pending",
        expires_at: "2025-01-10T12:00:00Z",
      });

      const actions = InvitationPermissions.getAvailableActions(invitation, true);

      expect(actions).toEqual({
        canCancel: false,
        canResend: true,
        canRemove: true,
      });
    });

    it("should return all available actions for owner with declined invitation", () => {
      const invitation = createMockInvitation({
        status: "declined",
        expires_at: "2025-01-20T12:00:00Z",
      });

      const actions = InvitationPermissions.getAvailableActions(invitation, true);

      expect(actions).toEqual({
        canCancel: false,
        canResend: true,
        canRemove: true,
      });
    });

    it("should return all available actions for owner with accepted invitation", () => {
      const invitation = createMockInvitation({
        status: "accepted",
        expires_at: "2025-01-20T12:00:00Z",
      });

      const actions = InvitationPermissions.getAvailableActions(invitation, true);

      expect(actions).toEqual({
        canCancel: false,
        canResend: false,
        canRemove: false,
      });
    });

    it("should return all false for non-owner", () => {
      const invitation = createMockInvitation({
        status: "pending",
        expires_at: "2025-01-20T12:00:00Z",
      });

      const actions = InvitationPermissions.getAvailableActions(invitation, false);

      expect(actions).toEqual({
        canCancel: false,
        canResend: false,
        canRemove: false,
      });
    });

    it("should return consistent results across multiple calls", () => {
      const invitation = createMockInvitation({
        status: "pending",
        expires_at: "2025-01-20T12:00:00Z",
      });

      const actions1 = InvitationPermissions.getAvailableActions(invitation, true);
      const actions2 = InvitationPermissions.getAvailableActions(invitation, true);

      expect(actions1).toEqual(actions2);
    });
  });
});
