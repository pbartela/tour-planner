# Testing Documentation

## Overview

This project uses a comprehensive testing strategy in accordance with the test plan described in `.ai/@test-plan.mdc`. Testing includes:

- **Unit Tests** with Vitest
- **E2E Tests** (End-to-End) with Playwright
- **Visual Regression Tests** with Chromatic and Storybook
- **CI/CD Automation** via GitHub Actions

## Test Structure

```
src/
├── lib/
│   ├── validators/        # Zod validators with tests
│   │   ├── auth.validators.ts
│   │   ├── auth.validators.test.ts
│   │   ├── tour.validators.ts
│   │   └── tour.validators.test.ts
│   ├── utils/             # Helper functions with tests
│   │   ├── error-handler.ts
│   │   └── error-handler.test.ts
│   ├── services/          # Business services with tests
│   │   ├── profile.service.ts
│   │   └── profile.service.test.ts
│   └── hooks/             # React hooks with tests
│       ├── useVotes.ts
│       └── useVotes.test.tsx

tests/
├── e2e/                    # End-to-End tests (Playwright)
│   ├── auth/              # Authentication tests
│   ├── tours/             # Tour management tests
│   ├── i18n/              # Internationalization tests
│   ├── ui/                # UI and responsiveness tests
│   └── smoke.spec.ts      # Smoke tests
├── helpers/               # Test helper functions
│   └── auth.ts            # Authentication helpers
└── setup.ts               # Vitest setup

vitest.config.ts           # Vitest configuration
playwright.config.ts       # Playwright configuration
.chromatic.config.json     # Chromatic configuration (git-ignored)
.chromatic.config.example.json  # Example configuration
```

## NPM Scripts

### General Tests

```bash
# Run all tests (unit + e2e)
npm run test
```

### Unit Tests (Vitest)

```bash
# Run unit tests
npm run test:unit

# Run tests in watch mode (automatic re-run)
npm run test:unit:watch

# Run tests in UI mode (interactive interface)
npm run test:unit:ui

# Run tests with coverage
npm run test:unit:coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in headed mode (with visible browser)
npm run test:e2e:headed

# Run tests in UI mode (interactive interface)
npm run test:e2e:ui

# Run smoke tests only
npm run test:e2e:smoke

# Run authentication tests only
npm run test:e2e:auth

# Debug tests
npm run test:debug

# Show test report
npm run test:report
```

### Chromatic Tests (Visual Regression)

```bash
# Run Chromatic for Storybook
npm run test:chromatic
```

## Vitest - Unit Tests

### Configuration

Configuration is located in `vitest.config.ts`. Tests use:

- **Test Framework**: Vitest
- **Testing Library**: @testing-library/react
- **Matchers**: @testing-library/jest-dom
- **Test Environment**: happy-dom (for React)
- **Coverage Provider**: v8

### What We Test

#### Zod Validators

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

#### Helper Functions

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

#### Business Services

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

### Running Tests Locally

```bash
# Run all unit tests
npm run test:unit

# Run in watch mode (automatic re-run on changes)
npm run test:unit:watch

# Run with UI (interactive interface)
npm run test:unit:ui

# Run with coverage
npm run test:unit:coverage
```

### Writing New Tests

1. **Place test next to source file:**

   ```bash
   src/lib/utils/my-function.ts
   src/lib/utils/my-function.test.ts
   ```

2. **Use basic structure:**

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

3. **For mocks use vi:**

   ```typescript
   import { describe, it, expect, vi } from "vitest";

   vi.mock("@/lib/client/api-client", () => ({
     get: vi.fn(),
   }));
   ```

### Coverage Reports

After running `npm run test:unit:coverage`, you'll find reports at:

- **Console**: Quick overview in terminal
- **HTML**: `coverage/index.html` - detailed visual report
- **LCOV**: `coverage/lcov.info` - for CI/CD tools

Coverage thresholds (defined in `vitest.config.ts`):

- Statements: 70%
- Branches: 70%
- Functions: 70%
- Lines: 70%

## Playwright - E2E Tests

### Configuration

Configuration is located in `playwright.config.ts`. Tests run on:

- **Browsers**: Chromium, Firefox, WebKit
- **Devices**: Desktop, Mobile Chrome, Mobile Safari
- **Base URL**: `http://localhost:3000` (or from `BASE_URL` env var)

### Test Scenarios

According to the test plan, the following scenarios have been implemented:

#### AUTH-02: Protected Route Protection

```typescript
// tests/e2e/auth/auth-protection.spec.ts
test("should redirect unauthenticated user to login page", async ({ page }) => {
  await page.goto("/en-US/tours");
  await expect(page).toHaveURL(/\/en-US\/auth\/login/);
});
```

#### I18N-01: Language Switching

```typescript
// tests/e2e/i18n/language-switching.spec.ts
test("should switch language from English to Polish", async ({ page }) => {
  // Test verifies language switching and URL update
});
```

#### UI-01: Responsiveness

```typescript
// tests/e2e/ui/responsive-design.spec.ts
test("should display tours page correctly on mobile device", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  // Verify layout on mobile devices
});
```

#### Smoke Tests

```typescript
// tests/e2e/smoke.spec.ts
// Quick tests checking basic application functionality
```

### Running Tests Locally

1. **Make sure you have dependencies installed:**

   ```bash
   npm install
   ```

2. **Install Playwright browsers (only on first run):**

   ```bash
   npx playwright install
   ```

3. **Configure environment variables:**

   ```bash
   # Copy example .env file (if it doesn't exist)
   cp .env.example .env

   # For local testing, run Supabase locally:
   npx supabase start
   ```

   **Note:** The `.env` file should contain Supabase keys. For local Supabase use default keys from `.env.example`.

4. **Run the application in the background (optional - config will auto-start):**

   ```bash
   npm run dev
   ```

5. **Run tests:**
   ```bash
   npm run test
   ```

### Debugging Tests

#### UI Mode (Recommended)

```bash
npm run test:ui
```

Opens an interactive interface allowing:

- Running individual tests
- Viewing test steps
- Inspecting DOM elements
- Time travel debugging

#### Debug Mode

```bash
npm run test:debug
```

Runs tests in debug mode with Playwright Inspector.

#### Headed Mode

```bash
npm run test:headed
```

Runs tests with a visible browser.

### Writing New Tests

1. **Create a new file in the appropriate directory:**

   ```bash
   touch tests/e2e/tours/create-tour.spec.ts
   ```

2. **Use basic structure:**

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

3. **Use helpers from `tests/helpers/` for repeatable actions:**

   ```typescript
   import { loginAsTestUser } from "../helpers/auth";

   test("authenticated test", async ({ page }) => {
     await loginAsTestUser(page);
     // Continue with authenticated actions
   });
   ```

## Chromatic - Visual Regression Tests

### Configuration

1. **Get Project Token from Chromatic:**
   - Sign up at [chromatic.com](https://www.chromatic.com/)
   - Create a new project
   - Copy the Project Token

2. **Create configuration file:**

   ```bash
   cp .chromatic.config.example.json .chromatic.config.json
   ```

3. **Insert your token into `.chromatic.config.json`:**
   ```json
   {
     "projectToken": "YOUR_ACTUAL_TOKEN_HERE",
     ...
   }
   ```

### Running Chromatic Locally

```bash
npm run test:chromatic
```

Chromatic will:

1. Build Storybook
2. Upload snapshots to Chromatic
3. Compare with previous versions
4. Show visual differences

### Adding New Stories

Each component in Storybook is automatically tested by Chromatic:

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

The `.github/workflows/test.yml` file defines the following jobs:

#### 1. Lint & Type Check

- Runs on every push and PR
- Checks code with ESLint
- Verifies TypeScript types

#### 2. Playwright E2E Tests

- Runs on Chromium and Firefox
- Matrix strategy for multi-browser tests
- Uploads reports as artifacts
- **Requires GitHub secrets:**
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

#### 3. Chromatic Visual Tests

- Runs on every push and PR
- Automatically accepts changes on `main` branch
- **Requires secret:** `CHROMATIC_PROJECT_TOKEN`

#### 4. Smoke Tests

- Runs only after merge to `main` or `develop`
- Quick verification of critical functionality
- Uploads reports for 7 days

### Configuring GitHub Secrets

Add the following secrets in repository settings:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name                 | Description                                |
| --------------------------- | ------------------------------------------ |
| `PUBLIC_SUPABASE_URL`       | Supabase project URL                       |
| `PUBLIC_SUPABASE_ANON_KEY`  | Supabase anonymous key                     |
| `SUPABASE_URL`              | Supabase project URL (same as public)      |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key                  |
| `CHROMATIC_PROJECT_TOKEN`   | Chromatic project token                    |

### Viewing Test Results

1. **Playwright Reports:**
   - Go to Actions → Select workflow run
   - Scroll to "Artifacts"
   - Download `playwright-report-*`
   - Unzip and open `index.html`

2. **Chromatic Reports:**
   - GitHub Actions logs contain link to Chromatic
   - Or go directly to chromatic.com

## Best Practices

### 1. Test Selectors

**Use data-testid for stable selectors:**

```html
<button data-testid="submit-button">Submit</button>
```

```typescript
await page.locator('[data-testid="submit-button"]').click();
```

### 2. Waiting for Elements

**Always wait for elements:**

```typescript
// ❌ Bad - may be unstable
await page.click("button");

// ✅ Good - waits for element
await expect(page.locator("button")).toBeVisible();
await page.locator("button").click();
```

### 3. Test Isolation

**Each test should be independent:**

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
// ❌ Bad
test('test 1', async ({ page }) => { ... });

// ✅ Good
test('should redirect unauthenticated user to login when accessing tours', async ({ page }) => { ... });
```

### 5. Grouping Tests

```typescript
test.describe('User Authentication', () => {
  test.describe('Login Flow', () => {
    test('should show email input', async ({ page }) => { ... });
    test('should validate email format', async ({ page }) => { ... });
  });
});
```

## Skipped Tests

Some tests are automatically skipped depending on the environment.

### OTP Verification Valid Scenarios (10 tests)

Located in `tests/e2e/auth/invitation-otp.spec.ts`.

**Skipped in**: Docker/CI environments (`CI=true` or `SKIP_WEBSERVER=true`)

**Reason**:
- Rate limiting - all Docker containers share same IP
- Auth service isolation in Docker

**To run locally**:
```bash
supabase start
npm run test:e2e
```

### Delete Account Tests (35 tests)

Located in `tests/e2e/profile/delete-account.spec.ts`.

**Skipped when**: `TEST_ACCESS_TOKEN` and `TEST_REFRESH_TOKEN` are not set

**To run**:
```env
# Add to .env
TEST_ACCESS_TOKEN=your-test-user-access-token
TEST_REFRESH_TOKEN=your-test-user-refresh-token
```

⚠️ **Warning**: One test actually deletes the user account. Use only with disposable test accounts.

## Troubleshooting

### Playwright

**Problem: Tests timeout**

```bash
# Increase timeout in playwright.config.ts
timeout: 60000, // 60 seconds
```

**Problem: Browsers are not installed**

```bash
npx playwright install
```

**Problem: Port 3000 already in use**

```bash
# Change port in playwright.config.ts
baseURL: 'http://localhost:3001'
# And run dev server on that port
```

### Chromatic

**Problem: Build fails**

```bash
# Check if Storybook builds locally
npm run build-storybook
```

**Problem: Too many snapshots**

```bash
# Use onlyChanged in .chromatic.config.json
"onlyChanged": true
```

## Support and Documentation

- **Playwright**: https://playwright.dev/
- **Chromatic**: https://www.chromatic.com/docs/
- **Storybook**: https://storybook.js.org/
- **Test Plan**: `.ai/@test-plan.mdc`

## Next Steps

### Test Implementation for Remaining Scenarios

The test plan defines additional scenarios to implement:

- **TOUR-01**: Tour creation
- **TOUR-02**: Inviting participants
- **TOUR-03**: Voting system
- **SEC-01**: Testing RLS (Row Level Security)
- **AUTH-01**: Magic link login process

These tests require:

1. Test Supabase database configuration
2. Implementation of helpers for creating test data
3. Mocking email service or using a test email provider

### Expanding Coverage

- Add unit tests with Vitest
- Implement API tests
- Add performance testing with Lighthouse or k6
- Automate accessibility testing
