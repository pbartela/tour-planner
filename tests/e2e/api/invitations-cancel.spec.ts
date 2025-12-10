import { test, expect } from "@playwright/test";
import * as dotenv from "dotenv";
import {
  createTestUser,
  createTestTour,
  createTestInvitation,
  getCsrfToken,
  cleanupTestUser,
  cleanupTestTour,
  getInvitationById,
  pgPool,
} from "../../helpers/invitation-api-helpers";

// Load environment variables
dotenv.config();

/**
 * E2E Tests for DELETE /api/invitations/[invitationId]
 * Tests the invitation cancellation endpoint
 */

test.describe("DELETE /api/invitations/[invitationId]", () => {
  let tourOwner: Awaited<ReturnType<typeof createTestUser>>;
  let testTour: Awaited<ReturnType<typeof createTestTour>>;
  let csrfToken: string;

  test.beforeEach(async ({ request }) => {
    // Create tour owner and tour
    tourOwner = await createTestUser(`owner-${Date.now()}@test.com`);
    testTour = await createTestTour(tourOwner.id);

    // Get CSRF token
    csrfToken = await getCsrfToken(request);
  });

  test.afterEach(async () => {
    // Cleanup
    await cleanupTestTour(testTour.id);
    await cleanupTestUser(tourOwner.id);
  });

  test.describe("Success Scenarios", () => {
    test("should successfully delete pending invitation", async ({ request }) => {
      // Create a pending invitation
      const invitation = await createTestInvitation(
        testTour.id,
        tourOwner.id,
        "pending@example.com"
      );

      const response = await request.delete(`/api/invitations/${invitation.id}`, {
        headers: {
          Authorization: `Bearer ${tourOwner.accessToken}`,
          "x-csrf-token": csrfToken,
        },
      });

      expect(response.status()).toBe(204);

      // Verify invitation was deleted
      const deletedInvitation = await getInvitationById(invitation.id);
      expect(deletedInvitation).toBeNull();
    });

    test("should successfully delete declined invitation", async ({ request }) => {
      // Create invitation and mark it as declined
      const invitation = await createTestInvitation(
        testTour.id,
        tourOwner.id,
        "declined@example.com"
      );

      // Update status to declined
      await pgPool.query("UPDATE public.invitations SET status = 'declined' WHERE id = $1", [
        invitation.id,
      ]);

      const response = await request.delete(`/api/invitations/${invitation.id}`, {
        headers: {
          Authorization: `Bearer ${tourOwner.accessToken}`,
          "x-csrf-token": csrfToken,
        },
      });

      expect(response.status()).toBe(204);

      // Verify invitation was deleted
      const deletedInvitation = await getInvitationById(invitation.id);
      expect(deletedInvitation).toBeNull();
    });

    test("should verify invitation is removed from database", async ({ request }) => {
      const invitation = await createTestInvitation(
        testTour.id,
        tourOwner.id,
        "remove@example.com"
      );

      // Verify invitation exists before deletion
      const beforeDelete = await getInvitationById(invitation.id);
      expect(beforeDelete).not.toBeNull();

      // Delete invitation
      await request.delete(`/api/invitations/${invitation.id}`, {
        headers: {
          Authorization: `Bearer ${tourOwner.accessToken}`,
          "x-csrf-token": csrfToken,
        },
      });

      // Verify invitation no longer exists
      const afterDelete = await getInvitationById(invitation.id);
      expect(afterDelete).toBeNull();
    });
  });

  test.describe("Business Logic Scenarios", () => {
    test("should reject deletion of accepted invitation", async ({ request }) => {
      // Create invitation and mark it as accepted
      const invitation = await createTestInvitation(
        testTour.id,
        tourOwner.id,
        "accepted@example.com"
      );

      // Update status to accepted
      await pgPool.query("UPDATE public.invitations SET status = 'accepted' WHERE id = $1", [
        invitation.id,
      ]);

      const response = await request.delete(`/api/invitations/${invitation.id}`, {
        headers: {
          Authorization: `Bearer ${tourOwner.accessToken}`,
          "x-csrf-token": csrfToken,
        },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();

      // Verify invitation still exists
      const invitationAfter = await getInvitationById(invitation.id);
      expect(invitationAfter).not.toBeNull();
    });

    test("should return 404 when invitation doesn't exist", async ({ request }) => {
      const fakeUuid = "123e4567-e89b-12d3-a456-426614174000";

      const response = await request.delete(`/api/invitations/${fakeUuid}`, {
        headers: {
          Authorization: `Bearer ${tourOwner.accessToken}`,
          "x-csrf-token": csrfToken,
        },
      });

      expect(response.status()).toBe(404);
    });
  });

  test.describe("Authorization Scenarios", () => {
    test("should reject unauthenticated request", async ({ request }) => {
      const invitation = await createTestInvitation(
        testTour.id,
        tourOwner.id,
        "test@example.com"
      );

      const response = await request.delete(`/api/invitations/${invitation.id}`, {
        headers: {
          "x-csrf-token": csrfToken,
        },
      });

      expect(response.status()).toBe(401);
    });

    test("should reject when user is not tour owner", async ({ request }) => {
      // Create invitation
      const invitation = await createTestInvitation(
        testTour.id,
        tourOwner.id,
        "test@example.com"
      );

      // Create another user who is not the owner
      const otherUser = await createTestUser(`other-${Date.now()}@test.com`);

      const response = await request.delete(`/api/invitations/${invitation.id}`, {
        headers: {
          Authorization: `Bearer ${otherUser.accessToken}`,
          "x-csrf-token": csrfToken,
        },
      });

      // RLS prevents non-owners from even seeing the invitation,
      // so 404 is returned instead of 403 (avoiding information disclosure)
      expect(response.status()).toBe(404);

      // Cleanup
      await cleanupTestUser(otherUser.id);
    });

    test("should succeed when user is tour owner", async ({ request }) => {
      const invitation = await createTestInvitation(
        testTour.id,
        tourOwner.id,
        "test@example.com"
      );

      const response = await request.delete(`/api/invitations/${invitation.id}`, {
        headers: {
          Authorization: `Bearer ${tourOwner.accessToken}`,
          "x-csrf-token": csrfToken,
        },
      });

      expect(response.status()).toBe(204);
    });
  });

  test.describe("Validation Scenarios", () => {
    test("should reject invalid invitation ID format", async ({ request }) => {
      const response = await request.delete("/api/invitations/invalid-id", {
        headers: {
          Authorization: `Bearer ${tourOwner.accessToken}`,
          "x-csrf-token": csrfToken,
        },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    test("should validate CSRF token", async ({ request }) => {
      const invitation = await createTestInvitation(
        testTour.id,
        tourOwner.id,
        "test@example.com"
      );

      const response = await request.delete(`/api/invitations/${invitation.id}`, {
        headers: {
          Authorization: `Bearer ${tourOwner.accessToken}`,
          // No CSRF token
        },
      });

      expect(response.status()).toBe(403);
    });
  });
});
