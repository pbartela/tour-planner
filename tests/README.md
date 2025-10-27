# E2E Testing with Playwright

This directory contains end-to-end tests for the Tour Planner application using [Playwright](https://playwright.dev/).

## Setup

### Option 1: Docker (Recommended for Arch Linux / Unsupported OS)

If you're on an unsupported OS like Arch Linux, or encounter browser installation issues, use Docker:

**Prerequisites:**
- Docker installed and running
- `.env` file configured with Supabase credentials
- Supabase running locally (`supabase start`)
- Dev server running (`npm run dev`)

**No additional setup needed** - Docker image includes all browser dependencies.

**Important:** The Docker container mounts your `.env` file, so make sure it exists and contains valid Supabase credentials.

### Option 2: Local Installation

Install Playwright and its dependencies:

```bash
npm install -D @playwright/test
npx playwright install
```

If you encounter network issues, you can install browsers manually:

```bash
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

**Note:** Playwright officially supports Ubuntu/Debian. On other systems (Arch, Fedora, etc.), you may need to install system dependencies manually or use Docker.

### 2. Start Local Supabase (Required for Email Testing)

The tests use Mailpit for email verification. Start your local Supabase instance:

```bash
supabase start
```

This will start Mailpit at `http://127.0.0.1:54324/` for email testing.

### 3. Environment Configuration

The tests use the base URL defined in `playwright.config.ts`. By default, it uses `http://localhost:3000`.

You can override this with an environment variable:

```bash
export BASE_URL=http://localhost:3000
```

### 4. Start the Development Server

Before running tests, ensure your development server is running:

```bash
npm run dev
```

Or, let Playwright start it automatically (configured in `playwright.config.ts`).

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode (recommended for development)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test tests/e2e/auth/login.spec.ts

# Run specific test by name
npx playwright test -g "should display login page"
```

### View test report (both methods)

```bash
npm run test:e2e:report
```

## Test Structure

```
tests/
├── e2e/
│   ├── auth/
│   │   ├── login.spec.ts          # Login flow tests
│   │   ├── register.spec.ts       # Registration flow tests
│   │   ├── logout.spec.ts         # Logout flow tests
│   │   ├── onboarding.spec.ts     # Onboarding flow tests
│   │   └── integration.spec.ts    # Full user journey integration tests
│   └── helpers/
│       ├── auth.helpers.ts        # Helper functions for auth flows
│       └── mailpit.client.ts      # Mailpit API client for email testing
└── README.md                       # This file
```

## Test Coverage

### Authentication Tests

#### Register Flow (`register.spec.ts`)
- Display registration page correctly
- Validate email input
- Request magic link successfully
- Handle rate limiting
- Handle network errors
- Security features (CSRF, secure cookies, redirect protection)

#### Login Flow (`login.spec.ts`)
- Display login page with all elements
- Accept valid email addresses
- Show loading state during submission
- Remember locale preference
- Handle redirect parameter
- Error handling (API errors, timeout)
- Accessibility (keyboard navigation, ARIA labels)

#### Logout Flow (`logout.spec.ts`)
- Successfully log out authenticated user
- Display logout confirmation page
- Clear session cookies and storage
- Require re-authentication after logout
- Navigation options (sign in again, back to home)
- Security (session invalidation, CSRF protection)

#### Onboarding Flow (`onboarding.spec.ts`)
- Display onboarding modal for new users
- Complete all onboarding steps
- Allow skipping onboarding
- Show progress indicators
- Not show for returning users
- Persist completion across sessions
- API integration with CSRF protection
- Focus trap and keyboard navigation
- ARIA attributes for accessibility

#### Integration Tests (`integration.spec.ts`)
- Complete user journey: register → onboard → use app → logout
- Returning user flow with onboarding already completed
- Skipping onboarding flow
- Session persistence across page navigations
- Multiple tabs with same session
- Error recovery (expired/invalid magic links)
- Locale persistence through auth flow
- Security tests (magic link reuse prevention, CSRF tokens)

## Email Testing with Mailpit

The tests integrate with **Mailpit**, a local email testing service that runs as part of Supabase local development.

### How it Works

1. **Mailpit runs at**: `http://127.0.0.1:54324/` (started via `supabase start`)
2. **Mailpit Client**: `tests/e2e/helpers/mailpit.client.ts` provides methods to:
   - Fetch emails sent to specific addresses
   - Extract magic links from email content
   - Wait for emails to arrive
   - Clean up test emails

### Key Features

- **Real email testing**: Tests send actual emails through Supabase/Mailpit
- **Magic link extraction**: Automatically finds and extracts auth confirmation links
- **Async waiting**: Polls for emails with configurable timeout
- **Clean state**: Clears inbox between tests to avoid conflicts

### Mailpit Client Methods

```typescript
// Wait for and get magic link
const magicLink = await mailpit.waitForMagicLink('user@example.com', 30000);

// Get latest message for an email
const message = await mailpit.getLatestMessageForEmail('user@example.com');

// Clear all messages (useful in beforeEach)
await mailpit.deleteAllMessages();

// Search for messages
const results = await mailpit.searchMessages('to:user@example.com');
```

## Test User Sessions

The `createTestUserSession()` helper function creates authenticated sessions for tests:

```typescript
// Create session with onboarding completed
await createTestUserSession(page, 'user@example.com', {
  completeOnboarding: true,
  locale: 'en-US'
});

// Create session without completing onboarding (to test onboarding flow)
await createTestUserSession(page, 'user@example.com', {
  completeOnboarding: false
});
```

This function:
1. Requests a magic link via the login form
2. Retrieves the magic link from Mailpit
3. Completes the authentication flow
4. Optionally completes or skips onboarding
5. Verifies the session is authenticated

## Writing New Tests

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { clearSession } from '../helpers/auth.helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
  });

  test('should do something', async ({ page }) => {
    await page.goto('/en-US/page');

    // Your test assertions
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid attributes** for more reliable selectors
2. **Wait for elements** before interacting: `await expect(element).toBeVisible()`
3. **Use semantic selectors** when possible: `page.getByRole('button', { name: 'Submit' })`
4. **Clear session** before each test to ensure clean state
5. **Test in multiple locales** when applicable
6. **Include accessibility tests** (keyboard navigation, ARIA attributes)

## Debugging Tests

### Visual Debugging with UI Mode

```bash
npm run test:e2e:ui
```

This opens an interactive UI where you can:
- See test execution in real-time
- Step through tests
- Inspect DOM at each step
- View network requests

### Debug Mode

```bash
npm run test:e2e:debug
```

This opens the Playwright Inspector where you can:
- Step through test execution
- Explore page elements
- Record new test actions

### Generate Tests with Codegen

```bash
npm run test:e2e:codegen
```

This opens a browser where Playwright records your actions and generates test code.

## CI/CD Integration

Tests are configured to run in CI environments with:
- Automatic retry on failure (2 retries)
- Single worker (no parallel execution)
- GitHub Actions reporter
- Screenshots and videos on failure

### Using Docker in CI (Recommended)

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Supabase CLI
        run: |
          curl -fsSL https://supabase.com/install.sh | sh
          supabase start

      - name: Install dependencies
        run: npm ci

      - name: Start dev server
        run: npm run dev &

      - name: Wait for dev server
        run: npx wait-on http://localhost:3000

      - name: Upload test report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Using Local Installation in CI

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run Playwright tests
  run: npm run test:e2e

- name: Upload test report
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Configuration

Test configuration is in `playwright.config.ts`. Key settings:

- **testDir**: `./tests/e2e` - Location of test files
- **fullyParallel**: `true` - Run tests in parallel
- **retries**: `0` (local), `2` (CI)
- **workers**: Automatic (local), `1` (CI)
- **baseURL**: `http://localhost:3000`
- **trace**: On first retry
- **screenshot**: Only on failure
- **video**: Retain on failure

### Browser Coverage

Tests run on:
- Chromium (Desktop)
- Firefox (Desktop)
- WebKit (Desktop)
- Chrome Mobile (Pixel 5)
- Safari Mobile (iPhone 12)

## Docker Architecture

When running tests with Docker:

```
┌─────────────────────┐
│   Docker Container  │
│   (Playwright)      │
│   - Chromium        │
│   - Firefox         │
│   - WebKit          │
└──────────┬──────────┘
           │
           │ Uses host network
           │
           ├──> localhost:3000 (Dev Server)
           └──> localhost:54324 (Mailpit)
```

The Docker container uses `--network host` to access:
- Your dev server at `localhost:3000`
- Mailpit at `localhost:54324`
- All tests run as if they were on your host machine

**Environment Variables:**
The container mounts your `.env` file as a read-only volume:
```bash
-v "$(pwd)/.env:/app/.env:ro"
```

This means:
- Changes to `.env` are picked up without rebuilding
- Container uses your actual Supabase credentials
- No environment variables are baked into the image

**Files persisted to host:**
- `test-results/` - Test artifacts, screenshots, videos
- `playwright-report/` - HTML test reports

## Troubleshooting

### Docker-specific issues

**"EnvInvalidVariables" or missing environment variables**
- Ensure `.env` file exists in project root
- Get Supabase credentials: `supabase status`
- Required variables:
  ```
  PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
  PUBLIC_SUPABASE_ANON_KEY=<anon-key>
  SUPABASE_URL=http://127.0.0.1:54321
  SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
  ```
- Docker mounts `.env` at runtime (no rebuild needed after changes)

**"Timed out waiting for webServer" or "Cannot connect to localhost:3000"**
- **Dev server must be running** before starting Docker tests
- Start it manually: `npm run dev` (in separate terminal)
- Verify it's accessible: `curl http://localhost:3000`
- Docker sets `SKIP_WEBSERVER=true` - it won't start the server for you
- Docker uses host networking, so the container sees your local services

**"Cannot connect to Mailpit"**
- Ensure Supabase is running: `supabase start`
- Verify Mailpit is accessible: `curl http://127.0.0.1:54324`
- Check Supabase status: `supabase status`


**Permission errors on test results**
- Files created in Docker may have different permissions
- Fix: `sudo chown -R $USER:$USER test-results playwright-report`

### Mailpit connection errors

- Ensure Supabase is running: `supabase start`
- Check Mailpit is accessible at `http://127.0.0.1:54324/`
- Verify Supabase configuration in `.env`

### Email not received in tests

- Check Mailpit inbox at `http://127.0.0.1:54324/`
- Verify email was actually sent (check app logs)
- Increase timeout in `waitForMagicLink()` if network is slow
- Clear Mailpit inbox: `await mailpit.deleteAllMessages()`

### Tests fail with "Navigation timeout"

- Ensure dev server is running: `npm run dev`
- Ensure Supabase is running: `supabase start`
- Check if the port is correct in `playwright.config.ts`
- Increase timeout in test if needed

### "Element not found" errors

- Add explicit waits: `await expect(element).toBeVisible()`
- Check if element selector is correct
- Verify element exists in the DOM

### Rate limiting issues

- Tests may hit rate limits if running too frequently
- Set `TEST_MODE=true` in `.env` for higher limits
- Add delays between requests if needed
- Clear Mailpit inbox between test runs

### CSRF token errors

- Ensure `getCsrfToken()` is called before state-changing requests
- Check that CSRF middleware is properly configured
- Verify cookies are being set and sent correctly

### Magic link errors

- Check magic link format in email
- Verify token hasn't expired (usually valid for 1 hour)
- Ensure link points to correct base URL
- Check for any URL encoding issues

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
- [Locators](https://playwright.dev/docs/locators)

## Contributing

When adding new tests:

1. Follow the existing structure and naming conventions
2. Add helper functions to `helpers/` directory
3. Include accessibility and security tests
4. Test error handling and edge cases
5. Update this README with new test coverage
6. Ensure tests pass before committing
