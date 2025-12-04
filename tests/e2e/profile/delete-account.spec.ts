import { test, expect } from "@playwright/test";

/**
 * Test scenario: PROFILE-DELETE-01
 * Account Deletion Flow
 *
 * Tests the complete account deletion process including:
 * - Two-step confirmation (checkbox + text input)
 * - Data cleanup
 * - User logout
 * - Redirect to home page
 *
 * Note: This test requires authentication via TEST_ACCESS_TOKEN and TEST_REFRESH_TOKEN
 * environment variables. For CI/CD, these should be set up to use temporary test accounts.
 */

test.describe("Delete Account", () => {
  test.beforeEach(async ({ page }) => {
    // Note: In a real test environment, you would authenticate here
    // using test credentials or mock authentication tokens
    const testAccessToken = process.env.TEST_ACCESS_TOKEN;
    const testRefreshToken = process.env.TEST_REFRESH_TOKEN;

    if (!testAccessToken || !testRefreshToken) {
      test.skip();
      return;
    }

    // Set authentication cookies
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
  });

  test("should show delete account button in danger zone", async ({ page }) => {
    await page.goto("/en-US/profile");

    // Wait for page to load
    await expect(page.locator("h1")).toContainText("Profile");

    // Scroll to danger zone
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Verify danger zone is visible
    await expect(page.getByText("Danger Zone")).toBeVisible();
    await expect(page.getByRole("button", { name: /Delete Account/i })).toBeVisible();
  });

  test("should disable confirm button until both conditions are met", async ({ page }) => {
    await page.goto("/en-US/profile");

    // Open delete dialog
    await page.getByRole("button", { name: /Delete Account/i }).click();

    // Dialog should be visible
    await expect(page.getByRole("heading", { name: /Delete Account/i })).toBeVisible();

    // Confirm button should be disabled initially
    const confirmButton = page.getByRole("button", { name: /Delete My Account/i });
    await expect(confirmButton).toBeDisabled();

    // Check the checkbox
    await page.locator('input[type="checkbox"][id="confirm-checkbox"]').check();

    // Button still disabled (need to type DELETE)
    await expect(confirmButton).toBeDisabled();

    // Type wrong text
    await page.locator('input[id="confirm-text"]').fill("WRONG");

    // Button still disabled
    await expect(confirmButton).toBeDisabled();

    // Type correct text
    await page.locator('input[id="confirm-text"]').fill("DELETE");

    // Button should now be enabled
    await expect(confirmButton).toBeEnabled();
  });

  test("should cancel deletion when clicking cancel", async ({ page }) => {
    await page.goto("/en-US/profile");

    // Open delete dialog
    await page.getByRole("button", { name: /Delete Account/i }).click();

    // Wait for dialog
    await expect(page.getByRole("heading", { name: /Delete Account/i })).toBeVisible();

    // Click cancel
    await page.getByRole("button", { name: /Cancel/i }).click();

    // Dialog should close
    await expect(page.getByRole("heading", { name: /Delete Account/i })).not.toBeVisible();

    // Should still be on profile page
    await expect(page).toHaveURL(/\/profile/);
  });

  test("should reset form when closing and reopening dialog", async ({ page }) => {
    await page.goto("/en-US/profile");

    // Open delete dialog
    await page.getByRole("button", { name: /Delete Account/i }).click();

    // Fill in the form
    await page.locator('input[type="checkbox"][id="confirm-checkbox"]').check();
    await page.locator('input[id="confirm-text"]').fill("DELETE");

    // Close dialog
    await page.getByRole("button", { name: /Cancel/i }).click();

    // Reopen dialog
    await page.getByRole("button", { name: /Delete Account/i }).click();

    // Form should be reset
    const checkbox = page.locator('input[type="checkbox"][id="confirm-checkbox"]');
    const textInput = page.locator('input[id="confirm-text"]');

    await expect(checkbox).not.toBeChecked();
    await expect(textInput).toHaveValue("");
  });

  // Note: The following test would actually delete the test account
  // Only run this with a disposable test account or in an isolated test environment
  test.skip("should successfully delete account and redirect to home", async ({ page }) => {
    await page.goto("/en-US/profile");

    // Open delete dialog
    await page.getByRole("button", { name: /Delete Account/i }).click();

    // Complete the form
    await page.locator('input[type="checkbox"][id="confirm-checkbox"]').check();
    await page.locator('input[id="confirm-text"]').fill("DELETE");

    // Intercept the API call
    const deletePromise = page.waitForResponse((response) => response.url().includes("/api/profiles/me") && response.request().method() === "DELETE");

    // Click confirm
    await page.getByRole("button", { name: /Delete My Account/i }).click();

    // Wait for API call to complete
    const response = await deletePromise;
    expect(response.status()).toBe(204);

    // Should redirect to home page
    await expect(page).toHaveURL(/\/en-US\/?$/);

    // User should be logged out (verify by trying to access protected route)
    await page.goto("/en-US/tours");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should handle deletion errors gracefully", async ({ page }) => {
    await page.goto("/en-US/profile");

    // Mock API error
    await page.route("**/api/profiles/me", (route) => {
      if (route.request().method() === "DELETE") {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            error: {
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to delete account",
            },
          }),
        });
      } else {
        route.continue();
      }
    });

    // Open delete dialog
    await page.getByRole("button", { name: /Delete Account/i }).click();

    // Complete the form
    await page.locator('input[type="checkbox"][id="confirm-checkbox"]').check();
    await page.locator('input[id="confirm-text"]').fill("DELETE");

    // Click confirm
    await page.getByRole("button", { name: /Delete My Account/i }).click();

    // Should show error toast (wait for toast to appear)
    await expect(page.locator('text=/Failed to delete account/i')).toBeVisible({ timeout: 5000 });

    // Dialog should close
    await expect(page.getByRole("heading", { name: /Delete Account/i })).not.toBeVisible();

    // Should still be on profile page
    await expect(page).toHaveURL(/\/profile/);
  });
});

/**
 * Test scenario: PROFILE-DELETE-02
 * Account Deletion with Polish locale
 */
test.describe("Delete Account (Polish locale)", () => {
  test.beforeEach(async ({ page }) => {
    const testAccessToken = process.env.TEST_ACCESS_TOKEN;
    const testRefreshToken = process.env.TEST_REFRESH_TOKEN;

    if (!testAccessToken || !testRefreshToken) {
      test.skip();
      return;
    }

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
  });

  test("should work with Polish translations", async ({ page }) => {
    await page.goto("/pl-PL/profile");

    // Wait for page to load
    await expect(page.locator("h1")).toContainText("Profil");

    // Scroll to danger zone
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Verify danger zone with Polish text
    await expect(page.getByText("Strefa Zagrożenia")).toBeVisible();
    await expect(page.getByRole("button", { name: /Usuń Konto/i })).toBeVisible();

    // Open dialog
    await page.getByRole("button", { name: /Usuń Konto/i }).click();

    // Dialog should show Polish text
    await expect(page.getByRole("heading", { name: /Usuń Konto/i })).toBeVisible();

    // Check Polish placeholder
    const textInput = page.locator('input[id="confirm-text"]');
    await expect(textInput).toHaveAttribute("placeholder", "USUŃ");

    // Complete form with Polish confirmation text
    await page.locator('input[type="checkbox"][id="confirm-checkbox"]').check();
    await textInput.fill("USUŃ");

    // Confirm button should be enabled
    const confirmButton = page.getByRole("button", { name: /Usuń Moje Konto/i });
    await expect(confirmButton).toBeEnabled();
  });
});
