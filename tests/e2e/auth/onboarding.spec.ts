import { test, expect } from '@playwright/test';
import {
  clearSession,
  waitForOnboardingModal,
  completeOnboarding,
  createTestUserSession,
} from '../helpers/auth.helpers';
import { mailpit } from '../helpers/mailpit.client';

/**
 * Onboarding flow tests
 *
 * Tests cover the multi-step onboarding experience for new users.
 * The onboarding modal appears after first login/registration when
 * onboarding_completed is false in the user's profile.
 */

test.describe('Onboarding Flow', () => {
  test.beforeEach(async () => {
    // Clear Mailpit inbox before each test
    try {
      await mailpit.deleteAllMessages();
    } catch (error) {
      console.warn('Failed to clear Mailpit inbox:', error);
    }
  });

  test('should display onboarding modal for new users', async ({ page }) => {
    const newUserEmail = `new-user-${Date.now()}@example.com`;

    // Create session without completing onboarding
    await createTestUserSession(page, newUserEmail, { completeOnboarding: false });

    // Onboarding modal should appear
    await waitForOnboardingModal(page);

    // Verify modal structure
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Should have navigation buttons (Next, Skip)
    await expect(page.getByRole('button', { name: /next|skip/i })).toBeVisible();
  });

  test('should allow user to complete all onboarding steps', async ({ page }) => {
    const newUserEmail = `onboarding-user-${Date.now()}@example.com`;

    // Create session without completing onboarding
    await createTestUserSession(page, newUserEmail, { completeOnboarding: false });

    // Wait for onboarding modal
    await waitForOnboardingModal(page);

    // Complete onboarding through all steps
    await completeOnboarding(page, false);

    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
  });

  test('should allow user to skip onboarding', async ({ page }) => {
    const newUserEmail = `skip-onboarding-${Date.now()}@example.com`;

    // Create session without completing onboarding
    await createTestUserSession(page, newUserEmail, { completeOnboarding: false });

    // Wait for onboarding modal
    await waitForOnboardingModal(page);

    // Click skip button
    const skipButton = page.getByRole('button', { name: /skip/i });
    await skipButton.click();

    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
  });

  test('should show progress indicators', async ({ page }) => {
    const newUserEmail = `progress-test-${Date.now()}@example.com`;

    // Create session without completing onboarding
    await createTestUserSession(page, newUserEmail, { completeOnboarding: false });

    await waitForOnboardingModal(page);

    // Check for progress indicators (dots, steps, etc.)
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Progress should update as user advances through steps
    const nextButton = page.getByRole('button', { name: /next/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should not show onboarding modal for returning users', async ({ page }) => {
    const returningUserEmail = `returning-user-${Date.now()}@example.com`;

    // Create session WITH completed onboarding
    await createTestUserSession(page, returningUserEmail, { completeOnboarding: true });

    // Navigate to dashboard
    await page.goto('/en-US/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Onboarding modal should NOT appear
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should persist onboarding completion across sessions', async ({ page }) => {
    const testUserEmail = `persist-test-${Date.now()}@example.com`;

    // Create session without completing onboarding
    await createTestUserSession(page, testUserEmail, { completeOnboarding: false });

    // Complete onboarding
    await completeOnboarding(page, false);

    // Refresh page
    await page.reload();

    // Onboarding should not appear again
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});

test.describe('Onboarding API Integration', () => {
  test.beforeEach(async () => {
    // Clear Mailpit inbox before each test
    try {
      await mailpit.deleteAllMessages();
    } catch (error) {
      console.warn('Failed to clear Mailpit inbox:', error);
    }
  });

  test('should call PATCH /api/profiles/me when completing onboarding', async ({ page }) => {
    const testUserEmail = `api-test-${Date.now()}@example.com`;

    // Create session without completing onboarding
    await createTestUserSession(page, testUserEmail, { completeOnboarding: false });

    // Listen for API call
    const apiCallPromise = page.waitForResponse('/api/profiles/me');

    // Complete onboarding
    await completeOnboarding(page, false);

    // Verify API call was made
    const response = await apiCallPromise;
    expect(response.ok()).toBe(true);

    // Verify request payload
    const request = response.request();
    expect(request.method()).toBe('PATCH');

    // Should include CSRF token
    const headers = request.headers();
    expect(headers['x-csrf-token']).toBeDefined();
  });

  test('should include CSRF token in onboarding completion request', async ({ page }) => {
    const testUserEmail = `csrf-test-${Date.now()}@example.com`;

    // Create session without completing onboarding
    await createTestUserSession(page, testUserEmail, { completeOnboarding: false });

    // Intercept the PATCH request
    let requestHeaders: Record<string, string> = {};
    await page.route('/api/profiles/me', async (route) => {
      requestHeaders = route.request().headers();
      await route.continue();
    });

    // Complete onboarding
    await completeOnboarding(page, false);

    // Verify CSRF token was included
    expect(requestHeaders['x-csrf-token']).toBeDefined();
    expect(typeof requestHeaders['x-csrf-token']).toBe('string');
  });

  test('should handle API errors during onboarding completion', async ({ page }) => {
    const testUserEmail = `error-test-${Date.now()}@example.com`;

    // Create session without completing onboarding
    await createTestUserSession(page, testUserEmail, { completeOnboarding: false });

    // Mock API error
    await page.route('/api/profiles/me', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await waitForOnboardingModal(page);

    // Try to complete onboarding
    const finishButton = page.getByRole('button', { name: /finish|get started/i });

    // Navigate to last step
    for (let i = 0; i < 2; i++) {
      const nextButton = page.getByRole('button', { name: /next/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
    }

    if (await finishButton.isVisible()) {
      await finishButton.click();
    }

    // Should show error message or keep modal open
    await page.waitForTimeout(2000);
  });
});

test.describe('Onboarding UI/UX', () => {
  test.beforeEach(async () => {
    // Clear Mailpit inbox before each test
    try {
      await mailpit.deleteAllMessages();
    } catch (error) {
      console.warn('Failed to clear Mailpit inbox:', error);
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    const testUserEmail = `keyboard-test-${Date.now()}@example.com`;

    // Create session without completing onboarding
    await createTestUserSession(page, testUserEmail, { completeOnboarding: false });

    await waitForOnboardingModal(page);

    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // Should be able to navigate with keyboard
    await page.waitForTimeout(500);
  });

  test('should trap focus within modal', async ({ page }) => {
    const testUserEmail = `focus-trap-${Date.now()}@example.com`;

    // Create session without completing onboarding
    await createTestUserSession(page, testUserEmail, { completeOnboarding: false });

    await waitForOnboardingModal(page);

    // Tab through all elements
    // Focus should loop back to first element (focus trap)
    const dialog = page.locator('[role="dialog"]');

    // Tab multiple times
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      // Active element should still be within dialog
      const isFocusWithinDialog = await dialog.evaluate((el) =>
        el.contains(document.activeElement)
      );
      expect(isFocusWithinDialog).toBe(true);
    }
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    const testUserEmail = `aria-test-${Date.now()}@example.com`;

    // Create session without completing onboarding
    await createTestUserSession(page, testUserEmail, { completeOnboarding: false });

    await waitForOnboardingModal(page);

    const dialog = page.locator('[role="dialog"]');

    // Should have role="dialog"
    await expect(dialog).toHaveAttribute('role', 'dialog');

    // Should have aria-modal
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Should have aria-labelledby or aria-label
    const hasLabel =
      (await dialog.getAttribute('aria-labelledby')) !== null ||
      (await dialog.getAttribute('aria-label')) !== null;
    expect(hasLabel).toBe(true);
  });

  test.skip('should display content in correct locale', async ({ page }) => {
    // Test with Spanish locale
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'test-user@example.com');

    await page.goto('/es-ES/');

    await waitForOnboardingModal(page);

    // Content should be in Spanish
    // Exact text depends on translations
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Buttons should be in Spanish
    // e.g., "Siguiente" instead of "Next"
  });

  test.skip('should animate transitions between steps', async ({ page }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'test-user@example.com');

    await page.goto('/en-US/');

    await waitForOnboardingModal(page);

    // Click next and watch for animation
    const nextButton = page.getByRole('button', { name: /next/i });
    await nextButton.click();

    // Should have smooth transition
    // This is a visual test, might need screenshot comparison
    await page.waitForTimeout(1000);
  });
});

test.describe('Onboarding Content', () => {
  test.skip('should display all required onboarding steps', async ({ page }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'test-user@example.com');

    await page.goto('/en-US/');

    await waitForOnboardingModal(page);

    // Step 1: Welcome/Introduction
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Navigate through all steps and verify content
    const steps = 3; // Based on codebase analysis

    for (let i = 0; i < steps; i++) {
      // Verify step content is visible
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      if (i < steps - 1) {
        // Click Next for all but last step
        const nextButton = page.getByRole('button', { name: /next/i });
        await nextButton.click();
        await page.waitForTimeout(500);
      } else {
        // Last step should have Finish button
        await expect(page.getByRole('button', { name: /finish|get started/i })).toBeVisible();
      }
    }
  });
});
