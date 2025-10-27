# E2E Testing with Playwright

End-to-end tests for the Tour Planner application using [Playwright](https://playwright.dev/).

## Quick Start

```bash
# 1. Install Playwright
npm install -D @playwright/test
npx playwright install

# 2. Start Supabase (for email testing)
supabase start

# 3. Run tests (dev server starts automatically)
npm run test:e2e
```

## Test Execution Order

**CRITICAL:** Tests run in a specific order to ensure proper data setup:

1. **01-register.spec.ts** - Creates new users (MUST RUN FIRST)
2. **02-login.spec.ts** - Tests login with users from step 1
3. **03-onboarding.spec.ts** - Tests onboarding flow
4. **04-logout.spec.ts** - Tests logout
5. **05-integration.spec.ts** - End-to-end journeys

Configuration enforces order:
- `fullyParallel: false` - Tests run serially
- `workers: 1` - Single worker
- Files prefixed with numbers (01-, 02-, etc.) for alphabetical execution

## Running Tests

```bash
# All tests in order
npm run test:e2e

# UI mode (recommended for development)
npm run test:e2e:ui

# With visible browser
npm run test:e2e:headed

# Specific test file
npx playwright test 01-register

# Specific test by name
npx playwright test -g "should complete registration"
```

## Prerequisites

### 1. Supabase (Required)

```bash
supabase start
```

Provides:
- **Mailpit** at `http://127.0.0.1:54324/` for email testing
- **Supabase** at `http://127.0.0.1:54321/`

### 2. Environment Variables

Create `.env` with Supabase credentials:

```env
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
```

Get values: `supabase status`

## Email Testing

Tests use **Mailpit** for real email testing:

```typescript
// Extract magic link from email
const magicLink = await getMagicLinkFromEmail('user@example.com');

// Create authenticated session
await createTestUserSession(page, 'user@example.com', {
  completeOnboarding: true
});

// Clear inbox
await mailpit.deleteAllMessages();
```

## Test Structure

```
tests/
├── e2e/
│   ├── auth/
│   │   ├── 01-register.spec.ts     # ← RUNS FIRST
│   │   ├── 02-login.spec.ts
│   │   ├── 03-onboarding.spec.ts
│   │   ├── 04-logout.spec.ts
│   │   └── 05-integration.spec.ts
│   └── helpers/
│       ├── auth.helpers.ts
│       └── mailpit.client.ts
```

## Configuration

`playwright.config.ts` settings:

- **testDir**: `./tests/e2e`
- **fullyParallel**: `false` (serial execution)
- **workers**: `1` (single worker)
- **baseURL**: `http://localhost:3000`
- **webServer**: Auto-starts dev server

## Troubleshooting

### Supabase not running
```bash
supabase status
supabase start
```

### Missing environment variables
```bash
supabase status  # Get credentials
# Add to .env file
```

### Email not received
- Check Mailpit: `http://127.0.0.1:54324/`
- Clear inbox: `await mailpit.deleteAllMessages()`

### Tests running out of order
- Files must be named: `01-`, `02-`, etc.
- Config must have: `fullyParallel: false`, `workers: 1`

## Writing Tests

```typescript
import { test, expect } from '@playwright/test';
import { createTestUserSession } from '../helpers/auth.helpers';
import { mailpit } from '../helpers/mailpit.client';

test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
    await mailpit.deleteAllMessages();
  });

  test('should work', async ({ page }) => {
    await createTestUserSession(page, 'test@example.com');
    await page.goto('/en-US/page');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

## Resources

- [Playwright Docs](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging](https://playwright.dev/docs/debug)
