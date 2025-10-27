# Quick Start: Running Playwright Tests with Docker

This guide helps you run Playwright E2E tests in Docker (perfect for Arch Linux and other unsupported systems).

## Prerequisites

- Docker installed and running
- Git repository cloned
- **`.env` file configured** with required Supabase variables

## Step-by-Step Guide

### 0. Configure Environment Variables

Ensure your `.env` file exists and has the required variables:

```bash
# Check if .env exists
ls -la .env

# If not, copy from example (if available)
cp .env.example .env

# Edit with your values
nano .env
```

**Required variables for tests:**
```env
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these values from:
```bash
supabase status
```

### 1. Start Supabase (for email testing)

```bash
supabase start
```

This starts the local Supabase instance with Mailpit at `http://127.0.0.1:54324/`

**Verify it's running:**
```bash
curl http://127.0.0.1:54324/
```

You should see the Mailpit web interface.

### 2. Start the Dev Server

**IMPORTANT:** You must start the dev server manually before running tests in Docker.

In a separate terminal:

```bash
npm run dev
```

**Verify it's running:**
```bash
curl http://localhost:3000/
```

You should see your application's HTML response.

**Note:** Docker tests expect the dev server to be already running. The `SKIP_WEBSERVER=true` flag tells Playwright not to try starting it automatically.

### 3. Run Tests in Docker

```bash
npm run test:e2e:docker
```

That's it! The Docker container will:
- Build automatically with all browser dependencies
- Connect to your local dev server and Mailpit
- Run all Playwright tests
- Save results to `test-results/` and `playwright-report/`

## Common Commands

```bash
# Run all tests
npm run test:e2e:docker

# Run specific test file
npm run test:e2e:docker -- tests/e2e/auth/login.spec.ts

# Run tests matching a pattern
npm run test:e2e:docker -- -g "should login successfully"

# View HTML report after tests
npm run test:e2e:report
```

## Viewing Results

### Test Reports

After running tests:

```bash
npm run test:e2e:report
```

Opens an HTML report in your browser with:
- Test results summary
- Failed test screenshots
- Videos of test execution
- Detailed trace files

### Test Artifacts

All artifacts are saved to your local filesystem:
- `test-results/` - Screenshots, videos, traces
- `playwright-report/` - HTML reports

## Troubleshooting

### ".env file not found"

**Problem:** Docker script can't find environment configuration

**Solution:**
```bash
# Check if .env exists
ls -la .env

# Create from Supabase status
supabase status

# Or copy from example
cp .env.example .env
```

### "EnvInvalidVariables" or "Invalid environment variables"

**Problem:** Missing or incorrect environment variables

**Solution:**
```bash
# Get current Supabase values
supabase status

# Update .env with correct values
nano .env

# Required variables:
# PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
# SUPABASE_URL=http://127.0.0.1:54321
# SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
```

**Note:** The Docker container mounts your `.env` file at runtime, so changes are picked up without rebuilding the image.

### "Cannot connect to localhost:3000"

**Problem:** Docker can't reach your dev server

**Solution:**
```bash
# Check dev server is running
curl http://localhost:3000/

# Restart dev server if needed
npm run dev
```

### "Cannot connect to Mailpit"

**Problem:** Docker can't reach Mailpit

**Solution:**
```bash
# Check Supabase is running
supabase status

# Start if needed
supabase start

# Verify Mailpit is accessible
curl http://127.0.0.1:54324/
```

### Permission Errors

**Problem:** Test artifacts have wrong permissions

**Solution:**
```bash
sudo chown -R $USER:$USER test-results playwright-report
```

### Docker Build Takes Too Long

**Problem:** First build is slow

**Solution:**
- First build downloads the Playwright image (~1GB)
- Subsequent builds are cached and much faster
- Run `docker system prune` if you need to free space

## Architecture

```
Your Machine (Host)
├── Dev Server (localhost:3000)
├── Supabase/Mailpit (localhost:54324)
└── Docker Container (Playwright)
    ├── Chromium
    ├── Firefox
    └── WebKit
    └── Connects via --network host
```

The Docker container uses host networking, so it sees your local services as if it were running directly on your machine.

## Next Steps

- Read `tests/README.md` for detailed documentation
- View test code in `tests/e2e/auth/`
- Write new tests following the examples
- Check out `tests/e2e/helpers/` for useful utilities

## Need Help?

- Check logs: `docker logs <container-id>`
- Verify network: `docker run --rm --network host nicolaka/netshoot curl localhost:3000`
- See full docs: `tests/README.md`
