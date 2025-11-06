import { describe, it, expect } from "vitest";
import { votesTourIdSchema } from "./vote.validators";

describe("Vote Validators", () => {
  describe("votesTourIdSchema", () => {
    it("should accept valid UUID", () => {
      const validUUIDs = [
        "550e8400-e29b-41d4-a716-446655440000",
        "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      ];

      validUUIDs.forEach((uuid) => {
        const result = votesTourIdSchema.safeParse(uuid);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid UUID formats", () => {
      const invalidUUIDs = [
        "not-a-uuid",
        "12345",
        "550e8400e29b41d4a716446655440000", // missing hyphens
        "550e8400-e29b-41d4-a716", // incomplete
        "",
      ];

      invalidUUIDs.forEach((uuid) => {
        const result = votesTourIdSchema.safeParse(uuid);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("Invalid tour ID format");
        }
      });
    });

    it("should reject non-string values", () => {
      const invalidValues = [123, null, undefined, {}, []];

      invalidValues.forEach((value) => {
        const result = votesTourIdSchema.safeParse(value);
        expect(result.success).toBe(false);
      });
    });
  });
});
