import { test, expect } from "@playwright/test";

/**
 * Test scenario: AUTH-02
 * Niezalogowany użytkownik próbuje uzyskać dostęp do chronionej strony
 * Oczekiwany rezultat: Użytkownik zostaje przekierowany na stronę logowania
 */

test.describe("Authentication Protection", () => {
  test("should redirect unauthenticated user to login page when accessing protected route", async ({
    page,
  }) => {
    // Próba dostępu do chronionej strony /tours bez logowania
    await page.goto("/en-US/tours");

    // Sprawdź czy zostaliśmy przekierowani na stronę logowania
    await expect(page).toHaveURL(/\/en-US\/auth\/login/);

    // Weryfikuj czy wyświetla się formularz logowania
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("should redirect unauthenticated user when accessing tour details", async ({ page }) => {
    // Próba dostępu do szczegółów wycieczki bez logowania
    await page.goto("/en-US/tours/123");

    // Sprawdź czy zostaliśmy przekierowani na stronę logowania
    await expect(page).toHaveURL(/\/en-US\/auth\/login/);
  });

  test("should redirect unauthenticated user when accessing profile", async ({ page }) => {
    // Próba dostępu do profilu bez logowania
    await page.goto("/en-US/profile");

    // Sprawdź czy zostaliśmy przekierowani na stronę logowania
    await expect(page).toHaveURL(/\/en-US\/auth\/login/);
  });

  test("should allow access to public pages without authentication", async ({ page }) => {
    // Strona główna powinna być dostępna bez logowania
    await page.goto("/en-US");
    await expect(page).not.toHaveURL(/\/auth\/login/);

    // Strona logowania powinna być dostępna
    await page.goto("/en-US/auth/login");
    await expect(page).toHaveURL(/\/en-US\/auth\/login/);
  });
});
