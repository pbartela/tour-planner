# Docker Testing Guide

This guide explains how to run E2E tests in Docker containers to solve dependency issues and ensure consistent test environments.

## Why Use Docker for Testing?

- **All browsers work**: Chromium, Firefox, WebKit, Mobile Chrome, and Mobile Safari
- **No local dependency conflicts**: All browser binaries and system dependencies are pre-installed
- **Matches CI environment**: Tests run in the same Ubuntu environment as GitHub Actions
- **Reproducible**: Same results across different development machines
- **Easy onboarding**: New developers can run tests without complex setup

## Prerequisites

- Docker installed (version 20.10+)
- Docker Compose installed (version 2.0+)
- `.env` file with Supabase credentials (copy from `.env.example` or `.env.docker`)

## Quick Start

### 1. Setup Environment

Copy and configure your environment file:

```bash
# Copy the example
cp .env.docker .env

# Or use your existing .env file
# Make sure it contains all required Supabase credentials
```

### 2. Build Containers

```bash
# Build all containers (first time only)
npm run test:docker:build
```

This will:
- Build the Playwright test container (~1.2GB with all browsers)
- Build the Astro app container (~500MB)

### 3. Run Tests

```bash
# Run all E2E tests in Docker
npm run test:docker
```

This command will:
1. Start the Astro dev server in a container
2. Wait for the server to be healthy
3. Run all Playwright tests against it
4. Shut down containers when tests complete
5. Exit with test result code (0 = success, 1 = failure)

## Available Commands

### All Tests

```bash
# Run all E2E tests across all browsers
npm run test:docker
```

### Single Browser Testing

```bash
# Test only Chromium (fastest)
npm run test:docker:chromium

# Test only Firefox
npm run test:docker:firefox

# Test only WebKit (Safari)
npm run test:docker:webkit
```

### Interactive UI Mode

```bash
# Run Playwright UI mode in Docker
npm run test:docker:ui
```

Then open your browser to `http://localhost:9323` to see the interactive test UI.

### Container Management

```bash
# Build containers
npm run test:docker:build

# Stop and remove containers
npm run test:docker:down

# View running containers
docker-compose ps

# View container logs
docker-compose logs app
docker-compose logs playwright
```

## Advanced Usage

### Run Specific Tests

```bash
# Run a specific test file
docker-compose run playwright npx playwright test tests/e2e/smoke.spec.ts

# Run tests matching a pattern
docker-compose run playwright npx playwright test --grep "Authentication"

# Run with custom Playwright flags
docker-compose run playwright npx playwright test --headed --workers=1
```

### Debug Mode

```bash
# Run with Playwright Inspector
docker-compose run playwright npx playwright test --debug
```

### View Test Reports

After running tests, view the HTML report:

```bash
npm run test:report
```

The report is available at `./playwright-report/index.html` and is accessible from your host machine.

## Architecture

The Docker setup consists of two services:

### 1. App Service (`Dockerfile.app`)
- **Base**: `node:22-alpine`
- **Port**: 3000
- **Purpose**: Runs the Astro dev server
- **Healthcheck**: Ensures server is ready before tests start
- **Network**: Connected to `test-network`

### 2. Playwright Service (`Dockerfile.playwright`)
- **Base**: `mcr.microsoft.com/playwright:v1.56.1-noble` (Ubuntu 24.04)
- **Browsers**: Chromium, Firefox, WebKit (all pre-installed)
- **Purpose**: Runs Playwright tests
- **Network**: Connected to `test-network`, communicates with app via `http://app:3000`
- **Volumes**:
  - Test files mounted for live updates
  - Reports mounted to access results on host

### Network Communication

```
┌──────────────────┐     http://app:3000     ┌──────────────────┐
│   Playwright     │ ───────────────────────> │   Astro App      │
│   Container      │                          │   Container      │
│                  │                          │                  │
│ - Chromium       │                          │ - Dev Server     │
│ - Firefox        │                          │ - Port 3000      │
│ - WebKit         │                          │                  │
└──────────────────┘                          └──────────────────┘
        │                                              │
        └──────────────────┬───────────────────────────┘
                           │
                    test-network
```

## Environment Variables

The containers use the following environment variables:

### From `.env` file:
- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_URL` - Same as public URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `PUBLIC_DEFAULT_LOCALE` - Default locale (en-US or pl-PL)

### Set by `docker-compose.yml`:
- `BASE_URL=http://app:3000` - Points tests to app container
- `CI=true` - Enables CI mode in Playwright

## Skipped Tests

Some tests are automatically skipped in Docker/CI environments. This is expected behavior.

### OTP Verification Valid Scenarios (10 tests)

These tests are skipped because:
- **Rate limiting**: All Docker containers share the same IP, causing `too_many_requests` errors
- **Auth service isolation**: GoTrue runs on a separate container with limited connectivity

To run these tests locally:
```bash
# Start local Supabase
supabase start

# Run tests locally (not in Docker)
npm run test:e2e
```

### Delete Account Tests (35 tests)

These tests require authentication tokens that are not set by default:

```env
TEST_ACCESS_TOKEN=your-test-user-access-token
TEST_REFRESH_TOKEN=your-test-user-refresh-token
```

⚠️ **Warning**: These tests use real credentials and one test actually deletes the account. Only use with disposable test accounts.

### Test Summary

| Test Category | Count | Why Skipped | How to Run |
|---------------|-------|-------------|------------|
| OTP Valid Scenarios | 10 | Docker rate limiting/auth isolation | `npm run test:e2e` (local) |
| Delete Account | 35 | Missing `TEST_*_TOKEN` env vars | Set tokens in `.env` |
| **Core Tests** | **160+** | **Not skipped** | `npm run test:docker` |

## Troubleshooting

### Containers won't start

```bash
# Check Docker is running
docker ps

# View logs
docker-compose logs

# Rebuild containers
docker-compose down
npm run test:docker:build
```

### Tests fail to connect to app

```bash
# Check app service health
docker-compose ps

# View app logs
docker-compose logs app

# Ensure .env file has correct Supabase credentials
cat .env
```

### Port conflicts

If port 3000 is already in use:

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process or stop local dev server
npm run dev  # Stop this if running
```

### Slow initial build

The first build downloads ~1.5GB of browser binaries. This is cached for future builds.

```bash
# Check Docker disk usage
docker system df

# Clean up old images if needed
docker system prune -a
```

### Tests pass locally but fail in Docker

1. Check environment variables are correctly set in `.env`
2. Verify Supabase is accessible from containers
3. Check for timing issues (container startup might be slower)
4. Review container logs for errors

## Performance Tips

### 1. Use .dockerignore
Already configured to exclude:
- `node_modules/` (reinstalled in container)
- `dist/`, `.astro/` (build artifacts)
- Test reports, coverage

### 2. Layer Caching
Dockerfiles are optimized to cache npm dependencies separately from source code.

### 3. Parallel Testing
Adjust workers in `playwright.config.ts` based on container resources:

```typescript
// For containers with limited resources
workers: process.env.CI ? 1 : undefined
```

### 4. Single Browser Testing
Test only Chromium for faster feedback during development:

```bash
npm run test:docker:chromium
```

## CI/CD Integration

The Docker setup mirrors the GitHub Actions workflow (`.github/workflows/test.yml`):

- **Local**: Uses Docker Compose
- **CI**: Uses GitHub Actions with same Playwright image
- **Result**: Consistent test results between local and CI

## Maintenance

### Update Playwright Version

1. Update `@playwright/test` in `package.json`
2. Update base image in `Dockerfile.playwright`:
   ```dockerfile
   FROM mcr.microsoft.com/playwright:v1.XX.X-noble
   ```
3. Rebuild containers:
   ```bash
   npm run test:docker:build
   ```

### Update Node Version

1. Update in `Dockerfile.app`:
   ```dockerfile
   FROM node:22-alpine  # Change version here
   ```
2. Rebuild:
   ```bash
   npm run test:docker:build
   ```

## Resources

- [Playwright Docker Documentation](https://playwright.dev/docs/docker)
- [Official Playwright Docker Images](https://mcr.microsoft.com/en-us/product/playwright/about)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Project Testing Guide](./TESTING.md)
