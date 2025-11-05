import { describe, it, expect } from "vitest";
import { MagicLinkSchema } from "./auth.validators";

describe("MagicLinkSchema", () => {
  describe("email validation", () => {
    it("should accept valid email addresses", () => {
      const validEmails = [
        "user@example.com",
        "test.user@domain.co.uk",
        "user+tag@example.com",
      ];

      validEmails.forEach((email) => {
        const result = MagicLinkSchema.safeParse({ email });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid email addresses", () => {
      const invalidEmails = ["not-an-email", "@example.com", "user@", "user"];

      invalidEmails.forEach((email) => {
        const result = MagicLinkSchema.safeParse({ email });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("redirectTo validation", () => {
    it("should accept null or undefined redirectTo", () => {
      const result1 = MagicLinkSchema.safeParse({
        email: "user@example.com",
        redirectTo: null,
      });
      expect(result1.success).toBe(true);

      const result2 = MagicLinkSchema.safeParse({
        email: "user@example.com",
      });
      expect(result2.success).toBe(true);
    });

    it("should accept allowed redirect paths", () => {
      const allowedPaths = [
        "/",
        "/dashboard",
        "/tours",
        "/tours/123",
        "/profile",
        "/profile/edit",
        "/settings",
        "/settings/preferences",
      ];

      allowedPaths.forEach((redirectTo) => {
        const result = MagicLinkSchema.safeParse({
          email: "user@example.com",
          redirectTo,
        });
        expect(result.success).toBe(true);
      });
    });

    it("should accept paths with query parameters", () => {
      const result = MagicLinkSchema.safeParse({
        email: "user@example.com",
        redirectTo: "/tours?sort=date",
      });
      expect(result.success).toBe(true);
    });

    it("should reject absolute URLs", () => {
      const absoluteUrls = [
        "http://example.com",
        "https://evil.com",
        "//evil.com",
      ];

      absoluteUrls.forEach((redirectTo) => {
        const result = MagicLinkSchema.safeParse({
          email: "user@example.com",
          redirectTo,
        });
        expect(result.success).toBe(false);
      });
    });

    it("should reject protocol-based attacks", () => {
      const maliciousUrls = [
        "javascript:alert(1)",
        "data:text/html,<script>alert(1)</script>",
        "vbscript:msgbox(1)",
      ];

      maliciousUrls.forEach((redirectTo) => {
        const result = MagicLinkSchema.safeParse({
          email: "user@example.com",
          redirectTo,
        });
        expect(result.success).toBe(false);
      });
    });

    it("should reject paths not in whitelist", () => {
      const disallowedPaths = ["/admin", "/api/secret", "/unauthorized"];

      disallowedPaths.forEach((redirectTo) => {
        const result = MagicLinkSchema.safeParse({
          email: "user@example.com",
          redirectTo,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("locale validation", () => {
    it("should accept optional locale parameter", () => {
      const result = MagicLinkSchema.safeParse({
        email: "user@example.com",
        locale: "en-US",
      });
      expect(result.success).toBe(true);
    });

    it("should work without locale parameter", () => {
      const result = MagicLinkSchema.safeParse({
        email: "user@example.com",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("complete validation", () => {
    it("should validate complete valid object", () => {
      const result = MagicLinkSchema.safeParse({
        email: "user@example.com",
        redirectTo: "/tours",
        locale: "en-US",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
        expect(result.data.redirectTo).toBe("/tours");
        expect(result.data.locale).toBe("en-US");
      }
    });
  });
});
