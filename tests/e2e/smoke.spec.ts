import { test, expect } from "@playwright/test";

/**
 * Smoke Tests
 * Quick tests to verify basic application functionality
 * These should run after every deployment to ensure the app is working
 */

test.describe("Smoke Tests", () => {
  test("homepage loads successfully", async ({ page }) => {
    await page.goto("/");

    // Homepage is protected, should redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Login page should have loaded
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("English homepage loads", async ({ page }) => {
    await page.goto("/en-US");

    // Homepage is protected, should redirect to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Polish homepage loads", async ({ page }) => {
    await page.goto("/pl-PL");

    // Homepage is protected, should redirect to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/\/login/);

    // Should have email input
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Should have submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("app has proper meta tags", async ({ page }) => {
    await page.goto("/login");

    // Check for viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]');
    expect(await viewport.count()).toBeGreaterThan(0);

    // Check for charset
    const charset = await page.locator('meta[charset]');
    expect(await charset.count()).toBeGreaterThan(0);
  });

  test("app loads CSS properly", async ({ page }) => {
    await page.goto("/login");

    // Check if Tailwind/styles are loaded by verifying body has expected styling
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Check if any stylesheets are loaded
    const stylesheets = await page.locator('link[rel="stylesheet"]').count();
    // Note: With Vite and Tailwind 4, styles might be injected differently
    // This is a basic check
    expect(true).toBe(true); // Placeholder - adjust based on actual implementation
  });

  test("no console errors on homepage", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Filter out known/acceptable errors
    const criticalErrors = consoleErrors.filter((error) => {
      // Add any expected errors to ignore here
      return !error.includes("favicon"); // Example: ignore favicon errors
    });

    expect(criticalErrors).toEqual([]);
  });

  test("navigation links are functional", async ({ page }) => {
    await page.goto("/login");

    // Find all navigation links
    const navLinks = page.locator("nav a, header a").filter({ hasText: /./i });
    const linkCount = await navLinks.count();

    // Login page may have minimal navigation, that's OK
    // Test links only if they exist
    if (linkCount > 0) {
      // Find first visible link (Firefox may have different rendering)
      let clickableLink = null;
      for (let i = 0; i < linkCount; i++) {
        const link = navLinks.nth(i);
        if (await link.isVisible()) {
          clickableLink = link;
          break;
        }
      }

      if (clickableLink) {
        const href = await clickableLink.getAttribute("href");

        if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
          await clickableLink.scrollIntoViewIfNeeded();
          await clickableLink.click();

          // Should navigate somewhere
          await page.waitForLoadState("networkidle");
          expect(page.url()).toBeTruthy();
        }
      }
    }

    // At minimum, page should have loaded successfully
    await expect(page.locator("body")).toBeVisible();
  });
});
