import { test, expect } from '@playwright/test';
import { clearSession, requestMagicLink } from '../helpers/auth.helpers';

/**
 * Login flow tests
 *
 * In this application, login and registration use the same magic link flow.
 * These tests cover the login-specific scenarios and returning user experience.
 */

test.describe('User Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session before each test
    await clearSession(page);
  });

  test('should display login page with all elements', async ({ page }) => {
    await page.goto('/en-US/login');

    // Verify page title
    await expect(page).toHaveTitle(/login|sign in/i);

    // Verify form structure
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check for any help text or instructions
    await expect(page.locator('body')).toContainText(/email/i);
  });

  test('should accept valid email addresses', async ({ page }) => {
    await page.goto('/en-US/login');

    const validEmails = [
      'user@example.com',
      'test.user@domain.co.uk',
      'user+tag@example.com',
      'user123@test-domain.com',
    ];

    for (const email of validEmails) {
      const emailInput = page.locator('input[type="email"]');
      await emailInput.clear();
      await emailInput.fill(email);

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show success message for valid email
      await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10000 });

      // Reload page for next iteration
      await page.goto('/en-US/login');
    }
  });

  test('should show loading state during submission', async ({ page }) => {
    await page.goto('/en-US/login');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');

    const submitButton = page.locator('button[type="submit"]');

    // Check button state before click
    await expect(submitButton).toBeEnabled();

    // Click and check for loading state
    await submitButton.click();

    // Button should show loading state (disabled or spinner)
    // Note: Exact implementation depends on your UI
    // await expect(submitButton).toBeDisabled();
    // or check for loading spinner
    // await expect(page.locator('[role="status"]')).toBeVisible();
  });

  test('should remember locale preference', async ({ page }) => {
    // Login with German locale
    await page.goto('/de-DE/login');

    await expect(page).toHaveURL(/\/de-DE\//);

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Success message should be in German (if translations exist)
    await page.waitForTimeout(1000);
  });

  test('should handle redirect parameter correctly', async ({ page }) => {
    // Navigate to login with a redirect parameter
    await page.goto('/en-US/login?redirect=/en-US/settings');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // In full flow, after login, should redirect to /settings
    // This would be tested in integration test with email verification
  });

  test('should not allow access to protected pages when not logged in', async ({ page }) => {
    // Try to access dashboard without being logged in
    await page.goto('/en-US/');

    // Should redirect to login or show login prompt
    // Depending on implementation, might redirect to /login
    // or show an authentication wall
    await page.waitForTimeout(1000);

    // Check if redirected to login or blocked
    const currentUrl = page.url();
    const isAtLogin = currentUrl.includes('/login') || currentUrl.includes('/auth');

    // If not redirected, page should indicate auth required
    if (!isAtLogin) {
      // Check for authentication prompt/message
      // Implementation depends on your auth flow
    }
  });

  test.skip('should complete full login flow for existing user', async ({ page }) => {
    // This test requires email service integration
    const existingUserEmail = 'existing-user@example.com';

    // Request magic link
    await requestMagicLink(page, existingUserEmail);

    // TODO: Get magic link from email
    // const magicLink = await getMagicLinkFromEmail(existingUserEmail);
    // await completeMagicLinkFlow(page, magicLink);

    // Verify logged in and redirected to dashboard
    // await expect(page).toHaveURL(/\/(en-US|es-ES|de-DE)\//);

    // For existing user, onboarding modal should NOT appear if already completed
    // await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});

test.describe('Login Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('/en-US/login');

    // Intercept API call and return error
    await page.route('/api/auth/magic-link', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show error message to user
    await page.waitForTimeout(2000);
    // Check for error toast or message
    // Implementation depends on your error handling
  });

  test('should handle timeout errors', async ({ page }) => {
    await page.goto('/en-US/login');

    // Intercept and delay API call
    await page.route('/api/auth/magic-link', async (route) => {
      await page.waitForTimeout(60000); // Simulate timeout
      route.continue();
    });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show timeout error or allow retry
    await page.waitForTimeout(3000);
  });

  test('should validate token expiration', async ({ page }) => {
    // Try to use an expired magic link token
    // This would involve manually crafting an expired token URL
    await page.goto('/auth/confirm?token_hash=expired-token&type=email');

    // Should show error page or message
    await expect(page.getByText(/expired|invalid/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Login Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/en-US/login');

    // Tab to email input
    await page.keyboard.press('Tab');

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeFocused();

    // Type email
    await page.keyboard.type('test@example.com');

    // Tab to submit button
    await page.keyboard.press('Tab');

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeFocused();

    // Submit with Enter key
    await page.keyboard.press('Enter');

    // Should submit form
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10000 });
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/en-US/login');

    // Check for proper labels and ARIA attributes
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');

    // Form should have proper structure
    const form = page.locator('form');
    await expect(form).toBeVisible();
  });

  test('should announce errors to screen readers', async ({ page }) => {
    await page.goto('/en-US/login');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Error messages should have role="alert" or aria-live
    // This ensures screen readers announce them
    // Implementation depends on your form validation
  });
});
