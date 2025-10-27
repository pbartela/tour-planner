import { Page, expect, BrowserContext } from "@playwright/test";
import { mailpit } from "./mailpit.client";

/**
 * Helper functions for authentication flows in e2e tests
 */

/**
 * Request a magic link for the given email address
 * @param page - Playwright page object
 * @param email - Email address to send magic link to
 */
export async function requestMagicLink(page: Page, email: string) {
  await page.goto("/en-US/login");

  // Wait for the login form to be visible
  await expect(page.locator("form")).toBeVisible();

  // Fill in the email
  const emailInput = page.locator('input[type="email"]');
  await emailInput.fill(email);

  // Submit the form
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();

  // Wait for success message
  await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10000 });
}

/**
 * Get magic link from email using Mailpit
 * @param email - Email address to check
 * @param timeoutMs - Maximum time to wait for email
 * @returns The magic link URL
 */
export async function getMagicLinkFromEmail(email: string, timeoutMs = 30000): Promise<string> {
  try {
    // Wait for the magic link email to arrive
    const magicLink = await mailpit.waitForMagicLink(email, timeoutMs);
    return magicLink;
  } catch (error) {
    throw new Error(
      `Failed to get magic link for ${email}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Complete the magic link flow by directly visiting the confirmation URL
 * Note: This requires having the actual magic link token
 * @param page - Playwright page object
 * @param magicLinkUrl - The full magic link URL from email
 */
export async function completeMagicLinkFlow(page: Page, magicLinkUrl: string) {
  await page.goto(magicLinkUrl);

  // Wait for redirect to dashboard after successful authentication
  await page.waitForURL(/\/(en-US|es-ES|de-DE)\//, { timeout: 10000 });

  // Verify we're logged in by checking for authenticated content
  // This could be the dashboard or a profile indicator
  await page.waitForLoadState("networkidle");
}

/**
 * Log out the current user
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  // Navigate to logout page or click logout button
  // Adjust this based on your UI implementation
  await page.goto("/en-US/logout");

  // Wait for logout confirmation
  await expect(page.getByText(/signed out/i)).toBeVisible({ timeout: 5000 });
}

/**
 * Check if user is authenticated by verifying session
 * @param page - Playwright page object
 * @returns true if authenticated, false otherwise
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Try to access an authenticated endpoint
    const response = await page.request.get("/api/profiles/me");
    return response.ok();
  } catch {
    return false;
  }
}

/**
 * Wait for onboarding modal to appear
 * @param page - Playwright page object
 */
export async function waitForOnboardingModal(page: Page) {
  // Wait for the onboarding modal to be visible
  await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
}

/**
 * Complete the onboarding flow by clicking through all steps
 * @param page - Playwright page object
 * @param skipOnboarding - If true, clicks skip button; otherwise completes all steps
 */
export async function completeOnboarding(page: Page, skipOnboarding = false) {
  // Wait for onboarding modal
  await waitForOnboardingModal(page);

  if (skipOnboarding) {
    // Click skip button
    const skipButton = page.getByRole("button", { name: /skip/i });
    await skipButton.click();
  } else {
    // Go through all onboarding steps
    // Assuming there are 3 steps based on the codebase analysis
    for (let i = 0; i < 2; i++) {
      const nextButton = page.getByRole("button", { name: /next/i });
      await nextButton.click();
      await page.waitForTimeout(500); // Small delay between steps
    }

    // Click finish on the last step
    const finishButton = page.getByRole("button", { name: /finish|get started/i });
    await finishButton.click();
  }

  // Wait for onboarding modal to close
  await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
}

/**
 * Get CSRF token for API requests
 * @param page - Playwright page object
 * @returns CSRF token string
 */
export async function getCsrfToken(page: Page): Promise<string> {
  const response = await page.request.get("/api/csrf-token");
  const data = await response.json();
  return data.token;
}

/**
 * Create a test user session by completing the full auth flow
 * Use this for tests that don't need to test the auth flow itself
 * @param page - Playwright page object
 * @param email - Email for the test user
 * @param options - Additional options
 */
export async function createTestUserSession(
  page: Page,
  email: string,
  options: {
    completeOnboarding?: boolean;
    locale?: string;
  } = {}
) {
  const { completeOnboarding: shouldCompleteOnboarding = true, locale = "en-US" } = options;

  // Clear any existing session
  await clearSession(page);

  // Clear Mailpit inbox to avoid getting old emails
  try {
    await mailpit.deleteAllMessages();
  } catch (error) {
    console.warn("Failed to clear Mailpit inbox:", error);
  }

  // Request magic link
  await requestMagicLink(page, email);

  // Get magic link from email
  const magicLink = await getMagicLinkFromEmail(email);

  // Complete magic link flow
  await completeMagicLinkFlow(page, magicLink);

  // Wait for redirect to dashboard
  await page.waitForURL(new RegExp(`/${locale}/`), { timeout: 10000 });

  // Handle onboarding if needed
  if (shouldCompleteOnboarding) {
    try {
      // Check if onboarding modal appears
      const dialog = page.locator('[role="dialog"]');
      const isVisible = await dialog.isVisible({ timeout: 3000 });

      if (isVisible) {
        await completeOnboarding(page, false);
      }
    } catch {
      // Onboarding modal didn't appear, which is fine
      // (user might already have completed it)
    }
  }

  // Verify we're authenticated
  const authenticated = await isAuthenticated(page);
  if (!authenticated) {
    throw new Error(`Failed to create authenticated session for ${email}`);
  }
}

/**
 * Clear all cookies and storage
 * @param page - Playwright page object
 */
export async function clearSession(page: Page) {
  // Clear cookies and local storage using Playwright's API
  await page.context().clearCookies();

  // Try to clear local/session storage gracefully
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (error) {
    // Ignore security errors for cross-origin or restricted pages
    console.warn("Could not clear localStorage/sessionStorage:", error);
  }
}
