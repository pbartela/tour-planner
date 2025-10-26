import { test, expect } from '@playwright/test';
import {
  clearSession,
  waitForOnboardingModal,
  completeOnboarding,
} from '../helpers/auth.helpers';

/**
 * Onboarding flow tests
 *
 * Tests cover the multi-step onboarding experience for new users.
 * The onboarding modal appears after first login/registration when
 * onboarding_completed is false in the user's profile.
 */

test.describe('Onboarding Flow', () => {
  // Note: These tests require a logged-in user with onboarding_completed = false
  // In a real test environment, you would set up test users with this state

  test.skip('should display onboarding modal for new users', async ({ page }) => {
    // TODO: Set up authenticated session for new user
    // await createTestUserSession(page, 'new-user@example.com');

    await page.goto('/en-US/');

    // Onboarding modal should appear
    await waitForOnboardingModal(page);

    // Verify modal structure
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Should have progress indicators
    // Should have content/instructions
    // Should have navigation buttons (Next, Skip)
  });

  test.skip('should allow user to complete all onboarding steps', async ({ page }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'new-user@example.com');

    await page.goto('/en-US/');

    // Wait for onboarding modal
    await waitForOnboardingModal(page);

    // Step 1
    await expect(page.locator('[role="dialog"]')).toContainText(/step 1|welcome/i);
    const nextButton1 = page.getByRole('button', { name: /next/i });
    await nextButton1.click();

    // Step 2
    await page.waitForTimeout(500);
    await expect(page.locator('[role="dialog"]')).toContainText(/step 2/i);
    const nextButton2 = page.getByRole('button', { name: /next/i });
    await nextButton2.click();

    // Step 3
    await page.waitForTimeout(500);
    await expect(page.locator('[role="dialog"]')).toContainText(/step 3/i);
    const finishButton = page.getByRole('button', { name: /finish|get started/i });
    await finishButton.click();

    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });

    // Verify API call was made to update profile
    // Should have called PATCH /api/profiles/me with onboarding_completed: true
  });

  test.skip('should allow user to skip onboarding', async ({ page }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'new-user@example.com');

    await page.goto('/en-US/');

    // Wait for onboarding modal
    await waitForOnboardingModal(page);

    // Click skip button
    const skipButton = page.getByRole('button', { name: /skip/i });
    await skipButton.click();

    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });

    // Should still update profile with onboarding_completed: true
  });

  test.skip('should show progress indicators', async ({ page }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'new-user@example.com');

    await page.goto('/en-US/');

    await waitForOnboardingModal(page);

    // Check for progress indicators (dots, steps, etc.)
    // Exact implementation depends on OnboardingModal component

    // Progress should update as user advances through steps
    const nextButton = page.getByRole('button', { name: /next/i });
    await nextButton.click();

    // Progress should show step 2
    await page.waitForTimeout(500);
  });

  test.skip('should not show onboarding modal for returning users', async ({ page }) => {
    // TODO: Set up authenticated session with onboarding_completed = true
    // await createTestUserSession(page, 'returning-user@example.com');

    await page.goto('/en-US/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Onboarding modal should NOT appear
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Should show dashboard content instead
  });

  test.skip('should persist onboarding completion across sessions', async ({ page }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'test-user@example.com');

    await page.goto('/en-US/');

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
  test.skip('should call PATCH /api/profiles/me when completing onboarding', async ({ page }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'test-user@example.com');

    await page.goto('/en-US/');

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

  test.skip('should include CSRF token in onboarding completion request', async ({ page }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'test-user@example.com');

    await page.goto('/en-US/');

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

  test.skip('should handle API errors during onboarding completion', async ({ page }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'test-user@example.com');

    await page.goto('/en-US/');

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
      await nextButton.click();
      await page.waitForTimeout(500);
    }

    await finishButton.click();

    // Should show error message
    await page.waitForTimeout(2000);
    // Modal might stay open or show error toast
  });
});

test.describe('Onboarding UI/UX', () => {
  test.skip('should be keyboard navigable', async ({ page }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'test-user@example.com');

    await page.goto('/en-US/');

    await waitForOnboardingModal(page);

    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // Should focus on Next or Skip button
    const nextButton = page.getByRole('button', { name: /next/i });
    const skipButton = page.getByRole('button', { name: /skip/i });

    // One of these should be focused
    const isNextFocused = await nextButton.evaluate((el) => document.activeElement === el);
    const isSkipFocused = await skipButton.evaluate((el) => document.activeElement === el);

    expect(isNextFocused || isSkipFocused).toBe(true);

    // Should be able to navigate with Enter key
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  });

  test.skip('should trap focus within modal', async ({ page }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'test-user@example.com');

    await page.goto('/en-US/');

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

  test.skip('should have proper ARIA attributes', async ({ page }) => {
    // TODO: Set up authenticated session
    // await createTestUserSession(page, 'test-user@example.com');

    await page.goto('/en-US/');

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
