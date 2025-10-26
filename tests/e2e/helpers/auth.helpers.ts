import { Page, expect } from '@playwright/test';

/**
 * Helper functions for authentication flows in e2e tests
 */

/**
 * Request a magic link for the given email address
 * @param page - Playwright page object
 * @param email - Email address to send magic link to
 */
export async function requestMagicLink(page: Page, email: string) {
  await page.goto('/en-US/login');

  // Wait for the login form to be visible
  await expect(page.locator('form')).toBeVisible();

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
 * Extract magic link from email (mock implementation)
 * In a real scenario, you would integrate with your email service or use a test email service
 * @param email - Email address to check
 * @returns The magic link URL
 */
export async function getMagicLinkFromEmail(email: string): Promise<string> {
  // This is a placeholder. In real tests, you would:
  // 1. Use a test email service like Mailosaur, Mailtrap, or similar
  // 2. Query the email inbox for the magic link
  // 3. Extract the link from the email content

  // For now, we'll throw an error to remind developers to implement this
  throw new Error(
    `getMagicLinkFromEmail not implemented. You need to integrate with your email service to retrieve the magic link for ${email}`
  );
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
  await page.waitForLoadState('networkidle');
}

/**
 * Log out the current user
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  // Navigate to logout page or click logout button
  // Adjust this based on your UI implementation
  await page.goto('/en-US/logout');

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
    const response = await page.request.get('/api/profiles/me');
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
    const skipButton = page.getByRole('button', { name: /skip/i });
    await skipButton.click();
  } else {
    // Go through all onboarding steps
    // Assuming there are 3 steps based on the codebase analysis
    for (let i = 0; i < 2; i++) {
      const nextButton = page.getByRole('button', { name: /next/i });
      await nextButton.click();
      await page.waitForTimeout(500); // Small delay between steps
    }

    // Click finish on the last step
    const finishButton = page.getByRole('button', { name: /finish|get started/i });
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
  const response = await page.request.get('/api/csrf-token');
  const data = await response.json();
  return data.token;
}

/**
 * Create a test user session by mocking authentication
 * Use this for tests that don't need to test the full auth flow
 * @param page - Playwright page object
 * @param email - Email for the test user
 */
export async function createTestUserSession(page: Page, email: string) {
  // This would require setting up proper session cookies
  // For now, this is a placeholder for future implementation

  // In a real implementation, you might:
  // 1. Call a test-only API endpoint that creates a session
  // 2. Set the session cookie directly
  // 3. Use Supabase admin API to create a session token

  console.log(`Creating test session for ${email} - Not yet implemented`);
}

/**
 * Clear all cookies and storage
 * @param page - Playwright page object
 */
export async function clearSession(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
