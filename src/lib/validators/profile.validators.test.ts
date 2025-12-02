import { describe, it, expect } from "vitest";
import { updateProfileCommandSchema, completedProfileSchema } from "./profile.validators";

describe("Profile Validators", () => {
  describe("updateProfileCommandSchema", () => {
    it("should accept valid display_name", () => {
      const result = updateProfileCommandSchema.safeParse({ display_name: "John Doe" });
      expect(result.success).toBe(true);
    });

    it("should reject empty display_name", () => {
      const result = updateProfileCommandSchema.safeParse({ display_name: "" });
      expect(result.success).toBe(false);
    });

    it("should accept valid language", () => {
      const validLanguages = ["en-US", "pl-PL"] as const;
      validLanguages.forEach((language) => {
        const result = updateProfileCommandSchema.safeParse({ language });
        expect(result.success).toBe(true);
      });
    });

    it("should accept valid theme", () => {
      const themes = ["light", "dark", "system"] as const;
      themes.forEach((theme) => {
        const result = updateProfileCommandSchema.safeParse({ theme });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid language", () => {
      const result = updateProfileCommandSchema.safeParse({ language: "fr" });
      expect(result.success).toBe(false);
    });

    it("should reject invalid theme", () => {
      const result = updateProfileCommandSchema.safeParse({ theme: "blue" });
      expect(result.success).toBe(false);
    });

    it("should accept onboarding_completed boolean", () => {
      const result = updateProfileCommandSchema.safeParse({ onboarding_completed: true });
      expect(result.success).toBe(true);
    });

    it("should accept partial updates", () => {
      const result = updateProfileCommandSchema.safeParse({ display_name: "New Name" });
      expect(result.success).toBe(true);
    });

    it("should accept empty object", () => {
      const result = updateProfileCommandSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept multiple fields", () => {
      const result = updateProfileCommandSchema.safeParse({
        display_name: "John Doe",
        language: "pl-PL",
        theme: "dark",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("completedProfileSchema", () => {
    it("should accept onboarding_completed true", () => {
      const result = completedProfileSchema.safeParse({ onboarding_completed: true });
      expect(result.success).toBe(true);
    });

    it("should accept onboarding_completed false", () => {
      const result = completedProfileSchema.safeParse({ onboarding_completed: false });
      expect(result.success).toBe(true);
    });

    it("should reject missing onboarding_completed", () => {
      const result = completedProfileSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject non-boolean value", () => {
      const result = completedProfileSchema.safeParse({ onboarding_completed: "true" });
      expect(result.success).toBe(false);
    });
  });
});
