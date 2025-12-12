# GitHub Actions Setup with External Supabase

This guide explains how to configure GitHub Actions to run E2E tests against an external Supabase instance instead of a local one.

## Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. A Resend account with API key (get one at [resend.com](https://resend.com))
3. GitHub repository with Actions enabled

## Step 1: Get Supabase Credentials

### Understanding Supabase API Keys

Supabase now offers two types of API keys:

**New Key Format (Recommended):**
- **Publishable Key** (`sb_publishable_...`) - Safe for client-side use
- **Secret Key** (`sb_secret_...`) - Backend only, cannot be used in browsers

**Legacy JWT Keys (Still Supported):**
- **anon** (`eyJ...`) - Functionally equivalent to publishable key
- **service_role** (`eyJ...`) - Functionally equivalent to secret key

**For CI/CD environments, you can use either format.** The new keys offer easier rotation and better security features, but the JWT keys work perfectly fine.

### Getting Your Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings → API**
3. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)

   **Choose one of the following options:**

   **Option A: New Keys (Recommended)**
   - **Publishable key** (starts with `sb_publishable_...`)
   - **Secret key** (starts with `sb_secret_...`) ⚠️ **Keep this secret!**

   **Option B: Legacy JWT Keys**
   - **anon public** key (starts with `eyJ...`)
   - **service_role secret** key (starts with `eyJ...`) ⚠️ **Keep this secret!**

**Note:** The new publishable and secret keys are only available on Supabase Platform (hosted projects), not for self-hosted instances.

## Step 2: Migrate Database Schema

Your external Supabase needs the same database schema as your local development environment.

```bash
# Link to your external Supabase project
npx supabase link --project-ref <your-project-ref>

# Push all migrations to the external database
npx supabase db push

# Verify migrations were applied
npx supabase migration list
```

**Important:** All migrations in `supabase/migrations/` will be applied to your external database.

## Step 3: Configure GitHub Secrets

Go to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

Add the following secrets:

### Required Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | Publishable key OR anon JWT key | `sb_publishable_...` or `eyJhbGci...` |
| `SUPABASE_URL` | Same as PUBLIC_SUPABASE_URL | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key OR service_role JWT key | `sb_secret_...` or `eyJhbGci...` |
| `RESEND_API_KEY` | Resend API key for emails | `re_xxxxx` |
| `RESEND_FROM_EMAIL` | Sender email address | `Tour Planner <noreply@yourdomain.com>` |

**Key Selection Guide:**
- ✅ **Use new keys** (`sb_publishable_...` and `sb_secret_...`) for easier rotation and better security
- ✅ **Use JWT keys** (`eyJ...`) if you need compatibility with self-hosted Supabase or Edge Functions with JWT verification
- ⚠️ **Mix and match is supported** but not recommended - use one format consistently

### Optional Secrets

| Secret Name | Description |
|-------------|-------------|
| `CHROMATIC_PROJECT_TOKEN` | For visual regression tests |

### How to Add Secrets

1. Click **New repository secret**
2. Enter the **Name** (e.g., `PUBLIC_SUPABASE_URL`)
3. Paste the **Secret** value
4. Click **Add secret**
5. Repeat for all required secrets

## Step 4: Verify Email Configuration

### Using Resend for Production

For production/CI environments, configure Resend:

1. Go to [resend.com](https://resend.com) and create an account
2. Get your API key from **API Keys** section
3. Add the API key as `RESEND_API_KEY` secret in GitHub
4. Configure a verified sender email as `RESEND_FROM_EMAIL`

**Important:** Resend requires domain verification for production use. For testing, you can use their test mode.

### Email Template Testing

The application uses React Email templates. During CI runs:
- Invitation emails will be sent via Resend
- Email content is rendered using templates in `src/lib/templates/`
- No local Mailpit is available in CI (only in local development)

## Step 5: Test the Configuration

### Trigger a Test Run

You can manually trigger the workflow:

1. Go to **Actions** tab in your repository
2. Select **Testing** workflow
3. Click **Run workflow** button
4. Watch the workflow execution

### What Gets Tested

When secrets are configured, these jobs run:

- **Lint & Type Check** - Always runs
- **Vitest Unit Tests** - Always runs
- **Playwright E2E Tests** - Runs if secrets are configured (Chromium + Firefox)
- **Smoke Tests** - Runs on `main`/`develop` branches if secrets are configured
- **Chromatic Visual Tests** - Runs if `CHROMATIC_PROJECT_TOKEN` is configured

### Secret Validation

The workflow automatically checks for required secrets:
- `PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

If any secret is missing, E2E tests are skipped gracefully with a clear message.

## Step 6: Verify Test Results

### Successful Run

✅ All jobs should show green checkmarks
✅ E2E tests should run without errors
✅ Test artifacts (reports, videos) will be uploaded

### Common Issues

#### Tests Skip with "Required secrets not configured"

**Cause:** Missing or incorrectly named secrets

**Solution:**
1. Verify secret names match exactly (case-sensitive)
2. Check that all required secrets are added
3. Re-run the workflow after adding secrets

#### Tests Fail with "ECONNREFUSED" or Network Errors

**Cause:** Supabase URL is incorrect or not accessible

**Solution:**
1. Verify `PUBLIC_SUPABASE_URL` is correct
2. Ensure your Supabase project is active (not paused)
3. Check Supabase dashboard for any service issues

#### Tests Fail with "Invalid API key" or Auth Errors

**Cause:** Wrong API keys or service role key

**Solution:**
1. Re-copy keys from Supabase dashboard (API Settings page)
2. Ensure you're copying the entire key (they're long!)
3. If using new keys, verify they start with `sb_publishable_...` or `sb_secret_...`
4. If using JWT keys, verify they start with `eyJ...`
5. Check you're not mixing publishable/secret keys with wrong secrets (e.g., using a publishable key as service role)

#### Email-Related Failures

**Cause:** Missing or invalid Resend configuration

**Solution:**
1. Verify `RESEND_API_KEY` is correct
2. Check `RESEND_FROM_EMAIL` format: `Name <email@domain.com>`
3. Ensure Resend account is active

#### Database Schema Errors

**Cause:** Migrations not applied to external database

**Solution:**
```bash
# Re-run migrations
npx supabase db push

# Or reset and reapply
npx supabase db reset --db-url <your-db-connection-string>
```

## API Key Management

### Benefits of New Key Format

The new publishable and secret keys (`sb_publishable_...` and `sb_secret_...`) offer several advantages over JWT-based keys:

✅ **Easier Rotation**: Create new keys, update your services, then delete old keys - all without downtime

✅ **Independent Management**: Not tied to JWT secret; rotating one doesn't affect others

✅ **Better Security**: Secret keys automatically return 401 Unauthorized when used in browsers

✅ **Shorter Lifespan**: No 10-year expiry like JWTs - reduced risk window

✅ **Multiple Keys**: Create separate secret keys for different services (e.g., one for CI, one for backend)

✅ **Rollback-Friendly**: Can revert to old keys if new ones cause issues

### Rotating API Keys

#### Rotating New Keys (Recommended)

If using `sb_publishable_...` or `sb_secret_...` keys:

1. Go to **Project Settings → API** in your Supabase dashboard
2. Click **Create new secret key** (or publishable key)
3. Copy the new key
4. Update your GitHub Secrets with the new key
5. Trigger a test workflow run to verify
6. Once confirmed working, delete the old key in Supabase dashboard

**Zero Downtime:** Keep both keys active during transition, delete old one after verification.

#### Rotating JWT Keys (Legacy)

If using JWT-based `anon` and `service_role` keys:

**Option 1 (Recommended):** Migrate to new key format instead:
1. Create new publishable and secret keys in Supabase dashboard
2. Update GitHub Secrets with new keys
3. Test the workflow
4. Optionally deactivate old JWT keys in dashboard

**Option 2:** Rotate JWT secret (affects all JWT keys):
1. Go to **Project Settings → API** → **Rotate JWT Secret**
2. ⚠️ **Warning:** This breaks ALL existing JWT-based keys
3. Copy new `anon` and `service_role` keys
4. Update ALL GitHub Secrets immediately
5. This will cause downtime until secrets are updated

### Key Rotation Best Practices

- 🔄 Rotate keys every 90 days for security
- 📝 Document which keys are used where
- 🔐 Use separate secret keys for CI vs production backends
- ✅ Always test in a staging environment first
- 🗑️ Delete compromised keys immediately
- 📊 Monitor Supabase dashboard for "last used" indicators

## Architecture

### How CI Tests Work

```
┌─────────────────────────────────────────────────────┐
│                  GitHub Actions Runner               │
│                                                       │
│  ┌─────────────┐                                    │
│  │   npm ci    │  Install dependencies              │
│  └──────┬──────┘                                    │
│         │                                            │
│  ┌──────▼──────┐                                    │
│  │ Create .env │  Populate from GitHub Secrets      │
│  └──────┬──────┘                                    │
│         │                                            │
│  ┌──────▼──────┐                                    │
│  │  npm run    │  Start Astro dev server            │
│  │     dev     │  (localhost:3000)                  │
│  └──────┬──────┘                                    │
│         │                                            │
│  ┌──────▼──────────┐                                │
│  │   Playwright    │  Run E2E tests                 │
│  │     Tests       │  • Auth flows                  │
│  │                 │  • Tour management             │
│  │                 │  • i18n validation             │
│  └──────┬──────────┘                                │
│         │                                            │
│         └────────────► Upload test reports          │
│                                                       │
└─────────────────────────────────────────────────────┘
           │                           │
           │                           │
           ▼                           ▼
   ┌───────────────┐          ┌──────────────┐
   │   External    │          │   Resend     │
   │   Supabase    │          │   Email      │
   │   Database    │          │   Service    │
   └───────────────┘          └──────────────┘
```

### Workflow Jobs

1. **lint** - TypeScript + ESLint checks (always runs)
2. **vitest** - Unit tests with coverage (always runs)
3. **playwright** - E2E tests on Chromium + Firefox (requires secrets)
4. **smoke-tests** - Critical path tests on main/develop (requires secrets)
5. **chromatic** - Visual regression tests (requires token)

### Environment Variables in CI

The workflow creates a `.env` file with:
- Supabase connection details
- Resend email configuration
- Default locale settings

**Note:** Unlike local development, CI does **not** use:
- Local Supabase instance
- Mailpit SMTP server
- Docker containers for tests

## Best Practices

### Security

- ✅ Never commit `.env` files with real credentials
- ✅ Rotate service role keys periodically
- ✅ Use separate Supabase projects for staging/production
- ✅ Limit service role key usage to CI only

### Performance

- ✅ E2E tests run on Chromium + Firefox only (not WebKit in CI)
- ✅ Tests run sequentially in CI (`workers: 1`) for stability
- ✅ Retries enabled (2 attempts) for flaky tests
- ✅ Test artifacts retained for 30 days (reports) / 7 days (videos)

### Maintenance

- ✅ Keep migrations in sync between local and external DB
- ✅ Monitor Supabase usage quotas
- ✅ Review failed tests and update as needed
- ✅ Update secrets when rotating API keys

## Additional Resources

- [Playwright CI Documentation](https://playwright.dev/docs/ci)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Resend Documentation](https://resend.com/docs)

## Troubleshooting Commands

```bash
# Check Supabase connection
npx supabase status

# Verify migrations
npx supabase migration list

# Test database connection
psql <your-db-connection-string> -c "SELECT version();"

# Run E2E tests locally with external Supabase
# (Create .env.test with external Supabase credentials)
npm run test:e2e
```

## Getting Help

If you encounter issues:

1. Check the Actions logs for detailed error messages
2. Verify all secrets are correctly configured
3. Test Supabase connection manually
4. Review the migration history
5. Check Supabase dashboard for errors or warnings

For project-specific questions, refer to:
- `CLAUDE.md` - Project overview and conventions
- `TESTING.md` - Testing strategy and documentation
- `docs/SECURITY_ARCHITECTURE.md` - Security and RLS policies
