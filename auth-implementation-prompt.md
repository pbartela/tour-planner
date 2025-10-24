# Full-Stack Auth Generation & Integration Prompt

## Part 1: Project Context & Specifications

This section contains all the necessary planning documents for you to understand the project requirements.

### 1. Technology Stack
- Astro 5
- TypeScript 5
- React 19
- Tailwind 4
- Shadcn/ui
- daisyUI (Tailwind plugin)
- Supabase (PostgreSQL database, authentication, backend-as-a-service)
- OpenRouter.ai (AI API communication)

### 2. Product Requirements Document (PRD)
**Key Requirements:**
- Passwordless authentication using "magic links" sent to email
- Magic links valid for 15-20 minutes
- User profiles with display name, language, and theme preferences
- Onboarding process for new users
- Responsive design (RWD) for mobile and desktop

### 3. Authentication Specification
**Key Features:**
- Single unified flow for login and registration
- Magic link sent to email for both existing and new users
- Automatic user profile creation on first signup
- Middleware-based session management
- Redirect handling after authentication

### 4. API Plan
**Authentication Endpoints:**
- `POST /api/auth/magic-link` - Unified endpoint for login/registration
- `GET /api/profiles/me` - Get current user profile
- `PATCH /api/profiles/me` - Update user profile
- `POST /api/auth/signout` - Sign out user

### 5. UI/UX Plan
**Authentication Flow:**
- Single login form for both sign-in and sign-up
- Email input field with validation
- Loading states and success/error messages
- Conditional UI based on authentication state
- Header with login/logout functionality

## Part 2: Task Breakdown & Instructions

Based on the context provided above, execute the following steps:

### Step 1: Backend API Generation (Using Astro API Routes & Supabase)
Generate the necessary server-side API endpoints within an Astro project structure. The logic should primarily use the supabase-js library on the server to interact with Supabase Authentication.

#### Create the Magic Link Endpoint:
- **File:** `src/pages/api/auth/magic-link.ts`
- **Method:** POST
- **Functionality:** Accepts an email in the request body. Uses the Supabase Admin client to check if user exists, then calls appropriate sign-in or sign-up flow.
- **Security:** Perform email validation. Return clear success or error messages based on the API Plan.

#### Create the Session/User Endpoint:
- **File:** `src/pages/api/profiles/me.ts` (existing)
- **Method:** GET
- **Functionality:** Securely retrieves the current user's session and profile data. Returns user object if authenticated, null otherwise.

#### Create the Sign-Out Endpoint:
- **File:** `src/pages/api/auth/signout.ts`
- **Method:** POST
- **Functionality:** Signs the user out using the Supabase client and clears session cookies.

### Step 2: Frontend Integration (Using React Components in Astro)
Generate the client-side code needed to interact with the backend API and manage authentication state.

#### Create a Central Supabase Client:
- **File:** `src/db/supabase.client.ts` (existing)
- **Functionality:** Singleton instance of Supabase client for client-side use.

#### Update UI Components:
- **File:** `src/components/auth/LoginForm.tsx` (existing)
- **Updates:** Point to new `/api/auth/magic-link` endpoint, handle unified flow, show appropriate messages.

#### Update Page Layouts:
- **File:** `src/layouts/Layout.astro` (existing)
- **Updates:** Add header with conditional login/logout buttons based on user authentication state.

### Step 3: Middleware Updates
- **File:** `src/middleware/index.ts` (existing)
- **Updates:** Load complete user profile on each request, attach to `Astro.locals.user`, handle redirects for protected routes.

### Step 4: Type Definitions
- **File:** `src/types.ts` (existing)
- **Updates:** Define comprehensive `User` type including profile data.
- **File:** `src/env.d.ts` (existing)
- **Updates:** Add type declarations for `Astro.locals` properties.

### Step 5: Internationalization
- **Files:** `public/locales/en-US/auth.json`, `public/locales/pl-PL/auth.json`
- **Updates:** Update translation keys to support unified login/registration flow.

## Part 3: Output Requirements

Present the code in clean, well-commented blocks.
Clearly label each code block with its corresponding file path.
Provide a brief explanation for each major code file, describing its role and key logic.
Assume all necessary environment variables are available via `import.meta.env`.

## Key Technical Decisions

1. **Unified Authentication Flow:** Single endpoint and form for both login and registration
2. **Server-Side Session Management:** Middleware handles authentication state and redirects
3. **Type Safety:** Comprehensive TypeScript types for user data and API responses
4. **Security:** Supabase Admin client for secure user existence checks
5. **User Experience:** Seamless magic link flow with clear feedback messages
6. **Internationalization:** Support for multiple languages in auth flows
7. **Responsive Design:** Mobile-first approach with Tailwind CSS

## Implementation Notes

- Use Zod schemas for input validation
- Follow Supabase security best practices
- Implement proper error handling and user feedback
- Ensure middleware correctly handles protected vs public routes
- Test redirect logic to prevent infinite loops
- Handle edge cases like expired sessions and invalid tokens
