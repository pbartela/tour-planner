# GitHub Actions CI Secrets Documentation

This document describes all required and optional GitHub repository secrets needed for the CI/CD workflows to function properly.

## Required Secrets

None of the secrets are strictly required for basic CI operations (lint, type check, unit tests). However, certain features require specific secrets to be configured.

## Optional Secrets

### Supabase (E2E Tests & Smoke Tests)

Required for running Playwright E2E tests and smoke tests in CI. If these secrets are not configured, the E2E and smoke test jobs will be skipped gracefully.

#### `PUBLIC_SUPABASE_URL`

- **Description**: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- **Used by**: `playwright` job, `smoke-tests` job
- **How to get**:
  1. Go to your Supabase project dashboard
  2. Navigate to Settings → API
  3. Copy the "Project URL"
- **Example**: `https://abcdefghijklmnop.supabase.co`

#### `PUBLIC_SUPABASE_ANON_KEY`

- **Description**: Your Supabase anonymous/public API key
- **Used by**: `playwright` job, `smoke-tests` job
- **How to get**:
  1. Go to your Supabase project dashboard
  2. Navigate to Settings → API
  3. Copy the "anon" key under "Project API keys"
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### `SUPABASE_URL`

- **Description**: Same as `PUBLIC_SUPABASE_URL` (used for server-side operations)
- **Used by**: `playwright` job, `smoke-tests` job
- **How to get**: Same as `PUBLIC_SUPABASE_URL`
- **Note**: Typically the same value as `PUBLIC_SUPABASE_URL`

#### `SUPABASE_SERVICE_ROLE_KEY`

- **Description**: Your Supabase service role key (admin access)
- **Used by**: `playwright` job, `smoke-tests` job
- **How to get**:
  1. Go to your Supabase project dashboard
  2. Navigate to Settings → API
  3. Copy the "service_role" key under "Project API keys"
- **⚠️ Security**: This key has admin access. Never expose it publicly or commit it to version control.
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Chromatic (Visual Regression Tests)

Required for running visual regression tests with Chromatic. If not configured, the `chromatic` job will be skipped.

#### `CHROMATIC_PROJECT_TOKEN`

- **Description**: Chromatic project token for visual regression testing
- **Used by**: `chromatic` job
- **How to get**:
  1. Sign up at [chromatic.com](https://www.chromatic.com/)
  2. Create a new project or use an existing one
  3. Copy the project token from the project settings
  4. Alternatively, follow the setup guide in `docs/CHROMATIC_SETUP.md`
- **Example**: `chpt_xxxxxxxxxxxxxxxx`

### Claude Code (AI Code Review & PR Assistant)

Required for AI-powered code reviews and PR assistance. If not configured, Claude workflows will be skipped.

#### `CLAUDE_CODE_OAUTH_TOKEN`

- **Description**: OAuth token for Claude Code integration
- **Used by**: `claude.yml`, `claude-code-review.yml`
- **How to get**:
  1. Go to [claude.ai](https://claude.ai/)
  2. Navigate to your account settings
  3. Generate an OAuth token for GitHub Actions
  4. See [Claude Code documentation](https://claude.ai/docs) for detailed instructions
- **Example**: `oauth_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Security Analysis

#### `CLAUDE_API_KEY`

- **Description**: Claude API key for security vulnerability analysis
- **Used by**: `security.yml`
- **How to get**:
  1. Go to [Anthropic Console](https://console.anthropic.com/)
  2. Navigate to API Keys
  3. Create a new API key
- **⚠️ Security**: Protect this key. It provides access to Claude API.
- **Example**: `sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Codecov (Coverage Reports)

The `codecov/codecov-action@v4` is used in the workflow but doesn't require explicit secrets configuration for public repositories. For private repositories, you may need:

#### `CODECOV_TOKEN` (Optional)

- **Description**: Codecov token for uploading coverage reports
- **Used by**: `vitest` job (implicitly by codecov-action)
- **How to get**:
  1. Sign up at [codecov.io](https://codecov.io/)
  2. Add your GitHub repository
  3. Copy the upload token
- **Note**: Only required for private repositories. Public repositories work without a token.

## How to Add Secrets to GitHub

1. Navigate to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the secret name (exactly as shown above, case-sensitive)
5. Paste the secret value
6. Click **Add secret**

## Workflow Behavior Without Secrets

All workflows are designed to degrade gracefully when secrets are missing:

- **Lint & Type Check**: Always runs (no secrets needed)
- **Vitest Unit Tests**: Always runs (no secrets needed)
- **Playwright E2E Tests**: Skipped if Supabase secrets are missing
- **Chromatic Visual Tests**: Skipped if `CHROMATIC_PROJECT_TOKEN` is missing
- **Smoke Tests**: Skipped if Supabase secrets are missing
- **Claude Workflows**: Skipped if Claude tokens are missing

## Testing Your Configuration

After adding secrets, push a commit or create a pull request to trigger the workflows. Check the Actions tab to verify all jobs run successfully.

## Security Best Practices

1. **Never commit secrets** to version control
2. **Rotate secrets periodically** (especially service role keys)
3. **Use minimal permissions** where possible
4. **Monitor secret usage** via GitHub Actions audit logs
5. **Delete unused secrets** to reduce attack surface
6. **Use separate Supabase projects** for development, staging, and production
7. **Review GitHub Actions logs** for any exposed secrets (GitHub automatically redacts them, but be cautious)

## Troubleshooting

### E2E Tests Are Skipped

**Cause**: Supabase secrets are not configured or are incorrect.

**Solution**:
- Verify all four Supabase secrets are added
- Check that the keys are copied correctly (no extra spaces/newlines)
- Ensure the Supabase project is accessible

### Chromatic Tests Are Skipped

**Cause**: `CHROMATIC_PROJECT_TOKEN` is not configured.

**Solution**:
- Add the Chromatic project token as described above
- See `docs/CHROMATIC_SETUP.md` for detailed setup

### Claude Workflows Are Skipped

**Cause**: Claude tokens are not configured.

**Solution**:
- Add the appropriate Claude token (`CLAUDE_CODE_OAUTH_TOKEN` or `CLAUDE_API_KEY`)
- Verify the token is valid and has necessary permissions

## Related Documentation

- [TESTING.md](../TESTING.md) - Comprehensive testing documentation
- [CHROMATIC_SETUP.md](./CHROMATIC_SETUP.md) - Chromatic visual testing setup
- [CLAUDE.md](../CLAUDE.md) - Project instructions for Claude Code
- [GitHub Actions Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase Documentation](https://supabase.com/docs)
