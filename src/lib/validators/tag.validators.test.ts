import { describe, it, expect } from "vitest";
import { addTagCommandSchema, tagIdSchema, tagSearchQuerySchema } from "./tag.validators";

describe("Tag Validators", () => {
  describe("addTagCommandSchema", () => {
    it("should accept valid tag name", () => {
      const result = addTagCommandSchema.safeParse({ tag_name: "summer-trip" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tag_name).toBe("summer-trip");
      }
    });

    it("should accept tag name with spaces", () => {
      const result = addTagCommandSchema.safeParse({ tag_name: "Summer Trip 2024" });
      expect(result.success).toBe(true);
    });

    it("should accept tag name with underscores", () => {
      const result = addTagCommandSchema.safeParse({ tag_name: "europe_adventure" });
      expect(result.success).toBe(true);
    });

    it("should accept tag name with hyphens", () => {
      const result = addTagCommandSchema.safeParse({ tag_name: "road-trip" });
      expect(result.success).toBe(true);
    });

    it("should accept tag name with numbers", () => {
      const result = addTagCommandSchema.safeParse({ tag_name: "trip2024" });
      expect(result.success).toBe(true);
    });

    it("should trim whitespace from tag name", () => {
      const result = addTagCommandSchema.safeParse({ tag_name: "  summer-trip  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tag_name).toBe("summer-trip");
      }
    });

    it("should reject empty tag name", () => {
      const result = addTagCommandSchema.safeParse({ tag_name: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("empty");
      }
    });

    it("should reject whitespace-only tag name", () => {
      const result = addTagCommandSchema.safeParse({ tag_name: "   " });
      expect(result.success).toBe(false);
    });

    it("should reject tag name exceeding 50 characters", () => {
      const longName = "a".repeat(51);
      const result = addTagCommandSchema.safeParse({ tag_name: longName });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("50 characters");
      }
    });

    it("should accept tag name exactly 50 characters", () => {
      const exactName = "a".repeat(50);
      const result = addTagCommandSchema.safeParse({ tag_name: exactName });
      expect(result.success).toBe(true);
    });

    it("should reject special characters", () => {
      const invalidNames = ["summer@trip", "trip#2024", "road/trip", "trip&fun", "trip!", "trip?"];

      for (const name of invalidNames) {
        const result = addTagCommandSchema.safeParse({ tag_name: name });
        expect(result.success).toBe(false);
      }
    });

    it("should reject unicode characters", () => {
      const result = addTagCommandSchema.safeParse({ tag_name: "trip🌴" });
      expect(result.success).toBe(false);
    });

    it("should reject missing tag_name field", () => {
      const result = addTagCommandSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("tagIdSchema", () => {
    it("should accept positive integer", () => {
      const result = tagIdSchema.safeParse(1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it("should coerce string to number", () => {
      const result = tagIdSchema.safeParse("42");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it("should reject zero", () => {
      const result = tagIdSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it("should reject negative numbers", () => {
      const result = tagIdSchema.safeParse(-1);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("positive");
      }
    });

    it("should reject non-integer numbers", () => {
      const result = tagIdSchema.safeParse(1.5);
      expect(result.success).toBe(false);
    });

    it("should reject non-numeric strings", () => {
      const result = tagIdSchema.safeParse("abc");
      expect(result.success).toBe(false);
    });
  });

  describe("tagSearchQuerySchema", () => {
    it("should accept valid search query", () => {
      const result = tagSearchQuerySchema.safeParse({ q: "summer" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBe("summer");
        expect(result.data.limit).toBe(10); // default
      }
    });

    it("should accept query with custom limit", () => {
      const result = tagSearchQuerySchema.safeParse({ q: "trip", limit: 20 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBe("trip");
        expect(result.data.limit).toBe(20);
      }
    });

    it("should accept empty object (no query)", () => {
      const result = tagSearchQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBeUndefined();
        expect(result.data.limit).toBe(10);
      }
    });

    it("should apply default limit", () => {
      const result = tagSearchQuerySchema.safeParse({ q: "test" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
      }
    });

    it("should coerce string limit to number", () => {
      const result = tagSearchQuerySchema.safeParse({ q: "test", limit: "25" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
      }
    });

    it("should trim whitespace from query", () => {
      const result = tagSearchQuerySchema.safeParse({ q: "  summer  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBe("summer");
      }
    });

    it("should reject query exceeding 50 characters", () => {
      const longQuery = "a".repeat(51);
      const result = tagSearchQuerySchema.safeParse({ q: longQuery });
      expect(result.success).toBe(false);
    });

    it("should reject special characters in query", () => {
      const result = tagSearchQuerySchema.safeParse({ q: "trip%wild" });
      expect(result.success).toBe(false);
    });

    it("should reject limit less than 1", () => {
      const result = tagSearchQuerySchema.safeParse({ q: "test", limit: 0 });
      expect(result.success).toBe(false);
    });

    it("should reject limit greater than 50", () => {
      const result = tagSearchQuerySchema.safeParse({ q: "test", limit: 51 });
      expect(result.success).toBe(false);
    });

    it("should accept limit at boundaries", () => {
      const minResult = tagSearchQuerySchema.safeParse({ q: "test", limit: 1 });
      expect(minResult.success).toBe(true);

      const maxResult = tagSearchQuerySchema.safeParse({ q: "test", limit: 50 });
      expect(maxResult.success).toBe(true);
    });

    it("should accept query with spaces hyphens and underscores", () => {
      const result = tagSearchQuerySchema.safeParse({ q: "summer trip-2024_europe" });
      expect(result.success).toBe(true);
    });
  });
});

