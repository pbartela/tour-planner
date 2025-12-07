import { describe, it, expect, vi, beforeEach } from "vitest";
import { profileService } from "./profile.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { ProfileDto, UpdateProfileCommand } from "@/types";

// Mock the audit log service
vi.mock("@/lib/server/audit-log.service", () => ({
  auditLog: vi.fn(),
  AuditActions: {
    ACCOUNT_DELETED: "account.deleted",
    ACCOUNT_DELETION_BLOCKED: "account.deletion_blocked",
  },
  getClientIp: vi.fn(),
  getUserAgent: vi.fn(),
}));

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

  describe("deleteAccount", () => {
    it("should successfully delete account with avatar", async () => {
      const userId = "user-123";
      const avatarUrl = "https://example.com/storage/v1/object/public/avatars/user-123/avatar.jpg";

      // Mock validation queries (tours and invitations)
      const mockToursSelect = vi.fn().mockReturnThis();
      const mockToursEq = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      const mockInvitationsSelect = vi.fn().mockReturnThis();
      const mockInvitationsEq = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      // Mock profile query
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { avatar_url: avatarUrl },
        error: null,
      });

      // Mock storage.from().remove()
      const mockRemove = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock tour_activity deletion
      const mockDelete = vi.fn().mockReturnThis();
      const mockActivityEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock auth.admin.deleteUser()
      const mockDeleteUser = vi.fn().mockResolvedValue({
        data: {},
        error: null,
      });

      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === "tours") {
          return {
            select: () => ({
              eq: () => ({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === "invitations") {
          return {
            select: () => ({
              eq: () => ({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: mockSelect,
          };
        }
        if (table === "tour_activity") {
          return {
            delete: mockDelete,
          };
        }
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockDelete.mockReturnValue({
        eq: mockActivityEq,
      });

      (mockSupabase as any).storage = {
        from: vi.fn().mockReturnValue({
          remove: mockRemove,
        }),
      };

      // Mock admin client
      const mockAdminClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "tours") {
            return {
              select: () => ({
                eq: () => ({
                  eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          }
          if (table === "invitations") {
            return {
              select: () => ({
                eq: () => ({
                  eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }),
        auth: {
          admin: {
            deleteUser: mockDeleteUser,
          },
        },
      } as any;

      const result = await profileService.deleteAccount(mockSupabase, mockAdminClient, userId);

      expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
      expect(mockRemove).toHaveBeenCalledWith(["user-123/avatar.jpg"]);
      expect(mockDelete).toHaveBeenCalled();
      expect(mockActivityEq).toHaveBeenCalledWith("user_id", userId);
      expect(mockDeleteUser).toHaveBeenCalledWith(userId);
      expect(result.error).toBeNull();
    });

    it("should successfully delete account without avatar", async () => {
      const userId = "user-456";

      // Mock profile query (no avatar)
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { avatar_url: null },
        error: null,
      });

      // Mock tour_activity deletion
      const mockDelete = vi.fn().mockReturnThis();
      const mockActivityEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock auth.admin.deleteUser()
      const mockDeleteUser = vi.fn().mockResolvedValue({
        data: {},
        error: null,
      });

      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === "tours") {
          return {
            select: () => ({
              eq: () => ({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === "invitations") {
          return {
            select: () => ({
              eq: () => ({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: mockSelect,
          };
        }
        if (table === "tour_activity") {
          return {
            delete: mockDelete,
          };
        }
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockDelete.mockReturnValue({
        eq: mockActivityEq,
      });

      // Mock admin client
      const mockAdminClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "tours") {
            return {
              select: () => ({
                eq: () => ({
                  eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          }
          if (table === "invitations") {
            return {
              select: () => ({
                eq: () => ({
                  eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }),
        auth: {
          admin: {
            deleteUser: mockDeleteUser,
          },
        },
      } as any;

      const result = await profileService.deleteAccount(mockSupabase, mockAdminClient, userId);

      expect(mockDeleteUser).toHaveBeenCalledWith(userId);
      expect(result.error).toBeNull();
    });

    it("should continue deletion even if avatar storage deletion fails", async () => {
      const userId = "user-789";
      const avatarUrl = "https://example.com/storage/v1/object/public/avatars/user-789/avatar.jpg";

      // Mock profile query
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { avatar_url: avatarUrl },
        error: null,
      });

      // Mock storage.from().remove() - fails
      const mockRemove = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Storage deletion failed" },
      });

      // Mock tour_activity deletion
      const mockDelete = vi.fn().mockReturnThis();
      const mockActivityEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock auth.admin.deleteUser()
      const mockDeleteUser = vi.fn().mockResolvedValue({
        data: {},
        error: null,
      });

      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === "tours") {
          return {
            select: () => ({
              eq: () => ({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === "invitations") {
          return {
            select: () => ({
              eq: () => ({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: mockSelect,
          };
        }
        if (table === "tour_activity") {
          return {
            delete: mockDelete,
          };
        }
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockDelete.mockReturnValue({
        eq: mockActivityEq,
      });

      (mockSupabase as any).storage = {
        from: vi.fn().mockReturnValue({
          remove: mockRemove,
        }),
      };

      // Mock admin client
      const mockAdminClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "tours") {
            return {
              select: () => ({
                eq: () => ({
                  eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          }
          if (table === "invitations") {
            return {
              select: () => ({
                eq: () => ({
                  eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }),
        auth: {
          admin: {
            deleteUser: mockDeleteUser,
          },
        },
      } as any;

      const result = await profileService.deleteAccount(mockSupabase, mockAdminClient, userId);

      // Should still succeed despite storage error
      expect(mockDeleteUser).toHaveBeenCalledWith(userId);
      expect(result.error).toBeNull();
    });

    it("should return error when tour_activity deletion fails", async () => {
      const userId = "user-fail";

      // Mock profile query
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { avatar_url: null },
        error: null,
      });

      // Mock tour_activity deletion - fails
      const mockDelete = vi.fn().mockReturnThis();
      const mockActivityEq = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Failed to delete tour_activity" },
      });

      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === "tours") {
          return {
            select: () => ({
              eq: () => ({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === "invitations") {
          return {
            select: () => ({
              eq: () => ({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: mockSelect,
          };
        }
        if (table === "tour_activity") {
          return {
            delete: mockDelete,
          };
        }
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockDelete.mockReturnValue({
        eq: mockActivityEq,
      });

      // Mock admin client (not used in this test as it fails before auth deletion)
      const mockAdminClient = {
        auth: {
          admin: {
            deleteUser: vi.fn(),
          },
        },
      } as any;

      const result = await profileService.deleteAccount(mockSupabase, mockAdminClient, userId);

      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain("Failed to clean up tour activity data");
    });

    it("should return error when auth user deletion fails", async () => {
      const userId = "user-auth-fail";

      // Mock profile query
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { avatar_url: null },
        error: null,
      });

      // Mock tour_activity deletion
      const mockDelete = vi.fn().mockReturnThis();
      const mockActivityEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock auth.admin.deleteUser() - fails
      const mockDeleteUser = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Auth deletion failed" },
      });

      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === "tours") {
          return {
            select: () => ({
              eq: () => ({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === "invitations") {
          return {
            select: () => ({
              eq: () => ({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: mockSelect,
          };
        }
        if (table === "tour_activity") {
          return {
            delete: mockDelete,
          };
        }
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockDelete.mockReturnValue({
        eq: mockActivityEq,
      });

      // Mock admin client
      const mockAdminClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "tours") {
            return {
              select: () => ({
                eq: () => ({
                  eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          }
          if (table === "invitations") {
            return {
              select: () => ({
                eq: () => ({
                  eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }),
        auth: {
          admin: {
            deleteUser: mockDeleteUser,
          },
        },
      } as any;

      const result = await profileService.deleteAccount(mockSupabase, mockAdminClient, userId);

      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain("Failed to delete user account");
    });

    it("should handle unexpected errors during account deletion", async () => {
      const userId = "user-unexpected";

      (mockSupabase.from as any).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      // Mock admin client (not used in this test as it fails before auth deletion)
      const mockAdminClient = {
        auth: {
          admin: {
            deleteUser: vi.fn(),
          },
        },
      } as any;

      const result = await profileService.deleteAccount(mockSupabase, mockAdminClient, userId);

      expect(result.error).toBeInstanceOf(Error);
      expect(result.error).toBeDefined();
    });
  });

  describe("updateRecentlyUsedTags", () => {
    const setupMockForUpdateRecentlyUsedTags = (
      currentTags: string[] | null,
      fetchError: { message?: string } | null,
      updateError: { message?: string } | null
    ) => {
      let fromCallCount = 0;

      (mockSupabase.from as any).mockImplementation(() => {
        fromCallCount++;

        if (fromCallCount === 1) {
          // First call: select to fetch current tags
          const mockSelect = vi.fn().mockReturnThis();
          const mockEq = vi.fn().mockReturnThis();
          const mockSingle = vi.fn().mockResolvedValue({
            data: { recently_used_tags: currentTags },
            error: fetchError,
          });

          return {
            select: () => ({
              eq: () => ({
                single: mockSingle,
              }),
            }),
          };
        } else {
          // Second call: update
          const mockUpdate = vi.fn().mockReturnThis();
          const mockEq = vi.fn().mockResolvedValue({
            error: updateError,
          });

          return {
            update: () => ({
              eq: mockEq,
            }),
          };
        }
      });
    };

    it("should add a new tag to empty recently used tags", async () => {
      setupMockForUpdateRecentlyUsedTags(null, null, null);

      await expect(profileService.updateRecentlyUsedTags(mockSupabase, "user-123", "summer")).resolves.not.toThrow();
    });

    it("should add tag to front of existing tags", async () => {
      const currentTags = ["winter", "spring"];
      let capturedUpdate: { recently_used_tags: string[] } | null = null;

      (mockSupabase.from as any).mockImplementation((table: string) => {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({
                data: { recently_used_tags: currentTags },
                error: null,
              }),
            }),
          }),
          update: (data: { recently_used_tags: string[] }) => {
            capturedUpdate = data;
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          },
        };
      });

      await profileService.updateRecentlyUsedTags(mockSupabase, "user-123", "summer");

      expect(capturedUpdate?.recently_used_tags[0]).toBe("summer");
      expect(capturedUpdate?.recently_used_tags).toContain("winter");
      expect(capturedUpdate?.recently_used_tags).toContain("spring");
    });

    it("should move existing tag to front when added again", async () => {
      const currentTags = ["winter", "summer", "spring"];
      let capturedUpdate: { recently_used_tags: string[] } | null = null;

      (mockSupabase.from as any).mockImplementation(() => {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({
                data: { recently_used_tags: currentTags },
                error: null,
              }),
            }),
          }),
          update: (data: { recently_used_tags: string[] }) => {
            capturedUpdate = data;
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          },
        };
      });

      await profileService.updateRecentlyUsedTags(mockSupabase, "user-123", "summer");

      expect(capturedUpdate?.recently_used_tags[0]).toBe("summer");
      expect(capturedUpdate?.recently_used_tags.filter((t) => t === "summer").length).toBe(1);
    });

    it("should limit to 10 tags", async () => {
      const currentTags = ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"];
      let capturedUpdate: { recently_used_tags: string[] } | null = null;

      (mockSupabase.from as any).mockImplementation(() => {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({
                data: { recently_used_tags: currentTags },
                error: null,
              }),
            }),
          }),
          update: (data: { recently_used_tags: string[] }) => {
            capturedUpdate = data;
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          },
        };
      });

      await profileService.updateRecentlyUsedTags(mockSupabase, "user-123", "new-tag");

      expect(capturedUpdate?.recently_used_tags.length).toBe(10);
      expect(capturedUpdate?.recently_used_tags[0]).toBe("new-tag");
      expect(capturedUpdate?.recently_used_tags).not.toContain("tag10");
    });

    it("should throw error when tag name exceeds 50 characters", async () => {
      const longTagName = "a".repeat(51);

      await expect(profileService.updateRecentlyUsedTags(mockSupabase, "user-123", longTagName)).rejects.toThrow(
        "Tag name cannot exceed 50 characters."
      );
    });

    it("should throw error when fetch fails", async () => {
      setupMockForUpdateRecentlyUsedTags(null, { message: "DB error" }, null);

      await expect(profileService.updateRecentlyUsedTags(mockSupabase, "user-123", "summer")).rejects.toThrow(
        "Failed to fetch profile."
      );
    });

    it("should throw error when update fails", async () => {
      (mockSupabase.from as any).mockImplementation(() => {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({
                data: { recently_used_tags: [] },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: vi.fn().mockResolvedValue({ error: { message: "Update failed" } }),
          }),
        };
      });

      await expect(profileService.updateRecentlyUsedTags(mockSupabase, "user-123", "summer")).rejects.toThrow(
        "Failed to update recently used tags."
      );
    });

    it("should handle empty array as current tags", async () => {
      let capturedUpdate: { recently_used_tags: string[] } | null = null;

      (mockSupabase.from as any).mockImplementation(() => {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({
                data: { recently_used_tags: [] },
                error: null,
              }),
            }),
          }),
          update: (data: { recently_used_tags: string[] }) => {
            capturedUpdate = data;
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          },
        };
      });

      await profileService.updateRecentlyUsedTags(mockSupabase, "user-123", "summer");

      expect(capturedUpdate?.recently_used_tags).toEqual(["summer"]);
    });
  });
});
