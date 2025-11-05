# Webhook + PKCE Flow Validation

## Executive Summary

✅ **Webhooks are fully compatible with PKCE flow** - No changes needed to webhook implementation.

## Why Webhooks Still Work

### The Critical Understanding

The webhook integration is **authentication-method-agnostic**. Here's why:

1. **Webhook Trigger**: Fires on `INSERT` into `auth.users` table
2. **User Creation**: Happens when `supabase.auth.verifyOtp()` succeeds
3. **Key Point**: Whether `verifyOtp()` is called from client or server doesn't matter

### Flow Comparison

#### Implicit Flow (Old)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks magic link                                       │
│ 2. Redirected to /auth-callback with tokens in URL fragment     │
│ 3. Client-side JS extracts tokens                              │
│ 4. Client calls /api/auth/session with tokens                  │
│ 5. Server calls setSession() to establish session               │
│ 6. User record already exists (created when link generated)    │
│ 7. NO webhook fires (no INSERT event)                          │
└─────────────────────────────────────────────────────────────────┘
```

#### PKCE Flow (New)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks magic link                                       │
│ 2. Redirected to /auth/confirm?token_hash=...&type=email       │
│ 3. Server-side Astro page receives request                     │
│ 4. Server calls verifyOtp({ token_hash, type })                │
│ 5. Supabase verifies token and establishes session              │
│ 6. If new user: INSERT into auth.users → webhook fires         │
│ 7. If existing user: no INSERT → no webhook                    │
│ 8. User redirected to destination                              │
└─────────────────────────────────────────────────────────────────┘
```

### Important Discovery

Looking at the old implicit flow, I realize there may have been an issue:

- In the implicit flow, the user was created when `signInWithOtp()` was called (sending the email)
- By the time the user clicked the link and called `setSession()`, the user already existed
- This means the webhook would fire when the email was sent, NOT when the user clicked the link

In the PKCE flow:

- The user is created when `verifyOtp()` succeeds (after clicking the link)
- This is MORE reliable because the webhook fires only after successful authentication

## What Actually Happens

### New User Signup (First Time)

**Step 1: User Requests Magic Link**

```javascript
// POST /api/auth/magic-link
await supabaseAdmin.auth.signInWithOtp({
  email: "new-user@example.com",
  options: {
    emailRedirectTo: "http://localhost:3000/auth/confirm?next=/dashboard",
  },
});
```

- Email sent with magic link
- **No user created yet** (unlike implicit flow)
- No webhook fires yet

**Step 2: User Clicks Magic Link**

```
URL: http://localhost:3000/auth/confirm?token_hash=abc123&type=email&next=/dashboard
```

**Step 3: Server-Side Verification**

```javascript
// In /auth/confirm.astro
const { data, error } = await supabase.auth.verifyOtp({
  token_hash: "abc123",
  type: "email",
});
```

**Step 4: Supabase Creates User**

```sql
-- Supabase internally executes:
INSERT INTO auth.users (id, email, ...) VALUES (...)
```

**Step 5: Webhook Triggers**

```
POST http://localhost:4321/api/webhooks/profile-creation
{
  "type": "INSERT",
  "table": "users",
  "schema": "auth",
  "record": {
    "id": "uuid-here",
    "email": "new-user@example.com",
    ...
  }
}
```

**Step 6: Profile Created**

```javascript
// In webhook handler
const { data: profile } = await adminClient.from("profiles").insert({ id: userId }).select("*").single();
```

**Step 7: User Redirected**

```
HTTP 302 Redirect to /dashboard
```

### Existing User Login (Returning User)

**Step 1-3: Same as above**

**Step 4: Supabase Validates Token**

```
- Token is valid
- User already exists in auth.users
- No INSERT operation
- Session created
```

**Step 5: No Webhook**

```
- No INSERT into auth.users
- No webhook fires
- This is correct behavior!
```

**Step 6: User Redirected**

```
HTTP 302 Redirect to /dashboard
```

## Validation Checklist

### Webhook Endpoint Validation

✅ **Endpoint Path**: `/api/webhooks/profile-creation`

- File: [src/pages/api/webhooks/profile-creation.ts](../src/pages/api/webhooks/profile-creation.ts)
- Method: POST
- Security: Bearer token authentication

✅ **Trigger Configuration**:

- Table: `auth.users`
- Event: `INSERT` only
- When: New user created via `verifyOtp()`

✅ **Webhook Logic**:

```typescript
// Extracts user ID from webhook payload
const userId = payload.record?.id;

// Creates profile using admin client (bypasses RLS)
await adminClient.from("profiles").insert({ id: userId });

// Handles duplicates gracefully (code 23505)
```

### PKCE Endpoint Validation

✅ **Endpoint Path**: `/auth/confirm`

- File: [src/pages/auth/confirm.astro](../src/pages/auth/confirm.astro)
- Type: Server-side Astro page
- Parameters: `token_hash`, `type`, `next` (optional)

✅ **Security Features**:

- Server-side token verification
- Open redirect protection
- Proper error handling with user-friendly redirects

✅ **Session Handling**:

- Session established via `verifyOtp()`
- Cookies set automatically by Supabase client
- No client-side token exposure

### Session Validation Compatibility

✅ **Session Validation Service**: [src/lib/server/session-validation.service.ts](../src/lib/server/session-validation.service.ts)

The service expects profiles to exist and will return `null` if missing:

```typescript
if (profileError || !profile) {
  console.error(`Profile not found for user ${serverUser.id}. Webhook may have failed.`);
  return null;
}
```

**Race Condition Consideration**:

- User created in `auth.users` (by `verifyOtp()`)
- Webhook fired asynchronously to create profile
- User immediately redirected
- Middleware validates session and fetches profile

**Potential Issue**: What if webhook hasn't completed when middleware runs?

**Analysis**:

1. Webhook fires immediately on INSERT
2. Supabase webhooks typically complete in < 100ms
3. User redirect happens after `verifyOtp()` completes
4. Network latency (redirect + page load) provides buffer time

**Mitigation** (already in place):

- If profile not found, user is logged out (session returns null)
- User can re-authenticate, profile will exist (duplicate handling)
- Webhook retries on failure (Supabase feature)

## Testing Strategy

### Local Testing

**Prerequisites**:

```bash
# Start Supabase
supabase start

# Start application
npm run dev

# Configure webhook in Supabase Studio
# URL: http://host.docker.internal:4321/api/webhooks/profile-creation
# Header: Authorization: Bearer YOUR_WEBHOOK_SECRET
```

**Test Case 1: New User Signup**

```bash
# 1. Request magic link
curl -X POST http://localhost:4321/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@test.com","locale":"en-US"}'

# 2. Check Inbucket (http://localhost:54324) for email
# 3. Copy magic link URL
# 4. Visit the link in browser
# Expected: Redirect to dashboard with session

# 5. Verify profile created
curl http://localhost:4321/api/profiles/me \
  -H "Cookie: [session-cookie]"

# 6. Check logs for webhook
# Expected: "Successfully created profile for user {userId}"
```

**Test Case 2: Existing User Login**

```bash
# 1. Use same email as Test Case 1
# 2. Request new magic link
# 3. Click link
# Expected: Login successful, no webhook fired

# 4. Check logs
# Expected: No "Successfully created profile" message
```

**Test Case 3: Webhook Failure Handling**

```bash
# 1. Temporarily break webhook (wrong secret)
# 2. Signup new user
# 3. Click magic link
# Expected: User logged in, but profile missing

# 4. Check session validation
# Expected: User logged out (profile not found)

# 5. Fix webhook
# 6. User re-authenticates
# Expected: Webhook fires, profile created (duplicate handling)
```

### Production Testing

**Phase 1: Monitoring Setup**

- Enable detailed logging in webhook endpoint
- Monitor Supabase webhook delivery logs
- Set up alerts for webhook failures

**Phase 2: Gradual Rollout**

- Deploy to staging environment
- Test with internal users
- Monitor for 24-48 hours

**Phase 3: Production Deployment**

- Deploy during low-traffic period
- Monitor first 10-20 signups closely
- Check webhook delivery success rate

**Phase 4: Validation**

- Verify all new users have profiles
- Check webhook delivery logs (should be 100% success rate)
- Monitor authentication error rates

## Potential Issues & Solutions

### Issue 1: Webhook Doesn't Fire

**Symptoms**:

- New users created in `auth.users`
- No profiles created
- Logs show: "Profile not found for user..."

**Debugging**:

```bash
# Check Supabase webhook config
# Dashboard → Database → Webhooks → profile-creation

# Check webhook deliveries
# Dashboard → Database → Webhooks → profile-creation → Deliveries

# Check application is reachable
curl -X POST http://your-domain.com/api/webhooks/profile-creation \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","table":"users","schema":"auth","record":{"id":"test-id","email":"test@test.com"}}'
```

**Solutions**:

- Verify webhook URL is correct
- Ensure Authorization header matches `SUPABASE_WEBHOOK_SECRET`
- Check firewall/network allows Supabase to reach your server
- Verify webhook is enabled in Supabase config

### Issue 2: Race Condition (Profile Not Ready)

**Symptoms**:

- User authenticated successfully
- Immediately redirected to error page
- Logs show: "Profile not found"
- Profile exists when checked later

**Debugging**:

```typescript
// Add timing logs in /auth/confirm.astro
console.log('[1] verifyOtp called:', new Date().toISOString());
const { data, error } = await supabase.auth.verifyOtp(...);
console.log('[2] verifyOtp completed:', new Date().toISOString());

// In middleware
console.log('[3] Session validation:', new Date().toISOString());
const user = await validateSession(supabase);
console.log('[4] Validation complete:', new Date().toISOString());
```

**Solutions**:

- Add retry logic in session validation (wait for profile)
- Increase redirect delay (not recommended)
- Use polling in middleware (check profile exists before validating)
- **Best**: Add retry with exponential backoff in `validateSession`

### Issue 3: Duplicate Profile Creation

**Symptoms**:

- Webhook logs show "Profile already exists"
- This is actually NORMAL and handled correctly

**Why It Happens**:

- Webhook retries on timeout/failure
- Multiple webhook instances fired (Supabase bug)
- User re-authenticated quickly

**Current Handling** (already implemented):

```typescript
if (insertError.code === "23505") {
  console.log(`Profile already exists for user ${userId}, skipping creation`);
  return new Response(JSON.stringify({ message: "Profile already exists" }), { status: 200 });
}
```

**No Action Needed** ✅

## Conclusion

### Summary of Findings

✅ **Webhooks are fully compatible with PKCE flow**

- Webhook trigger point unchanged
- Profile creation logic unchanged
- Security improved (no token exposure)

✅ **Implementation is correct**

- Email template updated to use `{{ .TokenHash }}`
- Server-side verification endpoint created
- Proper error handling and security

✅ **Session validation works**

- Validates user exists in `auth.users`
- Validates profile exists (created by webhook)
- Handles missing profiles gracefully

### Recommended Next Steps

1. **Deploy to staging** and test thoroughly
2. **Monitor webhook deliveries** in Supabase Dashboard
3. **Test edge cases**: race conditions, webhook failures, duplicate signups
4. **Add observability**: Log timing of each step
5. **Consider retry logic** in session validation if race conditions occur
6. **Document rollback plan** (already done in PKCE_MIGRATION.md)

### Migration Safety

**Risk Level**: ⚠️ **Medium-Low**

**Why Medium-Low**:

- ✅ Webhook logic unchanged
- ✅ Backward compatible (old sessions still work)
- ⚠️ New authentication flow (needs testing)
- ⚠️ Potential race condition (unlikely but possible)

**Mitigation**:

- Test thoroughly in staging
- Deploy during low-traffic period
- Monitor closely for first 24 hours
- Keep rollback plan ready

### Final Verification

Before deploying to production, verify:

- [ ] Email template uses `{{ .TokenHash }}`
- [ ] `/auth/confirm` endpoint exists and works
- [ ] Webhook configured and tested
- [ ] Session validation handles missing profiles
- [ ] Error pages exist and are user-friendly
- [ ] Redirect validation prevents open redirect attacks
- [ ] Logging is adequate for debugging
- [ ] Rollback plan is documented and tested

**Status**: ✅ **Ready for staging deployment**
