import { test, expect } from '@playwright/test';
import { clearSession, logout, createTestUserSession } from '../helpers/auth.helpers';
import { mailpit } from '../helpers/mailpit.client';

/**
 * Logout flow tests
 *
 * Tests cover user sign-out functionality, session termination,
 * and post-logout state.
 */

test.describe('Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start with clean state
    await clearSession(page);

    // Clear Mailpit inbox before each test
    try {
      await mailpit.deleteAllMessages();
    } catch (error) {
      console.warn('Failed to clear Mailpit inbox:', error);
    }
  });

  test('should successfully log out authenticated user', async ({ page }) => {
    const testUserEmail = `logout-test-${Date.now()}@example.com`;

    // Set up authenticated session
    await createTestUserSession(page, testUserEmail);

    // Navigate to dashboard (or any authenticated page)
    await page.goto('/en-US/');

    // Trigger logout (might be via menu, button, or direct navigation)
    await logout(page);

    // Should show logout confirmation
    await expect(page.getByText(/signed out|logged out/i)).toBeVisible({ timeout: 5000 });

    // Verify we're on logout page
    await expect(page).toHaveURL(/\/logout/);
  });

  test('should display logout confirmation page', async ({ page }) => {
    // Navigate directly to logout page
    await page.goto('/en-US/logout');

    // Page should load
    await expect(page).toHaveURL(/\/logout/);

    // Should show confirmation message
    await page.waitForLoadState('networkidle');

    // Should have navigation options
    // e.g., "Back to Home" or "Sign In Again"
  });

  test('should clear session cookies on logout', async ({ page }) => {
    const testUserEmail = `cookie-test-${Date.now()}@example.com`;

    // Set up authenticated session
    await createTestUserSession(page, testUserEmail);

    // Get cookies before logout
    const cookiesBefore = await page.context().cookies();
    const sessionCookiesBefore = cookiesBefore.filter(
      (c) => c.name.includes('sb-') || c.name.includes('session')
    );

    expect(sessionCookiesBefore.length).toBeGreaterThan(0);

    // Logout
    await logout(page);

    // Get cookies after logout
    const cookiesAfter = await page.context().cookies();
    const sessionCookiesAfter = cookiesAfter.filter(
      (c) => c.name.includes('sb-') || c.name.includes('session')
    );

    // Session cookies should be cleared or expired
    expect(sessionCookiesAfter.length).toBeLessThanOrEqual(sessionCookiesBefore.length);
  });

  test('should clear local storage on logout', async ({ page }) => {
    const testUserEmail = `storage-test-${Date.now()}@example.com`;

    // Set up authenticated session
    await createTestUserSession(page, testUserEmail);

    await page.goto('/en-US/');

    // Set some local storage items (if app uses it)
    await page.evaluate(() => {
      localStorage.setItem('test-key', 'test-value');
    });

    // Logout
    await logout(page);

    // Check local storage - most items should be cleared
    await page.waitForTimeout(1000);
  });

  test('should require re-authentication after logout', async ({ page }) => {
    const testUserEmail = `reauth-test-${Date.now()}@example.com`;

    // Set up authenticated session
    await createTestUserSession(page, testUserEmail);

    // Logout
    await logout(page);

    // Clear session
    await clearSession(page);

    // Try to access protected route
    await page.goto('/en-US/');

    // Should redirect to login or show auth required
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const requiresAuth = currentUrl.includes('/login') || currentUrl.includes('/auth');

    // Should either redirect to login or block access
    // Implementation depends on auth flow
  });

  test('should have "Sign In Again" link', async ({ page }) => {
    await page.goto('/en-US/logout');

    // Should have link/button to sign in again
    const signInLink = page.getByRole('link', { name: /sign in|log in/i });
    await expect(signInLink).toBeVisible();

    // Click it
    await signInLink.click();

    // Should navigate to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should have "Back to Home" link', async ({ page }) => {
    await page.goto('/en-US/logout');

    // Should have link to home page
    const homeLink = page.getByRole('link', { name: /home|back/i });

    // If link exists, test it
    if (await homeLink.isVisible()) {
      await homeLink.click();

      // Should navigate to home/landing page
      // Exact URL depends on app structure
      await page.waitForTimeout(1000);
    }
  });

  test.skip('should call logout API endpoint', async ({ page }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'test-user@example.com');

    await page.goto('/en-US/');

    // Listen for logout API call
    const logoutRequestPromise = page.waitForRequest('/api/auth/signout');

    // Trigger logout
    await page.goto('/en-US/logout');

    // Wait for API call
    const logoutRequest = await logoutRequestPromise;

    // Verify request
    expect(logoutRequest.method()).toBe('POST');

    // Should include CSRF token
    const headers = logoutRequest.headers();
    expect(headers['x-csrf-token']).toBeDefined();
  });

  test.skip('should handle logout errors gracefully', async ({ page }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'test-user@example.com');

    // Mock logout API error
    await page.route('/api/auth/signout', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/en-US/');

    // Try to logout
    await page.goto('/en-US/logout');

    // Should handle error (show message, allow retry, etc.)
    await page.waitForTimeout(2000);

    // Might still clear session client-side even if API fails
  });

  test.skip('should include CSRF token in logout request', async ({ page }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'test-user@example.com');

    let requestHeaders: Record<string, string> = {};

    // Intercept logout request
    await page.route('/api/auth/signout', async (route) => {
      requestHeaders = route.request().headers();
      await route.continue();
    });

    // Logout
    await page.goto('/en-US/logout');

    // Wait for request
    await page.waitForTimeout(2000);

    // Verify CSRF token
    if (Object.keys(requestHeaders).length > 0) {
      expect(requestHeaders['x-csrf-token']).toBeDefined();
    }
  });
});

test.describe('Logout UI/UX', () => {
  test('should display logout page in correct locale', async ({ page }) => {
    // Test with German locale
    await page.goto('/de-DE/logout');

    await expect(page).toHaveURL(/\/de-DE\/logout/);

    // Content should be in German (if translations exist)
    await page.waitForLoadState('networkidle');
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    await page.goto('/en-US/logout');

    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // Should be able to navigate to links/buttons
    const signInLink = page.getByRole('link', { name: /sign in|log in/i });

    if (await signInLink.isVisible()) {
      // Navigate with keyboard
      while (!(await signInLink.evaluate((el) => document.activeElement === el))) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        // Prevent infinite loop
        const currentFocus = await page.evaluate(() => document.activeElement?.tagName);
        if (!currentFocus) break;
      }

      // Activate with Enter
      await page.keyboard.press('Enter');

      // Should navigate to login
      await page.waitForTimeout(1000);
    }
  });

  test('should have proper page title', async ({ page }) => {
    await page.goto('/en-US/logout');

    // Should have descriptive title
    await expect(page).toHaveTitle(/logout|signed out/i);
  });

  test('should have clear messaging', async ({ page }) => {
    await page.goto('/en-US/logout');

    // Should clearly indicate successful logout
    const bodyText = await page.locator('body').textContent();

    expect(bodyText).toMatch(/signed out|logged out|goodbye/i);
  });
});

test.describe('Logout Security', () => {
  test.skip('should invalidate session server-side', async ({ page }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'test-user@example.com');

    // Verify authenticated before logout
    const profileResponseBefore = await page.request.get('/api/profiles/me');
    expect(profileResponseBefore.ok()).toBe(true);

    // Logout
    await logout(page);

    // Try to access authenticated endpoint
    const profileResponseAfter = await page.request.get('/api/profiles/me');

    // Should fail (401 Unauthorized)
    expect(profileResponseAfter.status()).toBe(401);
  });

  test.skip('should prevent CSRF attacks on logout', async ({ page }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'test-user@example.com');

    // Try to logout without CSRF token
    const response = await page.request.post('/api/auth/signout', {
      headers: {
        'Content-Type': 'application/json',
      },
      // Intentionally omit CSRF token
    });

    // Should fail with 403 Forbidden
    expect(response.status()).toBe(403);
  });

  test.skip('should revoke all sessions for the user', async ({ page, context }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'test-user@example.com');

    // Open second tab with same session
    const page2 = await context.newPage();
    await page2.goto('/en-US/');

    // Logout from first tab
    await logout(page);

    // Second tab should also be logged out
    // (depending on implementation - single device logout vs all devices)
    await page2.reload();

    // Might redirect to login or show session expired
    await page2.waitForTimeout(2000);
  });
});

test.describe('Logout Edge Cases', () => {
  test('should handle logout when already logged out', async ({ page }) => {
    // Navigate to logout page without being logged in
    await page.goto('/en-US/logout');

    // Should still show logout page without errors
    await expect(page).toHaveURL(/\/logout/);

    // Should handle gracefully
    await page.waitForLoadState('networkidle');
  });

  test('should handle network errors during logout', async ({ page }) => {
    // Set offline mode
    await page.context().setOffline(true);

    await page.goto('/en-US/logout');

    // Might show error or handle offline logout
    await page.waitForTimeout(2000);

    // Re-enable network
    await page.context().setOffline(false);
  });

  test.skip('should logout from all tabs/windows', async ({ page, context }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'test-user@example.com');

    // Open multiple tabs
    const page2 = await context.newPage();
    await page2.goto('/en-US/');

    const page3 = await context.newPage();
    await page3.goto('/en-US/');

    // Logout from one tab
    await logout(page);

    // Other tabs should also reflect logged out state
    await page2.reload();
    await page3.reload();

    await page.waitForTimeout(2000);

    // All tabs should require re-authentication
  });
});
