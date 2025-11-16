# Fix OTP Verification Error Redirects

## Problem Summary

Four E2E tests are failing because the OTP verification endpoint (`/auth/verify-invitation`) redirects to the login page (`/login`) instead of the appropriate error pages when encountering error conditions.

### Failing Tests:
1. **"should reject missing OTP parameter"** - Expected: `/en-US/auth/error?error=invalid_link`, Actual: `http://app.test:3000/login`
2. **"should reject non-existent OTP token"** - Expected: `/en-US/auth/error?error=invalid_link`, Actual: `http://app.test:3000/login`
3. **"should reject expired OTP token"** - Expected: `/en-US/auth/error?error=link_expired`, Actual: `http://app.test:3000/login`
4. **"should reject already-used OTP token"** - Expected: `/en-US/auth/error?error=link_used`, Actual: `http://app.test:3000/login`

## Root Cause Analysis

The issue is in `src/pages/auth/verify-invitation.astro`. While the code has proper error handling with `Astro.redirect()` calls to error pages, these redirects are being intercepted or overridden, causing users to be sent to the login page instead.

### Current Implementation

The file `src/pages/auth/verify-invitation.astro` (lines 1-190) contains error handling that should redirect to error pages:

- Line 30-32: Invalid OTP format → redirects to `/${locale}/auth/error?error=invalid_link`
- Line 63-65: OTP not found → redirects to `/${locale}/auth/error?error=invalid_link`
- Line 69-71: OTP expired → redirects to `/${locale}/auth/error?error=link_expired`
- Line 75-77: OTP already used → redirects to `/${locale}/auth/error?error=link_used`

### Suspected Issues

1. **CRITICAL: Route Structure Mismatch**: 
   - `verify-invitation.astro` is at `src/pages/auth/verify-invitation.astro` → accessible at `/auth/verify-invitation` (NO locale prefix)
   - `error.astro` is at `src/pages/[...locale]/auth/error.astro` → accessible at `/{locale}/auth/error` (REQUIRES locale prefix)
   - When verify-invitation redirects to `/${locale}/auth/error`, if the locale isn't properly determined or the route doesn't exist, the redirect might fail
   - Failed redirects might cause middleware to redirect to login as a fallback

2. **Middleware Interference**: The middleware (`src/middleware/index.ts`) might be intercepting redirects from error pages or catching failed redirects

3. **Redirect Execution**: Astro redirects might not be executing properly before middleware runs, or the redirect URL might be malformed

4. **Exception Handling**: Errors might be thrown before redirects can execute, causing fallback to login

## Technical Context

### File Structure
- **OTP Verification Endpoint**: `src/pages/auth/verify-invitation.astro`
- **Middleware**: `src/middleware/index.ts`
- **Error Page**: Should be at `src/pages/auth/error.astro` (verify this exists)
- **Test File**: `tests/e2e/auth/invitation-otp.spec.ts`

### Middleware Configuration
The middleware defines `publicAuthRoutes` including `/auth/verify-invitation` and `/auth/error` (line 14), so these routes should be accessible without authentication.

### Tech Stack
- Astro 5
- TypeScript 5
- Supabase for authentication
- Playwright for E2E tests

## Required Fix

### Primary Goal
Ensure that when the OTP verification endpoint encounters error conditions, it properly redirects to the error page with the correct error parameter, NOT to the login page.

### Specific Requirements

1. **Missing OTP Parameter**: When `otp` query parameter is missing or invalid format, redirect to `/${locale}/auth/error?error=invalid_link`

2. **Non-existent OTP**: When OTP token doesn't exist in database, redirect to `/${locale}/auth/error?error=invalid_link`

3. **Expired OTP**: When OTP has expired, redirect to `/${locale}/auth/error?error=link_expired`

4. **Used OTP**: When OTP has already been used, redirect to `/${locale}/auth/error?error=link_used`

### Implementation Approach

1. **Verify Error Page Exists**: Check if `src/pages/auth/error.astro` exists and is properly configured

2. **Fix Redirect Logic**: Ensure all error redirects in `verify-invitation.astro` use proper Astro redirect syntax:
   ```typescript
   return Astro.redirect(`/${locale}/auth/error?error=invalid_link`);
   ```

3. **Check Middleware**: Verify middleware isn't intercepting these redirects. The middleware should allow `/auth/error` to be accessed without authentication.

4. **Error Handling Order**: Ensure error checks happen BEFORE any authentication/session creation logic that might cause redirects to login.

5. **Early Returns**: Make sure all error conditions use `return` statements to prevent further execution.

### Code Pattern to Follow

The current code structure looks correct, but verify:
- All error conditions return immediately with `return Astro.redirect(...)`
- No code executes after error redirects
- The try-catch block properly handles exceptions
- Locale is correctly determined before redirects

### Testing

After fixing, run the E2E tests:
```bash
npm run test:e2e tests/e2e/auth/invitation-otp.spec.ts
```

All four failing tests should pass:
- `should reject missing OTP parameter`
- `should reject non-existent OTP token`
- `should reject expired OTP token`
- `should reject already-used OTP token`

## Additional Investigation Points

1. **Error Page Location**: The error page exists at `src/pages/[...locale]/auth/error.astro` (not `src/pages/auth/error.astro`). This means the route structure is `/{locale}/auth/error`, which matches the redirects in `verify-invitation.astro`.

2. **Error Code Mapping**: The error mapping service (`src/lib/server/error-mapping.service.ts`) supports:
   - `link_used` → maps to "alreadyUsed" (line 42)
   - `link_expired` → NOT explicitly supported, will fall through to default/generic
   - `invalid_link` → NOT explicitly supported, will fall through to default/generic
   
   Consider adding explicit cases for `link_expired` and `invalid_link` to the error mapping service.

3. **Route Structure**: The verify-invitation page is at `src/pages/auth/verify-invitation.astro` (no locale prefix), but redirects to `/${locale}/auth/error`. Verify this routing structure is correct.

4. **Middleware Execution**: The middleware runs on ALL requests. Check if it's intercepting the redirect response or if the redirect is happening but then middleware redirects again to login.

5. **Astro Redirect Behavior**: In Astro, `Astro.redirect()` should stop execution immediately. Verify that all error conditions properly return the redirect and no code executes after.

6. **Exception Handling**: The try-catch block (line 50-189) might be catching errors and redirecting to `unexpected_error`, but if an exception occurs before the redirect, it might not execute properly.

## Potential Solutions

### Solution 1: Fix Route Structure (Recommended)
Move `verify-invitation.astro` to match the error page structure:
- Move from: `src/pages/auth/verify-invitation.astro`
- Move to: `src/pages/[...locale]/auth/verify-invitation.astro`
- This ensures both pages use the same locale routing structure
- Update any references to the route in tests or other files

### Solution 2: Ensure Locale is Always Set
In `verify-invitation.astro`, ensure locale is always properly determined:
- Line 27 already gets locale from cookie or default
- Add validation to ensure locale is never null/undefined
- Consider using `ENV.PUBLIC_DEFAULT_LOCALE` as a fallback

### Solution 3: Add Error Code Mappings
Update `src/lib/server/error-mapping.service.ts` to explicitly handle:
- `link_expired` → add case for this error code
- `invalid_link` → add case for this error code (or map to `invalid_token`)

### Solution 4: Verify Middleware Doesn't Interfere
Ensure middleware allows error page redirects:
- The middleware already includes `/auth/error` in `publicAuthRoutes` (line 14)
- Verify the path matching logic works correctly with locale prefixes
- Check if middleware runs after redirects and interferes

### Solution 5: Debug Redirect Execution
Add logging to verify redirects are executing:
- Log before each `Astro.redirect()` call
- Verify redirects are being returned properly
- Check if exceptions are being caught before redirects execute

## Expected Outcome

After the fix:
- All error conditions in OTP verification should redirect to `/en-US/auth/error?error={appropriate_error_code}`
- No redirects to `/login` should occur for these error scenarios
- All four failing E2E tests should pass
- The error page should display appropriate error messages based on the `error` query parameter
- Error codes `link_expired` and `invalid_link` should be properly mapped in the error service

