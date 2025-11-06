# Testing Documentation

## Przegląd

Ten projekt wykorzystuje kompleksową strategię testowania zgodną z planem testów opisanym w `.ai/@test-plan.mdc`. Testowanie obejmuje:

- **Testy Jednostkowe** (Unit Tests) z Vitest
- **Testy E2E** (End-to-End) z Playwright
- **Testy Wizualnej Regresji** z Chromatic i Storybook
- **Automatyzacja CI/CD** przez GitHub Actions

## Struktura Testów

```
src/
├── lib/
│   ├── validators/        # Walidatory Zod z testami
│   │   ├── auth.validators.ts
│   │   ├── auth.validators.test.ts
│   │   ├── tour.validators.ts
│   │   └── tour.validators.test.ts
│   ├── utils/             # Funkcje pomocnicze z testami
│   │   ├── error-handler.ts
│   │   └── error-handler.test.ts
│   ├── services/          # Serwisy biznesowe z testami
│   │   ├── profile.service.ts
│   │   └── profile.service.test.ts
│   └── hooks/             # React hooks z testami
│       ├── useVotes.ts
│       └── useVotes.test.tsx

tests/
├── e2e/                    # Testy End-to-End (Playwright)
│   ├── auth/              # Testy uwierzytelniania
│   ├── tours/             # Testy zarządzania wycieczkami
│   ├── i18n/              # Testy internacjonalizacji
│   ├── ui/                # Testy UI i responsywności
│   └── smoke.spec.ts      # Testy dymne (smoke tests)
├── helpers/               # Funkcje pomocnicze dla testów
│   └── auth.ts            # Helpery uwierzytelniania
└── setup.ts               # Setup dla Vitest

vitest.config.ts           # Konfiguracja Vitest
playwright.config.ts       # Konfiguracja Playwright
.chromatic.config.json     # Konfiguracja Chromatic (git-ignored)
.chromatic.config.example.json  # Przykładowa konfiguracja
```

## Skrypty NPM

### Testy Ogólne

```bash
# Uruchom wszystkie testy (unit + e2e)
npm run test
```

### Testy Jednostkowe (Vitest)

```bash
# Uruchom testy jednostkowe
npm run test:unit

# Uruchom testy w trybie watch (automatyczne ponowne uruchomienie)
npm run test:unit:watch

# Uruchom testy w UI mode (interaktywny interfejs)
npm run test:unit:ui

# Uruchom testy z coverage
npm run test:unit:coverage
```

### Testy E2E (Playwright)

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom testy w trybie headed (z widoczną przeglądarką)
npm run test:e2e:headed

# Uruchom testy w UI mode (interaktywny interfejs)
npm run test:e2e:ui

# Uruchom tylko smoke tests
npm run test:e2e:smoke

# Uruchom tylko testy uwierzytelniania
npm run test:e2e:auth

# Debugowanie testów
npm run test:debug

# Pokaż raport z testów
npm run test:report
```

### Testy Chromatic (Wizualna Regresja)

```bash
# Uruchom Chromatic dla Storybook
npm run test:chromatic
```

## Vitest - Testy Jednostkowe

### Konfiguracja

Konfiguracja znajduje się w `vitest.config.ts`. Testy wykorzystują:

- **Test Framework**: Vitest
- **Biblioteka pomocnicza**: @testing-library/react
- **Matchers**: @testing-library/jest-dom
- **Test Environment**: happy-dom (dla React)
- **Coverage Provider**: v8

### Co Testujemy

#### Walidatory Zod

```typescript
// src/lib/validators/auth.validators.test.ts
describe("MagicLinkSchema", () => {
  it("should accept valid email addresses", () => {
    const result = MagicLinkSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });

  it("should reject protocol-based attacks", () => {
    const result = MagicLinkSchema.safeParse({
      email: "user@example.com",
      redirectTo: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });
});
```

#### Funkcje Pomocnicze

```typescript
// src/lib/utils/error-handler.test.ts
describe("handleDatabaseError", () => {
  it("should handle unique violation error", () => {
    const error = { code: POSTGRES_ERROR_CODES.UNIQUE_VIOLATION };
    const result = handleDatabaseError(error);

    expect(result.status).toBe(409);
    expect(result.message).toBe("Email is already taken");
  });
});
```

#### Serwisy Biznesowe

```typescript
// src/lib/services/profile.service.test.ts
describe("ProfileService", () => {
  it("should return profile data on success", async () => {
    // Mock Supabase client
    const mockSupabase = createMockSupabaseClient();

    const result = await profileService.getProfile(mockSupabase, "user-123");

    expect(result.data).toEqual(mockProfile);
    expect(result.error).toBeNull();
  });
});
```

#### React Hooks

```typescript
// src/lib/hooks/useVotes.test.tsx
describe("useVotes", () => {
  it("should fetch votes successfully", async () => {
    const { result } = renderHook(() => useVotes("tour-123"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockVotes);
  });
});
```

### Uruchamianie Testów Lokalnie

```bash
# Uruchom wszystkie testy jednostkowe
npm run test:unit

# Uruchom w trybie watch (automatyczne ponowne uruchomienie przy zmianach)
npm run test:unit:watch

# Uruchom z UI (interaktywny interfejs)
npm run test:unit:ui

# Uruchom z coverage
npm run test:unit:coverage
```

### Pisanie Nowych Testów

1. **Umieść test obok pliku źródłowego:**

   ```bash
   src/lib/utils/my-function.ts
   src/lib/utils/my-function.test.ts
   ```

2. **Użyj podstawowej struktury:**

   ```typescript
   import { describe, it, expect } from "vitest";
   import { myFunction } from "./my-function";

   describe("myFunction", () => {
     it("should do something", () => {
       const result = myFunction("input");
       expect(result).toBe("expected");
     });
   });
   ```

3. **Dla mocków użyj vi:**

   ```typescript
   import { describe, it, expect, vi } from "vitest";

   vi.mock("@/lib/client/api-client", () => ({
     get: vi.fn(),
   }));
   ```

### Coverage Reports

Po uruchomieniu `npm run test:unit:coverage`, raporty znajdziesz w:

- **Konsola**: Szybki przegląd w terminalu
- **HTML**: `coverage/index.html` - szczegółowy raport wizualny
- **LCOV**: `coverage/lcov.info` - dla narzędzi CI/CD

Progi coverage (zdefiniowane w `vitest.config.ts`):

- Statements: 70%
- Branches: 70%
- Functions: 70%
- Lines: 70%

## Playwright - Testy E2E

### Konfiguracja

Konfiguracja znajduje się w `playwright.config.ts`. Testy uruchamiane są na:

- **Przeglądarkach**: Chromium, Firefox, WebKit
- **Urządzeniach**: Desktop, Mobile Chrome, Mobile Safari
- **Base URL**: `http://localhost:3000` (lub z `BASE_URL` env var)

### Scenariusze Testowe

Zgodnie z planem testów zaimplementowano następujące scenariusze:

#### AUTH-02: Ochrona Chronionych Tras

```typescript
// tests/e2e/auth/auth-protection.spec.ts
test("should redirect unauthenticated user to login page", async ({ page }) => {
  await page.goto("/en-US/tours");
  await expect(page).toHaveURL(/\/en-US\/auth\/login/);
});
```

#### I18N-01: Przełączanie Języka

```typescript
// tests/e2e/i18n/language-switching.spec.ts
test("should switch language from English to Polish", async ({ page }) => {
  // Test weryfikuje przełączanie języka i aktualizację URL
});
```

#### UI-01: Responsywność

```typescript
// tests/e2e/ui/responsive-design.spec.ts
test("should display tours page correctly on mobile device", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  // Weryfikacja layoutu na urządzeniach mobilnych
});
```

#### Smoke Tests

```typescript
// tests/e2e/smoke.spec.ts
// Szybkie testy sprawdzające podstawową funkcjonalność aplikacji
```

### Uruchamianie Testów Lokalnie

1. **Upewnij się, że masz zainstalowane zależności:**

   ```bash
   npm install
   ```

2. **Zainstaluj przeglądarki Playwright (tylko przy pierwszym uruchomieniu):**

   ```bash
   npx playwright install
   ```

3. **Skonfiguruj zmienne środowiskowe:**

   ```bash
   # Skopiuj przykładowy plik .env (jeśli nie istnieje)
   cp .env.example .env

   # Dla lokalnego testowania uruchom Supabase lokalnie:
   npx supabase start
   ```

   **Uwaga:** Plik `.env` powinien zawierać klucze Supabase. Dla lokalnego Supabase użyj domyślnych kluczy z `.env.example`.

4. **Uruchom aplikację w tle (opcjonalne - konfiguracja automatycznie uruchomi):**

   ```bash
   npm run dev
   ```

5. **Uruchom testy:**
   ```bash
   npm run test
   ```

### Debugowanie Testów

#### UI Mode (Zalecane)

```bash
npm run test:ui
```

Otwiera interaktywny interfejs pozwalający na:

- Uruchamianie pojedynczych testów
- Podglądanie kroków testu
- Inspekcję elementów DOM
- Time travel debugging

#### Debug Mode

```bash
npm run test:debug
```

Uruchamia testy w trybie debugowania z Playwright Inspector.

#### Headed Mode

```bash
npm run test:headed
```

Uruchamia testy z widoczną przeglądarką.

### Pisanie Nowych Testów

1. **Utwórz nowy plik w odpowiednim katalogu:**

   ```bash
   touch tests/e2e/tours/create-tour.spec.ts
   ```

2. **Użyj podstawowej struktury:**

   ```typescript
   import { test, expect } from "@playwright/test";

   test.describe("Feature Name", () => {
     test("should do something", async ({ page }) => {
       await page.goto("/en-US/path");
       // Your test steps
       await expect(page.locator("selector")).toBeVisible();
     });
   });
   ```

3. **Użyj helperów z `tests/helpers/` dla powtarzalnych akcji:**

   ```typescript
   import { loginAsTestUser } from "../helpers/auth";

   test("authenticated test", async ({ page }) => {
     await loginAsTestUser(page);
     // Continue with authenticated actions
   });
   ```

## Chromatic - Testy Wizualnej Regresji

### Konfiguracja

1. **Uzyskaj Project Token z Chromatic:**
   - Zarejestruj się na [chromatic.com](https://www.chromatic.com/)
   - Utwórz nowy projekt
   - Skopiuj Project Token

2. **Stwórz plik konfiguracyjny:**

   ```bash
   cp .chromatic.config.example.json .chromatic.config.json
   ```

3. **Wstaw swój token do `.chromatic.config.json`:**
   ```json
   {
     "projectToken": "YOUR_ACTUAL_TOKEN_HERE",
     ...
   }
   ```

### Uruchamianie Chromatic Lokalnie

```bash
npm run test:chromatic
```

Chromatic:

1. Zbuduje Storybook
2. Przesle snapshotty do Chromatic
3. Porówna z poprzednimi wersjami
4. Pokaże różnice wizualne

### Dodawanie Nowych Stories

Każdy komponent w Storybook automatycznie jest testowany przez Chromatic:

```typescript
// src/components/ui/MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'UI/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

export const Default: Story = {
  render: () => <MyComponent />,
};
```

## GitHub Actions - CI/CD

### Workflows

Plik `.github/workflows/test.yml` definiuje następujące joby:

#### 1. Lint & Type Check

- Uruchamia się przy każdym push i PR
- Sprawdza kod ESLint
- Weryfikuje typy TypeScript

#### 2. Playwright E2E Tests

- Uruchamia się na Chromium i Firefox
- Matrix strategy dla wieloprzeglądarkowych testów
- Uploaduje raporty jako artifacts
- **Wymaga secrets w GitHub:**
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

#### 3. Chromatic Visual Tests

- Uruchamia się przy każdym push i PR
- Automatycznie akceptuje zmiany na branchu `main`
- **Wymaga secret:** `CHROMATIC_PROJECT_TOKEN`

#### 4. Smoke Tests

- Uruchamia się tylko po merge do `main` lub `develop`
- Szybka weryfikacja krytycznej funkcjonalności
- Uploaduje raporty na 7 dni

### Konfiguracja GitHub Secrets

Dodaj następujące secrets w ustawieniach repozytorium:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name                 | Opis                                        |
| --------------------------- | ------------------------------------------- |
| `PUBLIC_SUPABASE_URL`       | URL projektu Supabase                       |
| `PUBLIC_SUPABASE_ANON_KEY`  | Anonimowy klucz Supabase                    |
| `SUPABASE_URL`              | URL projektu Supabase (taki sam jak public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase                   |
| `CHROMATIC_PROJECT_TOKEN`   | Token projektu Chromatic                    |

### Viewing Test Results

1. **Playwright Reports:**
   - Przejdź do Actions → Wybierz workflow run
   - Scrolluj do "Artifacts"
   - Pobierz `playwright-report-*`
   - Rozpakuj i otwórz `index.html`

2. **Chromatic Reports:**
   - Logi w GitHub Actions zawierają link do Chromatic
   - Lub przejdź bezpośrednio do chromatic.com

## Best Practices

### 1. Test Selectors

**Użyj data-testid dla stabilnych selektorów:**

```html
<button data-testid="submit-button">Submit</button>
```

```typescript
await page.locator('[data-testid="submit-button"]').click();
```

### 2. Oczekiwanie na Elementy

**Zawsze czekaj na elementy:**

```typescript
// ❌ Źle - może być niestabilne
await page.click("button");

// ✅ Dobrze - czeka na element
await expect(page.locator("button")).toBeVisible();
await page.locator("button").click();
```

### 3. Izolacja Testów

**Każdy test powinien być niezależny:**

```typescript
test.beforeEach(async ({ page }) => {
  // Setup fresh state
  await page.goto("/en-US");
});

test.afterEach(async ({ page }) => {
  // Cleanup if needed
});
```

### 4. Descriptive Test Names

```typescript
// ❌ Źle
test('test 1', async ({ page }) => { ... });

// ✅ Dobrze
test('should redirect unauthenticated user to login when accessing tours', async ({ page }) => { ... });
```

### 5. Grupowanie Testów

```typescript
test.describe('User Authentication', () => {
  test.describe('Login Flow', () => {
    test('should show email input', async ({ page }) => { ... });
    test('should validate email format', async ({ page }) => { ... });
  });
});
```

## Troubleshooting

### Playwright

**Problem: Testy timeout**

```bash
# Zwiększ timeout w playwright.config.ts
timeout: 60000, // 60 sekund
```

**Problem: Przeglądarki nie są zainstalowane**

```bash
npx playwright install
```

**Problem: Port 3000 już używany**

```bash
# Zmień port w playwright.config.ts
baseURL: 'http://localhost:3001'
# I uruchom dev server na tym porcie
```

### Chromatic

**Problem: Build fails**

```bash
# Sprawdź czy Storybook buduje się lokalnie
npm run build-storybook
```

**Problem: Too many snapshots**

```bash
# Użyj onlyChanged w .chromatic.config.json
"onlyChanged": true
```

## Wsparcie i Dokumentacja

- **Playwright**: https://playwright.dev/
- **Chromatic**: https://www.chromatic.com/docs/
- **Storybook**: https://storybook.js.org/
- **Plan Testów**: `.ai/@test-plan.mdc`

## Następne Kroki

### Implementacja Testów dla Pozostałych Scenariuszy

Plan testów definiuje dodatkowe scenariusze do zaimplementowania:

- **TOUR-01**: Tworzenie wycieczki
- **TOUR-02**: Zapraszanie uczestników
- **TOUR-03**: System głosowania
- **SEC-01**: Testowanie RLS (Row Level Security)
- **AUTH-01**: Proces logowania przez magic link

Te testy wymagają:

1. Konfiguracji testowej bazy danych Supabase
2. Implementacji helperów do tworzenia danych testowych
3. Mockowania email service lub użycia testowego dostawcy email

### Rozszerzenie Coverage

- Dodaj testy jednostkowe z Vitest
- Zaimplementuj testy API
- Dodaj performance testing z Lighthouse lub k6
- Zautomatyzuj accessibility testing
