import { describe, it, expect } from "vitest";
import {
  getToursQuerySchema,
  createTourCommandSchema,
  updateTourCommandSchema,
} from "./tour.validators";

describe("Tour Validators", () => {
  describe("getToursQuerySchema", () => {
    it("should apply default values", () => {
      const result = getToursQuerySchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("active");
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should accept valid query parameters", () => {
      const result = getToursQuerySchema.safeParse({
        status: "archived",
        page: 2,
        limit: 50,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("archived");
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it("should coerce string numbers to integers", () => {
      const result = getToursQuerySchema.safeParse({
        page: "3",
        limit: "10",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(10);
      }
    });

    it("should reject invalid status", () => {
      const result = getToursQuerySchema.safeParse({
        status: "invalid",
      });

      expect(result.success).toBe(false);
    });

    it("should reject page less than 1", () => {
      const result = getToursQuerySchema.safeParse({
        page: 0,
      });

      expect(result.success).toBe(false);
    });

    it("should reject limit greater than 100", () => {
      const result = getToursQuerySchema.safeParse({
        limit: 101,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("createTourCommandSchema", () => {
    const validTourData = {
      title: "Summer Trip",
      destination: "Barcelona",
      description: "A fun summer trip",
      start_date: new Date("2025-07-01"),
      end_date: new Date("2025-07-10"),
      participant_limit: 10,
      like_threshold: 5,
    };

    it("should accept valid tour data", () => {
      const result = createTourCommandSchema.safeParse(validTourData);

      expect(result.success).toBe(true);
    });

    it("should accept tour without optional fields", () => {
      const result = createTourCommandSchema.safeParse({
        title: "Quick Trip",
        destination: "Paris",
        start_date: new Date("2025-06-01"),
        end_date: new Date("2025-06-05"),
      });

      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const result = createTourCommandSchema.safeParse({
        ...validTourData,
        title: "",
      });

      expect(result.success).toBe(false);
    });

    it("should reject empty destination", () => {
      const result = createTourCommandSchema.safeParse({
        ...validTourData,
        destination: "",
      });

      expect(result.success).toBe(false);
    });

    it("should reject end date before start date", () => {
      const result = createTourCommandSchema.safeParse({
        ...validTourData,
        start_date: new Date("2025-07-10"),
        end_date: new Date("2025-07-01"),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("end_date");
      }
    });

    it("should reject end date equal to start date", () => {
      const sameDate = new Date("2025-07-01");
      const result = createTourCommandSchema.safeParse({
        ...validTourData,
        start_date: sameDate,
        end_date: sameDate,
      });

      expect(result.success).toBe(false);
    });

    it("should coerce date strings to Date objects", () => {
      const result = createTourCommandSchema.safeParse({
        title: "Test Trip",
        destination: "London",
        start_date: "2025-08-01",
        end_date: "2025-08-10",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.start_date).toBeInstanceOf(Date);
        expect(result.data.end_date).toBeInstanceOf(Date);
      }
    });

    it("should reject negative participant_limit", () => {
      const result = createTourCommandSchema.safeParse({
        ...validTourData,
        participant_limit: -1,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateTourCommandSchema", () => {
    it("should accept partial updates", () => {
      const result = updateTourCommandSchema.safeParse({
        title: "Updated Title",
      });

      expect(result.success).toBe(true);
    });

    it("should accept are_votes_hidden field", () => {
      const result = updateTourCommandSchema.safeParse({
        are_votes_hidden: true,
      });

      expect(result.success).toBe(true);
    });

    it("should validate date relationship if both dates provided", () => {
      const result = updateTourCommandSchema.safeParse({
        start_date: new Date("2025-07-10"),
        end_date: new Date("2025-07-01"),
      });

      expect(result.success).toBe(false);
    });

    it("should allow updating only start_date", () => {
      const result = updateTourCommandSchema.safeParse({
        start_date: new Date("2025-07-01"),
      });

      expect(result.success).toBe(true);
    });

    it("should allow updating only end_date", () => {
      const result = updateTourCommandSchema.safeParse({
        end_date: new Date("2025-07-10"),
      });

      expect(result.success).toBe(true);
    });

    it("should accept empty object (no updates)", () => {
      const result = updateTourCommandSchema.safeParse({});

      expect(result.success).toBe(true);
    });

    it("should accept updating multiple fields", () => {
      const result = updateTourCommandSchema.safeParse({
        title: "New Title",
        destination: "New Destination",
        description: "New description",
        participant_limit: 15,
      });

      expect(result.success).toBe(true);
    });
  });
});
