# Unified Magic Link: Login/Registration Implementation Plan

## 1. Objective

To refactor the existing authentication system into a single, unified flow where users can either sign in or register using the same form and a single API endpoint. This plan consolidates the logic, simplifies the user experience, and aligns with the specifications discussed.

## 2. File Manifest

### Files to be Created

-   `src/pages/api/auth/magic-link.ts`: The new, single endpoint for handling both login and registration.

### Files to be Modified

-   `src/components/auth/LoginForm.tsx`: To update the UI, text, and logic to call the new endpoint.
-   `src/middleware/index.ts`: To enforce profile completion for new users.
-   `src/lib/validators/auth.validators.ts`: To consolidate Zod validation for the magic link flow.
-   `src/lib/validators/profile.validators.ts`: To add a Zod schema for validating a completed user profile.
-   `src/pages/[...locale]/login.astro`: To simplify the page and remove the link to the old register page.
-   `public/locales/en-US/auth.json`: To add new i18n keys for the unified form.
-   `public/locales/pl-PL/auth.json`: To add new i18n keys for the unified form.
-   `src/types.ts`: To define a consistent `User` type for `Astro.locals`.
-   `.ai/api-plan.md`: To update the API documentation.
-   `.ai/auth-spec.md`: To update the technical specification.

### Files to be Deleted

-   `src/pages/api/auth/signin.ts`
-   `src/pages/api/auth/signup.ts`
-   `src/pages/[...locale]/register.astro`
-   `src/components/auth/RegisterForm.tsx`

## 3. Step-by-Step Implementation

### Step 1: Backend - Create Unified API Endpoint

1.  **Create `src/pages/api/auth/magic-link.ts`**.
2.  **Input Validation:** Use a Zod schema from `auth.validators.ts` to validate the incoming request body for a valid `email` and an optional, sanitized `redirectTo` string.
3.  **Rate Limiting:** Implement IP-based rate limiting to prevent abuse. Return a `429 Too Many Requests` error if the limit is exceeded.
4.  **User Detection:** Use the **Supabase Admin Client** (`createClient` with the service role key) to securely check if a user exists in `auth.users` with the provided email.
5.  **Conditional Logic:**
    *   **If User Exists (Sign-in):**
        *   Call `supabase.auth.signInWithOtp()`.
        *   Set the `emailRedirectTo` option to a sanitized absolute URL based on the `redirectTo` parameter from the client, defaulting to the homepage.
    *   **If User Does Not Exist (Sign-up):**
        *   Call `supabase.auth.signUp()`.
        *   Set the `emailRedirectTo` option to the absolute URL for `/register/complete`.
6.  **Error Handling:** Wrap the Supabase calls in a `try...catch` block. On failure, return a `500 Internal Server Error` with a generic JSON error message.
7.  **Success Response:** On success, return a `200 OK` response with an empty body.

### Step 2: Validation Schemas

1.  **In `src/lib/validators/auth.validators.ts`:**
    *   Remove the old schemas.
    *   Create a single `MagicLinkSchema` containing `z.string().email()`.
2.  **In `src/lib/validators/profile.validators.ts`:**
    *   Create a `CompletedProfileSchema` that validates `username` as `z.string().min(3).max(20)`. This will be used by the middleware.

### Step 3: Middleware - Enforce Profile Completion

1.  **Modify `src/middleware/index.ts`:**
2.  After retrieving the user session, check if `Astro.locals.user` exists.
3.  If the user exists, fetch their corresponding data from the `profiles` table.
4.  Use the `CompletedProfileSchema` to safely parse the fetched profile.
5.  **If parsing fails (i.e., `username` is `null` or invalid):**
    *   Check if the current request path is `/register/complete` or an essential API path.
    *   If it is not, perform a `return context.redirect("/register/complete")`.
6.  Define and use a consistent `User` type from `src/types.ts` for `Astro.locals.user`.

### Step 4: Frontend - Update `LoginForm.tsx`

1.  **Update UI Text:**
    *   Change the card title and description using new i18n keys (`magicLink.title`, `magicLink.description`).
    *   Change the button text to "Continue with Email" (`magicLink.submit`).
2.  **Update Form Logic:**
    *   Point the `fetch` request to the new `/api/auth/magic-link` endpoint.
    *   Pass the `email` and `redirectTo` props in the request body.
3.  **Add Loading State:**
    *   Use the `isSubmitting` state from `react-hook-form`.
    *   When `true`, disable the submit button and display a spinner/loader inside it. Use the `magicLink.submitting` key for the button text in this state.
4.  **Update Messaging:**
    *   On a successful API response, display the generic success message: "Check your email for a link to continue" (`magicLink.success`).

### Step 5: Internationalization (i18n)

1.  **Edit `public/locales/en-US/auth.json` and `pl-PL/auth.json`:**
2.  Remove the old `login` and `register` sections.
3.  Add the new `magicLink` section with keys: `title`, `description`, `emailLabel`, `emailPlaceholder`, `submit`, `submitting`, `success`, `error`.

### Step 6: Routing and Final Cleanup

1.  **Modify `src/pages/[...locale]/login.astro`:**
    *   Remove the `div` containing the link to the register page.
2.  **Delete Files:**
    *   Delete all files listed in the "Files to be Deleted" section of this plan. This is a critical step to prevent confusion and dead code.

## 4. Documentation Updates

-   **Update `.ai/api-plan.md`:** Replace the `/api/auth/signin` endpoint definition with the new `/api/auth/magic-link` endpoint, detailing its consolidated logic.
-   **Update `.ai/auth-spec.md`:**
    *   Rewrite the "Registration Flow" and "Login Flow" sections to describe the new, unified process.
    *   Update the component descriptions, removing `RegisterForm.tsx` and modifying `LoginForm.tsx`.
    *   Update the API endpoint list, replacing `/signin` and `/signup` with `/magic-link`.
