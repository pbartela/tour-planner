import { describe, it, expect } from "vitest";
import {
  getCommentsQuerySchema,
  createCommentCommandSchema,
  updateCommentCommandSchema,
  commentIdSchema,
  tourIdParamSchema,
} from "./comment.validators";

describe("Comment Validators", () => {
  describe("getCommentsQuerySchema", () => {
    it("should apply default values", () => {
      const result = getCommentsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should accept valid query parameters", () => {
      const result = getCommentsQuerySchema.safeParse({ page: 2, limit: 50 });
      expect(result.success).toBe(true);
    });

    it("should reject invalid page number", () => {
      const result = getCommentsQuerySchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it("should reject limit over 100", () => {
      const result = getCommentsQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });

  describe("createCommentCommandSchema", () => {
    it("should accept valid comment content", () => {
      const result = createCommentCommandSchema.safeParse({ content: "This is a comment" });
      expect(result.success).toBe(true);
    });

    it("should reject empty content", () => {
      const result = createCommentCommandSchema.safeParse({ content: "" });
      expect(result.success).toBe(false);
    });

    it("should reject content over 5000 characters", () => {
      const longContent = "a".repeat(5001);
      const result = createCommentCommandSchema.safeParse({ content: longContent });
      expect(result.success).toBe(false);
    });
  });

  describe("updateCommentCommandSchema", () => {
    it("should accept valid comment content", () => {
      const result = updateCommentCommandSchema.safeParse({ content: "Updated comment" });
      expect(result.success).toBe(true);
    });

    it("should reject empty content", () => {
      const result = updateCommentCommandSchema.safeParse({ content: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("commentIdSchema", () => {
    it("should accept valid UUID", () => {
      const result = commentIdSchema.safeParse("550e8400-e29b-41d4-a716-446655440000");
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const result = commentIdSchema.safeParse("not-a-uuid");
      expect(result.success).toBe(false);
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
});
