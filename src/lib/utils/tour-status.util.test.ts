import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ensureTourNotArchived,
  isTourArchived,
  TourNotFoundError,
  TourStatusVerificationError,
} from "./tour-status.util";
import type { SupabaseClient } from "@/db/supabase.client";

describe("tour-status.util", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    } as unknown as SupabaseClient;
  });

  const setupMockQuery = (data: { status: string } | null, error: { code?: string; message?: string } | null) => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ data, error });

    (mockSupabase.from as any).mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      single: mockSingle,
    });

    return { mockSelect, mockEq, mockSingle };
  };

  describe("ensureTourNotArchived", () => {
    it("should not throw when tour is not archived", async () => {
      setupMockQuery({ status: "planning" }, null);

      await expect(ensureTourNotArchived(mockSupabase, "tour-123")).resolves.not.toThrow();
    });

    it("should not throw when tour status is confirmed", async () => {
      setupMockQuery({ status: "confirmed" }, null);

      await expect(ensureTourNotArchived(mockSupabase, "tour-123")).resolves.not.toThrow();
    });

    it("should throw when tour is archived", async () => {
      setupMockQuery({ status: "archived" }, null);

      await expect(ensureTourNotArchived(mockSupabase, "tour-123")).rejects.toThrow(
        "Cannot modify an archived tour. Archived tours are read-only."
      );
    });

    it("should throw TourNotFoundError when tour does not exist", async () => {
      setupMockQuery(null, { code: "PGRST116", message: "Not found" });

      await expect(ensureTourNotArchived(mockSupabase, "nonexistent-tour")).rejects.toThrow(TourNotFoundError);
      await expect(ensureTourNotArchived(mockSupabase, "nonexistent-tour")).rejects.toThrow(
        "Tour not found: nonexistent-tour"
      );
    });

    it("should throw TourStatusVerificationError on database error", async () => {
      setupMockQuery(null, { code: "500", message: "Database error" });

      await expect(ensureTourNotArchived(mockSupabase, "tour-123")).rejects.toThrow(TourStatusVerificationError);
      await expect(ensureTourNotArchived(mockSupabase, "tour-123")).rejects.toThrow("Failed to verify tour status.");
    });

    it("should call supabase with correct parameters", async () => {
      const { mockSelect, mockEq } = setupMockQuery({ status: "planning" }, null);

      await ensureTourNotArchived(mockSupabase, "tour-123");

      expect(mockSupabase.from).toHaveBeenCalledWith("tours");
      expect(mockSelect).toHaveBeenCalledWith("status");
      expect(mockEq).toHaveBeenCalledWith("id", "tour-123");
    });
  });

  describe("isTourArchived", () => {
    it("should return true when tour is archived", async () => {
      setupMockQuery({ status: "archived" }, null);

      const result = await isTourArchived(mockSupabase, "tour-123");
      expect(result).toBe(true);
    });

    it("should return false when tour is not archived", async () => {
      setupMockQuery({ status: "planning" }, null);

      const result = await isTourArchived(mockSupabase, "tour-123");
      expect(result).toBe(false);
    });

    it("should return false when tour status is confirmed", async () => {
      setupMockQuery({ status: "confirmed" }, null);

      const result = await isTourArchived(mockSupabase, "tour-123");
      expect(result).toBe(false);
    });

    it("should throw TourNotFoundError when tour does not exist", async () => {
      setupMockQuery(null, { code: "PGRST116", message: "Not found" });

      await expect(isTourArchived(mockSupabase, "nonexistent-tour")).rejects.toThrow(TourNotFoundError);
    });

    it("should throw TourStatusVerificationError on database error", async () => {
      setupMockQuery(null, { code: "42501", message: "RLS policy violation" });

      await expect(isTourArchived(mockSupabase, "tour-123")).rejects.toThrow(TourStatusVerificationError);
    });

    it("should throw TourStatusVerificationError on generic error", async () => {
      setupMockQuery(null, { message: "Connection failed" });

      await expect(isTourArchived(mockSupabase, "tour-123")).rejects.toThrow(TourStatusVerificationError);
    });

    it("should call supabase with correct parameters", async () => {
      const { mockSelect, mockEq } = setupMockQuery({ status: "archived" }, null);

      await isTourArchived(mockSupabase, "tour-456");

      expect(mockSupabase.from).toHaveBeenCalledWith("tours");
      expect(mockSelect).toHaveBeenCalledWith("status");
      expect(mockEq).toHaveBeenCalledWith("id", "tour-456");
    });
  });

  describe("Error classes", () => {
    it("TourNotFoundError should have correct name and message", () => {
      const error = new TourNotFoundError("tour-123");
      expect(error.name).toBe("TourNotFoundError");
      expect(error.message).toBe("Tour not found: tour-123");
      expect(error).toBeInstanceOf(Error);
    });

    it("TourStatusVerificationError should have correct name and message", () => {
      const error = new TourStatusVerificationError("Custom message");
      expect(error.name).toBe("TourStatusVerificationError");
      expect(error.message).toBe("Custom message");
      expect(error).toBeInstanceOf(Error);
    });
  });
});

