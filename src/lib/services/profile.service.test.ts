import { describe, it, expect, vi, beforeEach } from "vitest";
import { profileService } from "./profile.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { ProfileDto, UpdateProfileCommand } from "@/types";

describe("ProfileService", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    // Create a mock Supabase client
    mockSupabase = {
      from: vi.fn(),
    } as unknown as SupabaseClient;
  });

  describe("getProfile", () => {
    it("should return profile data on success", async () => {
      const mockProfile: ProfileDto = {
        id: "user-123",
        email: "test@example.com",
        display_name: "Test User",
        avatar_url: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      (mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await profileService.getProfile(mockSupabase, "user-123");

      expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockEq).toHaveBeenCalledWith("id", "user-123");
      expect(mockSingle).toHaveBeenCalled();
      expect(result.data).toEqual(mockProfile);
      expect(result.error).toBeNull();
    });

    it("should return error when database query fails", async () => {
      const mockError = new Error("Database error");

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      (mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await profileService.getProfile(mockSupabase, "user-123");

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain("Failed to fetch profile");
    });

    it("should handle unexpected errors", async () => {
      (mockSupabase.from as any).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const result = await profileService.getProfile(mockSupabase, "user-123");

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe("updateProfile", () => {
    it("should update profile successfully", async () => {
      const updateCommand: UpdateProfileCommand = {
        display_name: "Updated Name",
        avatar_url: "https://example.com/avatar.jpg",
      };

      const updatedProfile: ProfileDto = {
        id: "user-123",
        email: "test@example.com",
        display_name: "Updated Name",
        avatar_url: "https://example.com/avatar.jpg",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-02T00:00:00Z",
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: updatedProfile,
        error: null,
      });

      (mockSupabase.from as any).mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });

      const result = await profileService.updateProfile(mockSupabase, "user-123", updateCommand);

      expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
      expect(mockUpdate).toHaveBeenCalledWith(updateCommand);
      expect(mockEq).toHaveBeenCalledWith("id", "user-123");
      expect(mockSelect).toHaveBeenCalled();
      expect(result.data).toEqual(updatedProfile);
      expect(result.error).toBeNull();
    });

    it("should return error when update fails", async () => {
      const updateCommand: UpdateProfileCommand = {
        display_name: "Updated Name",
      };

      const mockError = { message: "Update failed", code: "23505" };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      (mockSupabase.from as any).mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });

      const result = await profileService.updateProfile(mockSupabase, "user-123", updateCommand);

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain("Update failed");
    });

    it("should handle unexpected errors during update", async () => {
      const updateCommand: UpdateProfileCommand = {
        display_name: "Updated Name",
      };

      (mockSupabase.from as any).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const result = await profileService.updateProfile(mockSupabase, "user-123", updateCommand);

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });

    it("should update only provided fields", async () => {
      const updateCommand: UpdateProfileCommand = {
        display_name: "New Name",
        // avatar_url not provided
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { id: "user-123", display_name: "New Name" },
        error: null,
      });

      (mockSupabase.from as any).mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });

      await profileService.updateProfile(mockSupabase, "user-123", updateCommand);

      expect(mockUpdate).toHaveBeenCalledWith(updateCommand);
      expect(updateCommand).not.toHaveProperty("avatar_url");
    });
  });
});
