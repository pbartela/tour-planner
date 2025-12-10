import { test, expect } from "@playwright/test";
import * as dotenv from "dotenv";
import {
  createTestUser,
  createTestTour,
  createTestParticipant,
  getCsrfToken,
  cleanupTestUser,
  cleanupTestTour,
  getInvitationsForTour,
  pgPool,
} from "../../helpers/invitation-api-helpers";

// Load environment variables
dotenv.config();

/**
 * E2E Tests for POST /api/tours/[tourId]/invitations
 * Tests the invitation sending endpoint with various scenarios
 */

test.describe("POST /api/tours/[tourId]/invitations", () => {
  let tourOwner: Awaited<ReturnType<typeof createTestUser>>;
  let testTour: Awaited<ReturnType<typeof createTestTour>>;
  let csrfToken: string;

  test.beforeEach(async ({ request }) => {
    // Create tour owner
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
    test("should send invitation to single valid email", async ({ request }) => {
      const response = await request.post(
        `/api/tours/${testTour.id}/invitations`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tourOwner.accessToken}`,
            "x-csrf-token": csrfToken,
          },
          data: {
            emails: ["invitee@example.com"],
          },
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.sent).toEqual(["invitee@example.com"]);
      expect(body.skipped).toEqual([]);
      expect(body.errors).toEqual([]);

      // Verify invitation was created in database
      const invitations = await getInvitationsForTour(testTour.id);
      expect(invitations).toHaveLength(1);
      expect(invitations[0]?.email).toBe("invitee@example.com");
    });

    test("should send invitations to multiple valid emails", async ({ request }) => {
      const emails = [
        "user1@example.com",
        "user2@example.com",
        "user3@example.com",
      ];

      const response = await request.post(
        `/api/tours/${testTour.id}/invitations`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tourOwner.accessToken}`,
            "x-csrf-token": csrfToken,
          },
          data: { emails },
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.sent).toHaveLength(3);
      expect(body.sent).toEqual(expect.arrayContaining(emails));

      // Verify invitations were created
      const invitations = await getInvitationsForTour(testTour.id);
      expect(invitations).toHaveLength(3);
    });

    test("should skip already invited emails", async ({ request }) => {
      // Send first invitation
      await request.post(`/api/tours/${testTour.id}/invitations`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tourOwner.accessToken}`,
          "x-csrf-token": csrfToken,
        },
        data: {
          emails: ["duplicate@example.com"],
        },
      });

      // Try to send again
      const response = await request.post(
        `/api/tours/${testTour.id}/invitations`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tourOwner.accessToken}`,
            "x-csrf-token": csrfToken,
          },
          data: {
            emails: ["duplicate@example.com", "new@example.com"],
          },
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.sent).toEqual(["new@example.com"]);
      expect(body.skipped).toEqual(["duplicate@example.com"]);
    });

    test("should skip existing participants", async ({ request }) => {
      // Create a participant
      const participant = await createTestUser(`participant-${Date.now()}@test.com`);
      await createTestParticipant(testTour.id, participant.id);

      const response = await request.post(
        `/api/tours/${testTour.id}/invitations`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tourOwner.accessToken}`,
            "x-csrf-token": csrfToken,
          },
          data: {
            emails: [participant.email, "new@example.com"],
          },
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.sent).toEqual(["new@example.com"]);
      expect(body.skipped).toEqual([participant.email.toLowerCase()]);

      // Cleanup participant
      await cleanupTestUser(participant.id);
    });
  });

  test.describe("Validation Scenarios", () => {
    test("should reject invalid tour ID format", async ({ request }) => {
      const response = await request.post("/api/tours/invalid-id/invitations", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tourOwner.accessToken}`,
          "x-csrf-token": csrfToken,
        },
        data: {
          emails: ["test@example.com"],
        },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    test("should reject empty emails array", async ({ request }) => {
      const response = await request.post(
        `/api/tours/${testTour.id}/invitations`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tourOwner.accessToken}`,
            "x-csrf-token": csrfToken,
          },
          data: {
            emails: [],
          },
        }
      );

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    test("should reject request exceeding max 50 emails", async ({ request }) => {
      const emails = Array.from({ length: 51 }, (_, i) => `user${i}@example.com`);

      const response = await request.post(
        `/api/tours/${testTour.id}/invitations`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tourOwner.accessToken}`,
            "x-csrf-token": csrfToken,
          },
          data: { emails },
        }
      );

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    test("should reject invalid email formats", async ({ request }) => {
      const response = await request.post(
        `/api/tours/${testTour.id}/invitations`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tourOwner.accessToken}`,
            "x-csrf-token": csrfToken,
          },
          data: {
            emails: ["not-an-email", "missing@", "@no-local.com"],
          },
        }
      );

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    test("should validate CSRF token presence", async ({ request }) => {
      const response = await request.post(
        `/api/tours/${testTour.id}/invitations`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tourOwner.accessToken}`,
            // No CSRF token
          },
          data: {
            emails: ["test@example.com"],
          },
        }
      );

      expect(response.status()).toBe(403);
    });
  });

  test.describe("Authorization Scenarios", () => {
    test("should reject unauthenticated request", async ({ request }) => {
      const response = await request.post(
        `/api/tours/${testTour.id}/invitations`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          data: {
            emails: ["test@example.com"],
          },
        }
      );

      expect(response.status()).toBe(401);
    });

    test("should reject when user is not tour owner", async ({ request }) => {
      // Create another user who is not the owner
      const otherUser = await createTestUser(`other-${Date.now()}@test.com`);

      const response = await request.post(
        `/api/tours/${testTour.id}/invitations`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${otherUser.accessToken}`,
            "x-csrf-token": csrfToken,
          },
          data: {
            emails: ["test@example.com"],
          },
        }
      );

      expect(response.status()).toBe(403);

      // Cleanup
      await cleanupTestUser(otherUser.id);
    });
  });
});

test.afterAll(async () => {
  await pgPool.end();
});
