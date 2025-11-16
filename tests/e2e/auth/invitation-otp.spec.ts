import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import * as dotenv from "dotenv";
import { Pool } from "pg";
import type { Database } from "../../../src/db/database.types";

// Load environment variables from .env file
dotenv.config();

/**
 * E2E Tests for OTP Verification Flow
 *
 * These tests cover the invitation OTP authentication flow:
 * - OTP generation and verification
 * - Account creation for new users
 * - Session creation and redirection
 * - Security measures (expiration, rate limiting, one-time use)
 */

// Setup Supabase admin client for test data manipulation
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseServiceKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is not set. Please ensure .env file is present with valid credentials."
  );
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

const defaultDbUrl =
  process.env.TEST_DATABASE_URL ||
  (process.env.CI
    ? "postgres://postgres:postgres@supabase-db:5432/postgres"
    : "postgres://postgres:postgres@localhost:54322/postgres");

const pgPool = new Pool({
  connectionString: defaultDbUrl,
});

type InvitationSetupOptions = { expired?: boolean; used?: boolean };

const ANON_USER_ID = "00000000-0000-0000-0000-000000000000";

interface InviterContext {
  userId: string;
  tourId: string;
  email: string;
}

let inviterContext: InviterContext | null = null;

async function createInviterContext(): Promise<InviterContext> {
  const ownerId = ANON_USER_ID;
  const inviterEmail = "anonymized-user@tour-planner.test";
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { rows } = await pgPool.query<{ id: string }>(
    `insert into public.tours (
       owner_id,
       title,
       destination,
       description,
       start_date,
       end_date
     ) values ($1, $2, $3, $4, $5, $6)
     returning id`,
    [
      ownerId,
      `Test Invitation Tour ${startDate.getTime()}`,
      "Invitation City",
      "E2E invitation test tour",
      startDate.toISOString(),
      endDate.toISOString(),
    ]
  );

  const tourId = rows[0]?.id;

  if (!tourId) {
    throw new Error("Failed to create test tour: insert returned no ID");
  }

  return {
    userId: ownerId,
    tourId,
    email: inviterEmail,
  };
}

async function cleanupInviterContext(context: InviterContext | null): Promise<void> {
  if (!context) {
    return;
  }

  await pgPool.query("delete from public.invitations where tour_id = $1", [context.tourId]);
  await pgPool.query("delete from public.tours where id = $1", [context.tourId]);
}

// Helper function to create a test invitation OTP linked to a real invitation
async function createTestOTP(
  email: string,
  options: InvitationSetupOptions = {}
): Promise<{ otpToken: string; invitationToken: string }> {
  if (!inviterContext) {
    throw new Error("Inviter context not initialized");
  }

  const invitationToken = crypto.randomBytes(16).toString("hex");
  const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await pgPool.query(
    `insert into public.invitations (
       tour_id,
       inviter_id,
       email,
       token,
       status,
       expires_at
     ) values ($1, $2, $3, $4, 'pending', $5)`,
    [inviterContext.tourId, inviterContext.userId, email, invitationToken, invitationExpiresAt]
  );

  const otpToken = crypto.randomBytes(32).toString("hex");

  const expiresAt = new Date();
  if (options.expired) {
    expiresAt.setHours(expiresAt.getHours() - 1);
  } else {
    expiresAt.setHours(expiresAt.getHours() + 1);
  }

  await pgPool.query(
    `insert into public.invitation_otp (
       email,
       otp_token,
       invitation_token,
       expires_at,
       used
     ) values ($1, $2, $3, $4, $5)`,
    [email, otpToken, invitationToken, expiresAt.toISOString(), options.used || false]
  );

  return { otpToken, invitationToken };
}

// Cleanup function to remove test data
async function cleanupTestOTP(otpToken?: string, invitationToken?: string): Promise<void> {
  if (otpToken) {
    await pgPool.query("delete from public.invitation_otp where otp_token = $1", [otpToken]);
  }
  if (invitationToken) {
    await pgPool.query("delete from public.invitations where token = $1", [invitationToken]);
  }
}

test.beforeAll(async () => {
  inviterContext = await createInviterContext();
});

test.afterAll(async () => {
  await cleanupInviterContext(inviterContext);
  inviterContext = null;
  await pgPool.end();
});

// Helper function to get user by email (Supabase v2 API)
async function getUserByEmail(email: string) {
  const { data: usersList } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (usersList?.users) {
    const user = usersList.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    return { user };
  }
  return { user: undefined };
}

async function cleanupTestUser(email: string): Promise<void> {
  try {
    const { user } = await getUserByEmail(email);
    if (user) {
      await supabase.auth.admin.deleteUser(user.id);
    }
  } catch (error) {
    // Ignore cleanup errors in tests
    console.warn("Cleanup failed for user:", email, error);
  }
}

test.describe("OTP Verification - Valid Scenarios", () => {
  const testEmail = `test-otp-${Date.now()}@example.com`;
  let otpToken: string;
  let invitationToken: string;

  test.beforeEach(async () => {
    // Create a fresh OTP for each test
    const result = await createTestOTP(testEmail);
    otpToken = result.otpToken;
    invitationToken = result.invitationToken;
  });

  test.afterEach(async () => {
    // Cleanup
    await cleanupTestOTP(otpToken, invitationToken);
    await cleanupTestUser(testEmail);
  });

  test("should successfully verify OTP and create new user account", async ({ page }) => {
    // Navigate to OTP verification URL
    await page.goto(`/en-US/auth/verify-invitation?otp=${otpToken}`);

    // Should redirect to invitation acceptance page
    await expect(page).toHaveURL(new RegExp(`/en-US/invite\\?token=${invitationToken}`));

    // Verify OTP was marked as used in database
    const { data: otpRecord } = await supabase
      .from("invitation_otp")
      .select("used")
      .eq("otp_token", otpToken)
      .single();

    expect(otpRecord?.used).toBe(true);

    // Verify user account was created
    const { user: userData } = await getUserByEmail(testEmail);
    expect(userData).toBeDefined();
    expect(userData?.email).toBe(testEmail);
    expect(userData?.email_confirmed_at).toBeDefined(); // Email should be auto-confirmed
  });

  test("should successfully verify OTP for existing user", async ({ page }) => {
    // Create user first
    const { data: newUser } = await supabase.auth.admin.createUser({
      email: testEmail,
      email_confirm: true,
    });
    expect(newUser?.user).toBeDefined();

    const existingUserId = newUser?.user?.id;
    if (!existingUserId) {
      throw new Error("Failed to create test user");
    }

    // Navigate to OTP verification URL
    await page.goto(`/en-US/auth/verify-invitation?otp=${otpToken}`);

    // Should redirect to invitation acceptance page
    await expect(page).toHaveURL(new RegExp(`/en-US/invite\\?token=${invitationToken}`));

    // Verify the same user ID is used (no duplicate account created)
    const { user: userData } = await getUserByEmail(testEmail);
    expect(userData?.id).toBe(existingUserId);
  });
});

test.describe("OTP Verification - Invalid Scenarios", () => {
  test("should reject invalid OTP format (too short)", async ({ page }) => {
    const invalidOtp = "short";

    await page.goto(`/en-US/auth/verify-invitation?otp=${invalidOtp}`);

    // Should redirect to error page
    await expect(page).toHaveURL(/\/en-US\/auth\/error\?error=invalid_link/);
  });

  test("should reject invalid OTP format (too long)", async ({ page }) => {
    const invalidOtp = "a".repeat(128); // Too long

    await page.goto(`/en-US/auth/verify-invitation?otp=${invalidOtp}`);

    // Should redirect to error page
    await expect(page).toHaveURL(/\/en-US\/auth\/error\?error=invalid_link/);
  });

  test("should reject invalid OTP format (non-hex characters)", async ({ page }) => {
    const invalidOtp = "z".repeat(64); // 'z' is not a hex character

    await page.goto(`/en-US/auth/verify-invitation?otp=${invalidOtp}`);

    // Should redirect to error page
    await expect(page).toHaveURL(/\/en-US\/auth\/error\?error=invalid_link/);
  });

  // TODO: OTP verification endpoint redirects to login page instead of error page when OTP parameter is missing
  test("should reject missing OTP parameter", async ({ page }) => {
    await page.goto("/en-US/auth/verify-invitation");

    // Should redirect to error page
    await expect(page).toHaveURL(/\/en-US\/auth\/error\?error=invalid_link/);
  });

  // TODO: OTP verification endpoint redirects to login page instead of error page when OTP token doesn't exist
  test("should reject non-existent OTP token", async ({ page }) => {
    const nonExistentOtp = crypto.randomBytes(32).toString("hex");

    await page.goto(`/en-US/auth/verify-invitation?otp=${nonExistentOtp}`);

    // Should redirect to error page
    await expect(page).toHaveURL(/\/en-US\/auth\/error\?error=invalid_link/);
  });
});

test.describe("OTP Verification - Expiration", () => {
  const testEmail = `test-expired-${Date.now()}@example.com`;
  let otpToken: string;
  let invitationToken: string;

  test.beforeEach(async () => {
    // Create an expired OTP
    const result = await createTestOTP(testEmail, { expired: true });
    otpToken = result.otpToken;
    invitationToken = result.invitationToken;
  });

  test.afterEach(async () => {
    await cleanupTestOTP(otpToken, invitationToken);
    await cleanupTestUser(testEmail);
  });

  // TODO: OTP verification endpoint redirects to login page instead of error page when OTP token is expired
  test("should reject expired OTP token", async ({ page }) => {
    await page.goto(`/en-US/auth/verify-invitation?otp=${otpToken}`);

    // Should redirect to error page with expired error
    await expect(page).toHaveURL(/\/en-US\/auth\/error\?error=link_expired/);

    // Verify user account was NOT created
    const { user: userData } = await getUserByEmail(testEmail);
    expect(userData).toBeUndefined();
  });
});

test.describe("OTP Verification - One-Time Use", () => {
  const testEmail = `test-used-${Date.now()}@example.com`;
  let otpToken: string;
  let invitationToken: string;

  test.beforeEach(async () => {
    // Create an already-used OTP
    const result = await createTestOTP(testEmail, { used: true });
    otpToken = result.otpToken;
    invitationToken = result.invitationToken;
  });

  test.afterEach(async () => {
    await cleanupTestOTP(otpToken, invitationToken);
    await cleanupTestUser(testEmail);
  });

  // TODO: OTP verification endpoint redirects to login page instead of error page when OTP token was already used
  test("should reject already-used OTP token", async ({ page }) => {
    await page.goto(`/en-US/auth/verify-invitation?otp=${otpToken}`);

    // Should redirect to error page with used error
    await expect(page).toHaveURL(/\/en-US\/auth\/error\?error=link_used/);
  });

  test("should mark OTP as used after first successful verification", async ({ page }) => {
    // Create a fresh, unused OTP
    const freshEmail = `fresh-${Date.now()}@example.com`;
    const { otpToken: freshOtp, invitationToken: freshInvitationToken } = await createTestOTP(freshEmail);

    // First verification should succeed
    await page.goto(`/en-US/auth/verify-invitation?otp=${freshOtp}`);
    await expect(page).not.toHaveURL(/\/en-US\/auth\/error/);

    // Verify OTP is marked as used
    const { data: otpRecord } = await supabase
      .from("invitation_otp")
      .select("used")
      .eq("otp_token", freshOtp)
      .single();

    expect(otpRecord?.used).toBe(true);

    // Second attempt should fail
    await page.goto(`/en-US/auth/verify-invitation?otp=${freshOtp}`);
    await expect(page).toHaveURL(/\/en-US\/auth\/error\?error=link_used/);

    // Cleanup
    await cleanupTestOTP(freshOtp, freshInvitationToken);
    await cleanupTestUser(freshEmail);
  });
});

test.describe("OTP Verification - Rate Limiting", () => {
  test("should enforce rate limiting on OTP verification attempts", async ({ page }) => {
    const nonExistentOtp = crypto.randomBytes(32).toString("hex");

    // Make multiple rapid requests to trigger rate limit
    // Production limit: 5 requests per minute
    // Development limit: 50 requests per minute
    const maxAttempts = process.env.NODE_ENV === "production" ? 6 : 51;

    for (let i = 0; i < maxAttempts; i++) {
      await page.goto(`/en-US/auth/verify-invitation?otp=${nonExistentOtp}`);

      // After hitting the rate limit, should get too_many_requests error
      if (i >= (process.env.NODE_ENV === "production" ? 5 : 50)) {
        await expect(page).toHaveURL(/\/en-US\/auth\/error\?error=too_many_requests/);
        break;
      }
    }
  });
});

test.describe("OTP Verification - Security", () => {
  test("should use HTTPS in production", async () => {
    // This test ensures the application enforces HTTPS in production
    // In development/test, HTTP is acceptable
    if (process.env.NODE_ENV === "production") {
      expect(process.env.PUBLIC_SUPABASE_URL).toMatch(/^https:\/\//);
    }
  });

  test("should not expose sensitive data in error responses", async ({ page }) => {
    const invalidOtp = "invalid";

    // Set up response listener to check response body
    const responses: string[] = [];
    page.on("response", async (response) => {
      if (response.url().includes("/auth/verify-invitation")) {
        const body = await response.text().catch(() => "");
        responses.push(body);
      }
    });

    await page.goto(`/en-US/auth/verify-invitation?otp=${invalidOtp}`);

    // Check that no responses contain sensitive data (tokens, database errors, etc.)
    for (const response of responses) {
      expect(response.toLowerCase()).not.toContain("database");
      expect(response.toLowerCase()).not.toContain("supabase");
      expect(response.toLowerCase()).not.toContain("sql");
      expect(response.toLowerCase()).not.toContain("error:");
    }
  });
});
