import { describe, it, expect } from "vitest";
import {
  inviteParticipantsCommandSchema,
  invitationIdSchema,
  tourIdParamSchema,
  invitationTokenSchema,
} from "./invitation.validators";

describe("Invitation Validators", () => {
  describe("inviteParticipantsCommandSchema", () => {
    it("should accept valid email list", () => {
      const result = inviteParticipantsCommandSchema.safeParse({
        emails: ["user1@example.com", "user2@example.com"],
      });
      expect(result.success).toBe(true);
    });

    it("should accept single email", () => {
      const result = inviteParticipantsCommandSchema.safeParse({
        emails: ["user@example.com"],
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty array", () => {
      const result = inviteParticipantsCommandSchema.safeParse({ emails: [] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least one email");
      }
    });

    it("should reject more than 50 emails", () => {
      const emails = Array(51)
        .fill(0)
        .map((_, i) => `user${i}@example.com`);
      const result = inviteParticipantsCommandSchema.safeParse({ emails });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Cannot invite more than 50");
      }
    });

    it("should reject invalid email format", () => {
      const result = inviteParticipantsCommandSchema.safeParse({
        emails: ["not-an-email"],
      });
      expect(result.success).toBe(false);
    });

    it("should reject duplicate emails (case insensitive)", () => {
      const result = inviteParticipantsCommandSchema.safeParse({
        emails: ["user@example.com", "USER@EXAMPLE.COM"],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Duplicate email");
      }
    });

    it("should reject duplicate emails with whitespace", () => {
      const result = inviteParticipantsCommandSchema.safeParse({
        emails: [" user@example.com ", "user@example.com"],
      });
      expect(result.success).toBe(false);
    });

    it("should accept multiple unique emails", () => {
      const emails = ["user1@example.com", "user2@example.com", "user3@example.com"];
      const result = inviteParticipantsCommandSchema.safeParse({ emails });
      expect(result.success).toBe(true);
    });

    it("should reject non-array emails", () => {
      const result = inviteParticipantsCommandSchema.safeParse({ emails: "user@example.com" });
      expect(result.success).toBe(false);
    });
  });

  describe("invitationIdSchema", () => {
    it("should accept valid UUID", () => {
      const result = invitationIdSchema.safeParse("550e8400-e29b-41d4-a716-446655440000");
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const result = invitationIdSchema.safeParse("not-a-uuid");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid invitation ID format");
      }
    });
  });

  describe("tourIdParamSchema", () => {
    it("should accept valid UUID", () => {
      const result = tourIdParamSchema.safeParse("550e8400-e29b-41d4-a716-446655440000");
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const result = tourIdParamSchema.safeParse("invalid");
      expect(result.success).toBe(false);
    });
  });

  describe("invitationTokenSchema", () => {
    it("should accept valid token (32-64 characters)", () => {
      const validTokens = ["a".repeat(32), "b".repeat(50), "c".repeat(64)];

      validTokens.forEach((token) => {
        const result = invitationTokenSchema.safeParse(token);
        expect(result.success).toBe(true);
      });
    });

    it("should reject token shorter than 32 characters", () => {
      const result = invitationTokenSchema.safeParse("a".repeat(31));
      expect(result.success).toBe(false);
    });

    it("should reject token longer than 64 characters", () => {
      const result = invitationTokenSchema.safeParse("a".repeat(65));
      expect(result.success).toBe(false);
    });

    it("should reject non-string values", () => {
      const result = invitationTokenSchema.safeParse(12345);
      expect(result.success).toBe(false);
    });
  });
});
