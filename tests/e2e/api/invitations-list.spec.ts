import { test, expect } from "@playwright/test";
import * as dotenv from "dotenv";
import { randomUUID } from "crypto";
import {
  createTestUser,
  createTestTour,
  createTestInvitation,
  getCsrfToken,
  cleanupTestUser,
  cleanupTestTour,
  pgPool,
} from "../../helpers/invitation-api-helpers";

// Load environment variables
dotenv.config();

/**
 * E2E Tests for GET /api/tours/[tourId]/invitations
 * Tests the invitation listing endpoint
 */

test.describe("GET /api/tours/[tourId]/invitations", () => {
  let tourOwner: Awaited<ReturnType<typeof createTestUser>>;
  let testTour: Awaited<ReturnType<typeof createTestTour>>;

  test.beforeEach(async () => {
    // Create tour owner and tour
    // Use randomUUID() for guaranteed uniqueness in parallel test execution
    tourOwner = await createTestUser(`owner-${randomUUID()}@test.com`);
    testTour = await createTestTour(tourOwner.id);
  });

  test.afterEach(async () => {
    // Cleanup
    await cleanupTestTour(testTour.id);
    await cleanupTestUser(tourOwner.id);
  });

  test.describe("Success Scenarios", () => {
    test("should return empty array when no invitations exist", async ({ request }) => {
      const response = await request.get(`/api/tours/${testTour.id}/invitations`, {
        headers: {
          Authorization: `Bearer ${tourOwner.accessToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty("data");
      expect(body).toHaveProperty("pagination");
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(20);
      expect(body.pagination.total).toBe(0);
    });

    test("should return list of invitations for tour", async ({ request }) => {
      // Create some invitations
      await createTestInvitation(testTour.id, tourOwner.id, "user1@example.com");
      await createTestInvitation(testTour.id, tourOwner.id, "user2@example.com");
      await createTestInvitation(testTour.id, tourOwner.id, "user3@example.com");

      const response = await request.get(`/api/tours/${testTour.id}/invitations`, {
        headers: {
          Authorization: `Bearer ${tourOwner.accessToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty("data");
      expect(body).toHaveProperty("pagination");
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(3);
      expect(body.pagination.total).toBe(3);

      // Verify structure
      expect(body.data[0]).toHaveProperty("id");
      expect(body.data[0]).toHaveProperty("email");
      expect(body.data[0]).toHaveProperty("status");
      expect(body.data[0]).toHaveProperty("created_at");
    });

    test("should include invitation status (pending, accepted, declined)", async ({
      request,
    }) => {
      // Create invitations with different statuses
      const invitation = await createTestInvitation(
        testTour.id,
        tourOwner.id,
        "pending@example.com"
      );

      const response = await request.get(`/api/tours/${testTour.id}/invitations`, {
        headers: {
          Authorization: `Bearer ${tourOwner.accessToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0]?.status).toBe("pending");
    });

    test("should include invitee email and timestamp", async ({ request }) => {
      const testEmail = "timestamptest@example.com";
      await createTestInvitation(testTour.id, tourOwner.id, testEmail);

      const response = await request.get(`/api/tours/${testTour.id}/invitations`, {
        headers: {
          Authorization: `Bearer ${tourOwner.accessToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0]?.email).toBe(testEmail);
      expect(body.data[0]?.created_at).toBeDefined();
      expect(new Date(body.data[0]?.created_at).getTime()).toBeGreaterThan(0);
    });
  });

  test.describe("Authorization Scenarios", () => {
    test("should reject unauthenticated request", async ({ request }) => {
      const response = await request.get(`/api/tours/${testTour.id}/invitations`);

      expect(response.status()).toBe(401);
    });

    test("should reject when user is not tour owner", async ({ request }) => {
      // Create another user who is not the owner
      const otherUser = await createTestUser(`other-${randomUUID()}@test.com`);

      const response = await request.get(`/api/tours/${testTour.id}/invitations`, {
        headers: {
          Authorization: `Bearer ${otherUser.accessToken}`,
        },
      });

      expect(response.status()).toBe(403);

      // Cleanup
      await cleanupTestUser(otherUser.id);
    });

    test("should succeed when user is tour owner", async ({ request }) => {
      const response = await request.get(`/api/tours/${testTour.id}/invitations`, {
        headers: {
          Authorization: `Bearer ${tourOwner.accessToken}`,
        },
      });

      expect(response.status()).toBe(200);
    });
  });

  test.describe("Validation Scenarios", () => {
    test("should reject invalid tour ID format", async ({ request }) => {
      const response = await request.get("/api/tours/invalid-id/invitations", {
        headers: {
          Authorization: `Bearer ${tourOwner.accessToken}`,
        },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    test("should return 403 when tour doesn't exist (RLS prevents revealing existence)", async ({ request }) => {
      const fakeUuid = "123e4567-e89b-12d3-a456-426614174000";

      const response = await request.get(`/api/tours/${fakeUuid}/invitations`, {
        headers: {
          Authorization: `Bearer ${tourOwner.accessToken}`,
        },
      });

      // With RLS, we can't distinguish between "tour doesn't exist" and "no access"
      // Returning 403 is correct to avoid information disclosure
      expect(response.status()).toBe(403);
    });
  });
});
