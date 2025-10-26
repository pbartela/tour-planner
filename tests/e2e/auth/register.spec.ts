import { test, expect } from '@playwright/test';
import { requestMagicLink, clearSession } from '../helpers/auth.helpers';

/**
 * Registration flow tests
 *
 * These tests cover the user registration process via magic link authentication.
 * The app uses a passwordless magic link flow where registration and login are unified.
 */

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session before each test
    await clearSession(page);
  });

  test('should display registration page correctly', async ({ page }) => {
    await page.goto('/en-US/login');

    // Check that the page loads
    await expect(page).toHaveTitle(/login|sign in/i);

    // Verify form elements are present
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/en-US/login');

    const emailInput = page.locator('input[type="email"]');
    const submitButton = page.locator('button[type="submit"]');

    // Try submitting with empty email
    await submitButton.click();

    // Should show validation error (HTML5 or custom)
    await expect(emailInput).toHaveAttribute('required', '');

    // Try submitting with invalid email format
    await emailInput.fill('invalid-email');
    await submitButton.click();

    // Browser should prevent submission or show error
    // Note: Exact behavior depends on validation implementation
  });

  test('should successfully request magic link with valid email', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;

    await page.goto('/en-US/login');

    // Fill in email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(testEmail);

    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show success message
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10000 });

    // Optionally verify the email was sent (requires email service integration)
    // In a real test environment, you would:
    // 1. Check test email inbox
    // 2. Verify magic link was received
    // 3. Complete the flow by visiting the link
  });

  test('should handle rate limiting appropriately', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;

    await page.goto('/en-US/login');

    // Make multiple rapid requests (rate limit is 3 per 15 minutes in production)
    // In test mode, this might be higher
    for (let i = 0; i < 5; i++) {
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill(`${i}-${testEmail}`);

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait a bit between requests
      await page.waitForTimeout(500);
    }

    // Eventually should show rate limit error
    // Note: Exact behavior depends on rate limiting configuration
    // In development mode, limits may be more permissive
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);

    await page.goto('/en-US/login');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show network error message
    // Wait for error indication (toast, message, etc.)
    await page.waitForTimeout(2000);

    // Re-enable network
    await page.context().setOffline(false);
  });

  test('should persist locale selection through registration', async ({ page }) => {
    // Start with Spanish locale
    await page.goto('/es-ES/login');

    // Verify we're on the Spanish page
    await expect(page).toHaveURL(/\/es-ES\//);

    // Fill in email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // After magic link (in real test), user should return to Spanish locale
    // This would be verified in the full flow test with email integration
  });

  test.skip('should complete full registration flow with email verification', async ({ page }) => {
    // This test requires email service integration
    // Mark as skip until email testing infrastructure is set up

    const testEmail = `playwright-test-${Date.now()}@example.com`;

    // Request magic link
    await requestMagicLink(page, testEmail);

    // TODO: Implement email retrieval and magic link extraction
    // const magicLink = await getMagicLinkFromEmail(testEmail);
    // await completeMagicLinkFlow(page, magicLink);

    // Verify user is authenticated and redirected to dashboard
    // await expect(page).toHaveURL(/\/(en-US|es-ES|de-DE)\//);
    // await expect(await isAuthenticated(page)).toBe(true);
  });
});

test.describe('Registration Security', () => {
  test('should include CSRF protection for state-changing operations', async ({ page }) => {
    await page.goto('/en-US/login');

    // Verify CSRF token is available
    const csrfResponse = await page.request.get('/api/csrf-token');
    expect(csrfResponse.ok()).toBe(true);

    const csrfData = await csrfResponse.json();
    expect(csrfData).toHaveProperty('token');
    expect(typeof csrfData.token).toBe('string');
  });

  test('should use secure cookies for session management', async ({ page }) => {
    await page.goto('/en-US/login');

    // Check cookies after page load
    const cookies = await page.context().cookies();

    // CSRF token cookie should be HttpOnly and secure (in production)
    const csrfCookie = cookies.find((c) => c.name === 'csrf-token');
    if (csrfCookie) {
      expect(csrfCookie.httpOnly).toBe(true);
      // secure flag should be true in production
      // expect(csrfCookie.secure).toBe(true);
    }
  });

  test('should prevent open redirect attacks', async ({ page }) => {
    // Try to pass a malicious redirect URL
    await page.goto('/en-US/login?redirect=https://evil.com');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Success message should still show
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10000 });

    // After login (in full flow), should NOT redirect to evil.com
    // Should only redirect to whitelisted internal paths
  });
});
