# Migration to PKCE Flow for Magic Link Authentication

## Overview

This document describes the migration from **implicit flow** (insecure, client-side) to **PKCE flow** (secure, server-side) for magic link authentication.

## What Changed

### Before (Implicit Flow)
1. User clicks magic link → redirected to `/auth-callback`
2. Tokens (`access_token`, `refresh_token`) exposed in URL fragment (`#access_token=...`)
3. Client-side JavaScript extracts tokens from URL
4. Client sends tokens to `/api/auth/session` to establish session
5. **Security Issue**: Tokens exposed to browser, potentially logged in history, analytics, etc.

### After (PKCE Flow)
1. User clicks magic link → redirected to `/auth/confirm?token_hash=...&type=email`
2. Server-side Astro page receives `token_hash` in query params
3. Server calls `supabase.auth.verifyOtp()` to exchange hash for session
4. Session established server-side via secure cookies
5. User redirected to intended destination
6. **Security Benefit**: Tokens never exposed to client, proper PKCE standard

## Files Changed

### Created
- [src/pages/auth/confirm.astro](../src/pages/auth/confirm.astro) - Server-side PKCE token verification endpoint

### Modified
- [supabase/templates/invite.html](../supabase/templates/invite.html) - Email template now uses `{{ .TokenHash }}` instead of `{{ .ConfirmationURL }}`
- [src/pages/api/auth/magic-link.ts](../src/pages/api/auth/magic-link.ts) - Redirect URL changed from `/auth-callback` to `/auth/confirm`
- [supabase/config.toml](../supabase/config.toml) - Added `/auth/confirm` to `additional_redirect_urls`

### Deprecated
- `src/pages/auth-callback.astro` - Renamed to `.deprecated`, no longer used

## Webhook Compatibility

### Analysis: Webhooks Still Work ✅

The webhook integration is **fully compatible** with PKCE flow because:

1. **Webhook Trigger Point**: The webhook triggers on `INSERT` into `auth.users` table
2. **When User is Created**: Supabase creates the user record in `auth.users` when `verifyOtp()` succeeds
3. **Flow Comparison**:
   ```
   Implicit Flow:
   verifyOtp (client) → user created in auth.users → webhook fires → profile created

   PKCE Flow:
   verifyOtp (server) → user created in auth.users → webhook fires → profile created
   ```
4. **Key Insight**: The webhook doesn't care HOW the user was authenticated (implicit vs PKCE), it only cares that a new user was inserted into `auth.users`

### Verification Points

The webhook will continue to:
- ✅ Trigger when new users sign up via magic link
- ✅ Receive the `user.id` from the `auth.users` INSERT event
- ✅ Create a profile in the `profiles` table using the admin client
- ✅ Handle duplicate profile creation gracefully (if webhook retries)

### What to Test

1. **New User Signup Flow**:
   - User requests magic link
   - User clicks link in email
   - `/auth/confirm` verifies token (creates user in `auth.users`)
   - Webhook fires and creates profile
   - User is redirected to dashboard with valid session

2. **Existing User Login Flow**:
   - User requests magic link
   - User clicks link in email
   - `/auth/confirm` verifies token (no new user created)
   - No webhook fires (no INSERT event)
   - User is redirected to dashboard with valid session

## Testing Locally

### 1. Start Supabase and App
```bash
supabase start
npm run dev
```

### 2. Configure Webhook (if not already configured)
Follow [WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md) to configure the webhook to point to:
```
http://host.docker.internal:4321/api/webhooks/profile-creation
```

### 3. Test New User Signup
```bash
# Request magic link via the API
curl -X POST http://localhost:4321/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","locale":"en-US"}'

# Check Inbucket (http://localhost:54324) for the email
# Click the magic link in the email
# Should redirect to /auth/confirm?token_hash=...&type=email
# Should then redirect to dashboard with session established
```

### 4. Verify Webhook Fired
Check application logs for:
```
Successfully created profile for user {userId}
```

Or query the database:
```sql
SELECT * FROM profiles WHERE id = (
  SELECT id FROM auth.users WHERE email = 'test@example.com'
);
```

## Production Deployment Checklist

- [ ] Update environment variables (no new vars needed)
- [ ] Apply Supabase config changes (restart Supabase if self-hosted)
- [ ] Ensure webhook is configured and pointing to production URL
- [ ] Test magic link flow in production
- [ ] Verify webhook deliveries in Supabase Dashboard → Database → Webhooks → Deliveries
- [ ] Monitor logs for any errors during the first few signups
- [ ] After successful validation, delete `auth-callback.astro.deprecated`

## Rollback Plan

If issues arise, you can quickly rollback:

1. Restore `auth-callback.astro` from `.deprecated` backup
2. Revert `supabase/templates/invite.html` to use `{{ .ConfirmationURL }}`
3. Revert `src/pages/api/auth/magic-link.ts` to redirect to `/auth-callback`
4. Restart the application

**Note**: Webhooks will continue to work regardless of auth flow.

## Security Benefits

1. **Tokens Never Exposed to Client**: With PKCE, tokens are exchanged server-side
2. **No Token Leakage**: Tokens won't appear in browser history, analytics, or logs
3. **Industry Standard**: PKCE is the recommended OAuth 2.0 flow for public clients
4. **Defense in Depth**: Server-side validation before session creation
5. **Open Redirect Protection**: Both client and server validate redirect URLs

## References

- [Supabase Auth with PKCE](https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr)
- [OAuth 2.0 PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
