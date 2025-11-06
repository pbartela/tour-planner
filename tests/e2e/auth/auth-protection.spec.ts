import { test, expect } from "@playwright/test";

/**
 * Test scenario: AUTH-02
 * Niezalogowany użytkownik próbuje uzyskać dostęp do chronionej strony
 * Oczekiwany rezultat: Użytkownik zostaje przekierowany na stronę logowania
 */

test.describe("Authentication Protection", () => {
  test("should redirect unauthenticated user to login page when accessing protected route", async ({ page }) => {
    // Próba dostępu do chronionej strony /tours bez logowania
    await page.goto("/tours");

    // Sprawdź czy zostaliśmy przekierowani na stronę logowania
    await expect(page).toHaveURL(/\/login/);

    // Weryfikuj czy wyświetla się formularz logowania
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("should redirect unauthenticated user when accessing tour details", async ({ page }) => {
    // Próba dostępu do szczegółów wycieczki bez logowania
    await page.goto("/tours/123");

    // Sprawdź czy zostaliśmy przekierowani na stronę logowania
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect unauthenticated user when accessing profile", async ({ page }) => {
    // Próba dostępu do profilu bez logowania
    await page.goto("/profile");

    // Sprawdź czy zostaliśmy przekierowani na stronę logowania
    await expect(page).toHaveURL(/\/login/);
  });

  test("should allow access to public pages without authentication", async ({ page }) => {
    // Strona logowania powinna być dostępna bez logowania
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);

    // Weryfikuj czy wyświetla się formularz logowania
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
