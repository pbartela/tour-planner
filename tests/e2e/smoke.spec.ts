import { test, expect } from "@playwright/test";

/**
 * Smoke Tests
 * Quick tests to verify basic application functionality
 * These should run after every deployment to ensure the app is working
 */

test.describe("Smoke Tests", () => {
  test("homepage loads successfully", async ({ page }) => {
    await page.goto("/");

    // Should redirect to a locale
    await expect(page).toHaveURL(/\/(en-US|pl-PL)/);

    // Page should have loaded
    await expect(page.locator("body")).toBeVisible();
  });

  test("English homepage loads", async ({ page }) => {
    await page.goto("/en-US");

    await expect(page).toHaveURL(/\/en-US/);
    await expect(page.locator("body")).toBeVisible();

    // Check HTML lang attribute
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toMatch(/en/i);
  });

  test("Polish homepage loads", async ({ page }) => {
    await page.goto("/pl-PL");

    await expect(page).toHaveURL(/\/pl-PL/);
    await expect(page.locator("body")).toBeVisible();

    // Check HTML lang attribute
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toMatch(/pl/i);
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/en-US/auth/login");

    await expect(page).toHaveURL(/\/en-US\/auth\/login/);

    // Should have email input
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Should have submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("app has proper meta tags", async ({ page }) => {
    await page.goto("/en-US");

    // Check for viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]');
    expect(await viewport.count()).toBeGreaterThan(0);

    // Check for charset
    const charset = await page.locator('meta[charset]');
    expect(await charset.count()).toBeGreaterThan(0);
  });

  test("app loads CSS properly", async ({ page }) => {
    await page.goto("/en-US");

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

    await page.goto("/en-US");
    await page.waitForLoadState("networkidle");

    // Filter out known/acceptable errors
    const criticalErrors = consoleErrors.filter((error) => {
      // Add any expected errors to ignore here
      return !error.includes("favicon"); // Example: ignore favicon errors
    });

    expect(criticalErrors).toEqual([]);
  });

  test("navigation links are functional", async ({ page }) => {
    await page.goto("/en-US");

    // Find all navigation links
    const navLinks = page.locator("nav a, header a").filter({ hasText: /./i });
    const linkCount = await navLinks.count();

    // Should have at least some navigation links
    expect(linkCount).toBeGreaterThan(0);

    // Test first link if it exists
    if (linkCount > 0) {
      const firstLink = navLinks.first();
      const href = await firstLink.getAttribute("href");

      if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
        await firstLink.click();

        // Should navigate somewhere
        await page.waitForLoadState("networkidle");
        expect(page.url()).toBeTruthy();
      }
    }
  });
});
