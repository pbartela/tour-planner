import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import * as dotenv from "dotenv";

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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to create a test invitation OTP
async function createTestOTP(
  email: string,
  options: { expired?: boolean; used?: boolean } = {}
): Promise<{ otpToken: string; invitationToken: string }> {
  const otpToken = crypto.randomBytes(32).toString("hex");
  const invitationToken = crypto.randomBytes(16).toString("hex");

  // Set expiration: 1 hour from now (or in the past if expired)
  const expiresAt = new Date();
  if (options.expired) {
    expiresAt.setHours(expiresAt.getHours() - 1); // 1 hour ago
  } else {
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now
  }

  // Insert OTP into database
  const { error } = await supabase.from("invitation_otp").insert({
    email,
    otp_token: otpToken,
    invitation_token: invitationToken,
    expires_at: expiresAt.toISOString(),
    used: options.used || false,
  });

  if (error) {
    throw new Error(`Failed to create test OTP: ${error.message}`);
  }

  return { otpToken, invitationToken };
}

// Helper function to create a test invitation
async function createTestInvitation(
  tourId: string,
  inviterId: string,
  email: string,
  token: string
): Promise<void> {
  const { error } = await supabase.from("invitations").insert({
    tour_id: tourId,
    inviter_id: inviterId,
    email,
    token,
    status: "pending",
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  });

  if (error) {
    throw new Error(`Failed to create test invitation: ${error.message}`);
  }
}

// Cleanup function to remove test data
async function cleanupTestOTP(otpToken: string): Promise<void> {
  await supabase.from("invitation_otp").delete().eq("otp_token", otpToken);
}

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
    await cleanupTestOTP(otpToken);
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

    const existingUserId = newUser!.user.id;

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

  test("should reject missing OTP parameter", async ({ page }) => {
    await page.goto("/en-US/auth/verify-invitation");

    // Should redirect to error page
    await expect(page).toHaveURL(/\/en-US\/auth\/error\?error=invalid_link/);
  });

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

  test.beforeEach(async () => {
    // Create an expired OTP
    const result = await createTestOTP(testEmail, { expired: true });
    otpToken = result.otpToken;
  });

  test.afterEach(async () => {
    await cleanupTestOTP(otpToken);
    await cleanupTestUser(testEmail);
  });

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

  test.beforeEach(async () => {
    // Create an already-used OTP
    const result = await createTestOTP(testEmail, { used: true });
    otpToken = result.otpToken;
  });

  test.afterEach(async () => {
    await cleanupTestOTP(otpToken);
    await cleanupTestUser(testEmail);
  });

  test("should reject already-used OTP token", async ({ page }) => {
    await page.goto(`/en-US/auth/verify-invitation?otp=${otpToken}`);

    // Should redirect to error page with used error
    await expect(page).toHaveURL(/\/en-US\/auth\/error\?error=link_used/);
  });

  test("should mark OTP as used after first successful verification", async ({ page }) => {
    // Create a fresh, unused OTP
    const { otpToken: freshOtp } = await createTestOTP(`fresh-${Date.now()}@example.com`);

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
    await cleanupTestOTP(freshOtp);
    await cleanupTestUser(`fresh-${Date.now()}@example.com`);
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
