import { Page } from "@playwright/test";

/**
 * Helper functions for authentication in tests
 */

/**
 * Mock authenticated session by setting cookies
 * Note: This is a simplified version. In real scenario, you might need to:
 * 1. Use Supabase test user credentials
 * 2. Go through actual magic link flow
 * 3. Or use API to create session tokens
 */
export async function loginAsTestUser(page: Page) {
  // Option 1: Navigate to login page and complete the flow
  // This requires a test email account that can receive magic links
  // await page.goto('/en-US/auth/login');
  // await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
  // await page.click('button[type="submit"]');
  // ... wait for email, get link, navigate to it

  // Option 2: Set session cookies directly if you have access to test tokens
  // This is faster but requires having valid Supabase session tokens
  const testAccessToken = process.env.TEST_ACCESS_TOKEN;
  const testRefreshToken = process.env.TEST_REFRESH_TOKEN;

  if (testAccessToken && testRefreshToken) {
    await page.context().addCookies([
      {
        name: "sb-access-token",
        value: testAccessToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
      {
        name: "sb-refresh-token",
        value: testRefreshToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ]);
  }

  // Option 3: Use Supabase Admin API to create a test session
  // This requires admin privileges and is the most reliable method for testing
}

/**
 * Logout current user
 */
export async function logout(page: Page) {
  await page.goto("/en-US/auth/logout");
  // Wait for logout to complete
  await page.waitForURL(/\/en-US\/auth\/login|\/en-US$/);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Try to access a protected page
  await page.goto("/en-US/tours");

  // If we're redirected to login, user is not authenticated
  const url = page.url();
  return !url.includes("/auth/login");
}

/**
 * Create a test tour via API
 * This is useful for setting up test data
 */
export async function createTestTour(
  page: Page,
  tourData: {
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  // Use API to create tour
  const response = await page.request.post("/api/tours", {
    data: tourData,
  });

  if (!response.ok()) {
    throw new Error(`Failed to create test tour: ${response.status()}`);
  }

  return response.json();
}

/**
 * Clean up test data
 */
export async function cleanupTestData(page: Page) {
  // Delete test tours, invitations, etc.
  // This should be implemented based on your API endpoints
}
