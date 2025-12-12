# Supabase API Key Migration Guide

## What Changed?

Supabase introduced new API key formats to replace the legacy JWT-based keys:

| Old (JWT) | New | Benefits |
|-----------|-----|----------|
| `anon` key (`eyJ...`) | Publishable key (`sb_publishable_...`) | Same functionality, easier rotation |
| `service_role` key (`eyJ...`) | Secret key (`sb_secret_...`) | Enhanced security, browser protection, independent rotation |

**You don't need to migrate immediately** - both formats work and will continue to work. However, the new format offers significant benefits for production use.

## Should You Migrate?

### Reasons to Migrate to New Keys

✅ **Enhanced Security**: Secret keys automatically fail when used in browsers (returns 401)

✅ **Zero-Downtime Rotation**: Create new keys → update services → delete old keys

✅ **Independent Management**: Rotating keys doesn't affect JWT secret or other keys

✅ **Multiple Keys**: Create separate secret keys for CI, production, staging

✅ **Better Lifecycle**: No 10-year expiry like JWTs, reducing long-term risk

✅ **Easy Rollback**: Keep old keys active during testing, revert if needed

### Reasons to Keep JWT Keys

✅ **Self-Hosting**: New keys only work on Supabase Platform, not self-hosted instances

✅ **Edge Functions with JWT Verification**: Edge Functions only support JWT verification

✅ **Already Working**: If your current setup works fine, no urgent need to change

## Migration Path for GitHub Actions

### Current Setup (JWT Keys)

Your current `.env` uses JWT-based keys:
```bash
PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...  # JWT anon key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # JWT service_role key
```

### Step 1: Get New Keys from Supabase Dashboard

1. Go to **Project Settings → API** in your Supabase dashboard
2. Scroll to **Publishable Keys** section
3. Copy your **Publishable key** (starts with `sb_publishable_...`)
4. Scroll to **Secret Keys** section
5. Click **Create new secret key**
6. Give it a name (e.g., "GitHub Actions CI")
7. Copy the new **Secret key** (starts with `sb_secret_...`)

### Step 2: Update GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings → Secrets and variables → Actions**
3. Update these secrets with new values:
   - `PUBLIC_SUPABASE_ANON_KEY` → paste publishable key (`sb_publishable_...`)
   - `SUPABASE_SERVICE_ROLE_KEY` → paste secret key (`sb_secret_...`)
4. Click **Update secret**

### Step 3: Test the Configuration

1. Go to **Actions** tab
2. Manually trigger the **Testing** workflow
3. Verify all E2E tests pass
4. Check logs for any authentication errors

### Step 4: Clean Up (Optional)

Once confirmed working, you can:

1. Go to **Project Settings → API** in Supabase dashboard
2. In the **API Keys** section, check "last used" for old JWT keys
3. Optionally deactivate the old JWT keys (they will stop working)
4. Keep them active if you want to maintain backwards compatibility

## Migration Path for Local Development

**For local development, continue using JWT keys** - they're provided by local Supabase CLI and work perfectly fine. The new key format is primarily beneficial for hosted Supabase instances in production/CI environments.

Your `.env` for local development should keep:
```bash
PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...  # From npx supabase start
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # From npx supabase start
```

## Compatibility Matrix

| Environment | Publishable Key | Secret Key | JWT anon | JWT service_role |
|-------------|----------------|------------|----------|------------------|
| Local Dev (Supabase CLI) | ❌ | ❌ | ✅ | ✅ |
| Hosted Supabase Platform | ✅ | ✅ | ✅ | ✅ |
| Self-Hosted Supabase | ❌ | ❌ | ✅ | ✅ |
| GitHub Actions CI | ✅ | ✅ | ✅ | ✅ |
| Edge Functions (JWT verify) | ❌ | ❌ | ✅ | ✅ |

## Rollback Plan

If you encounter issues after migrating:

1. **Immediate Rollback**: Both old and new keys work simultaneously
   - Simply update GitHub Secrets back to JWT keys (`eyJ...`)
   - Or re-activate JWT keys in Supabase dashboard if deactivated

2. **No Downtime Required**: Keep both key types active during testing period

3. **Safe Deletion**: Only delete old keys after 100% confidence in new setup

## Common Questions

### Q: Will my app break if I don't migrate?

**A:** No. JWT-based keys will continue to work. This migration is optional but recommended for enhanced security and easier management.

### Q: Can I use new keys in local development?

**A:** No. Local Supabase CLI only provides JWT keys. Use new keys for hosted Supabase instances only.

### Q: What if I use Edge Functions?

**A:** If your Edge Functions use JWT verification (`--no-verify-jwt` flag not set), stick with JWT keys or implement custom `apikey` header verification in your function code.

### Q: Can I mix new and old keys?

**A:** Technically yes, but not recommended. Use one format consistently across your application.

### Q: How do I rotate a compromised secret key?

**A:** With new keys: Create new key → Update GitHub Secrets → Delete compromised key. With JWT keys: Must rotate JWT secret, affecting ALL keys.

## Need Help?

- See the full documentation: [docs/GITHUB_ACTIONS_SUPABASE_SETUP.md](./GITHUB_ACTIONS_SUPABASE_SETUP.md)
- Supabase docs: https://supabase.com/docs/guides/api/api-keys
- Project setup: [CLAUDE.md](../CLAUDE.md) → Environment Variables section

## Verification Checklist

After migrating to new keys:

- [ ] GitHub Secrets updated with new keys
- [ ] Test workflow runs successfully
- [ ] E2E tests pass without authentication errors
- [ ] No 401 Unauthorized errors in logs
- [ ] Documented which keys are used where
- [ ] Old JWT keys deactivated (optional, after verification period)
