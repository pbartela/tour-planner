# Authentication Module - Technical Specification

## 1. Introduction

This document outlines the technical architecture for the authentication module of the Tour Planner application. The implementation will be based on passwordless authentication using "magic links" sent to the user's email, as specified in user stories US-001 and US-002 of the Product Requirements Document. The architecture leverages Supabase Auth for the backend and integrates with the existing Astro and React frontend.

## 2. User Interface Architecture

### 2.1. Pages

-   **`/login` (New, Astro Page)**
    -   **Description:** A public page for existing users to sign in. It will contain the `LoginForm` component.
    -   **Behavior:** Users who are already logged in will be redirected to the homepage (`/`).

-   **`/register` (New, Astro Page)**
    -   **Description:** A public page for new users to start the account creation process. It will contain the `RegisterForm` component, which will only ask for an email address.
    -   **Behavior:** Users who are already logged in will be redirected to the homepage (`/`).

-   **`/register/complete` (New, Astro Page)**
    -   **Description:** The final step in the registration process, where the user sets their username after verifying their email by clicking the magic link.
    -   **Behavior:** This page is only for authenticated users who have not yet set a username. It will contain the `CompleteRegistrationForm` component.

-   **`/` (index.astro, Modified)**
    -   **Description:** The landing page of the application.
    -   **Behavior:**
        -   **Unauthenticated users:** Will see a welcome message and links to login or register.
        -   **Authenticated users:** Will be redirected to their tour dashboard.

-   **`/welcome` (New, Astro Page)**
    -   **Description:** An onboarding page for new users, displayed after successful registration and first login.
    -   **Behavior:** This page will display the 3-step onboarding process as described in US-003.

### 2.2. Components

-   **`LoginForm.tsx` (New, React Component)**
    -   **Location:** `src/components/auth/LoginForm.tsx`
    -   **Description:** A form with an email input field and a "Send Magic Link" button.
    -   **Responsibilities:**
        -   Manage form state (email value).
        -   Client-side validation for the email format.
        -   Display validation errors.
        -   On submit, call the `POST /api/auth/signin` endpoint.
        -   Display success (e.g., "Check your email for the login link.") or error messages from the API.

-   **`RegisterForm.tsx` (New, React Component)**
    -   **Location:** `src/components/auth/RegisterForm.tsx`
    -   **Description:** A form with an email input field and a "Continue" button.
    -   **Responsibilities:**
        -   Manage form state (email value).
        -   Client-side validation for the email format.
        -   Display validation errors.
        -   On submit, call the `POST /api/auth/signup` endpoint.
        -   Display a success message (e.g., "Check your email to continue registration.").

-   **`CompleteRegistrationForm.tsx` (New, React Component)**
    -   **Location:** `src/components/auth/CompleteRegistrationForm.tsx`
    -   **Description:** A form with a username input and a "Complete Registration" button. Displayed after a new user clicks their magic link.
    -   **Responsibilities:**
        -   Manage form state (username).
        -   Client-side validation for username format.
        -   Real-time username availability check by calling `GET /api/profiles/check-username` on input change (with debouncing).
        -   Display validation errors.
        -   On submit, call `PATCH /api/profiles/me` to set the username.
        -   On success, redirect to the `/welcome` onboarding page.

-   **`LogoutButton.tsx` (New, React Component)**
    -   **Location:** `src/components/auth/LogoutButton.tsx`
    -   **Description:** A button that, when clicked, logs the user out.
    -   **Responsibilities:**
        -   Will be a form that posts to a signout endpoint `POST /api/auth/signout`. Astro actions can be used here.

### 2.3. Layouts

-   **`Layout.astro` (Modified)**
    -   **Location:** `src/layouts/Layout.astro`
    -   **Description:** The main application layout.
    -   **Modifications:**
        -   It will check the authentication state from `Astro.locals.user`.
        -   The header/navigation bar will conditionally render:
            -   "Login" and "Register" links for unauthenticated users.
            -   A user dropdown menu with a link to the profile and the `LogoutButton` for authenticated users.

-   **`AuthLayout.astro` (New, Astro Layout)**
    -   **Location:** `src/layouts/AuthLayout.astro`
    -   **Description:** A simple layout for the `/login` and `/register` pages, likely just a centered container for the forms.

### 2.4. User Flows

#### 2.4.1. Registration Flow (US-001)

1.  User navigates to `/register`.
2.  User enters their email into the `RegisterForm`.
3.  User clicks "Continue".
4.  The frontend sends a request to `POST /api/auth/signup`.
5.  The backend validates the email and asks Supabase to send a confirmation magic link.
6.  The UI displays a message: "Please check your email to complete registration."
7.  User receives an email and clicks the magic link.
8.  Supabase authenticates the user and redirects them to a special callback URL that lands them on `/register/complete`.
9.  A new user record is created in `auth.users`, and a corresponding profile with a `NULL` username is created in the `profiles` table.
10. On the `/register/complete` page, the `CompleteRegistrationForm` is displayed.
11. User enters a unique username. The form provides real-time availability feedback.
12. User clicks "Complete Registration". The frontend sends a `PATCH /api/profiles/me` request.
13. The backend updates the user's profile with the new username.
14. The user is redirected to the `/welcome` onboarding page.

#### 2.4.2. Login Flow (US-002)

1.  User navigates to `/login`.
2.  User enters their registered email address.
3.  User clicks "Send Magic Link".
4.  The `LoginForm` component sends a request to `POST /api/auth/signin`.
5.  The UI displays a message: "Check your email for the login link."
6.  User receives an email and clicks the magic link.
7.  Supabase handles the authentication and redirects the user back to the application.
8.  The application establishes a session.
9.  The user is redirected to their tour dashboard (`/`).

#### 2.4.3. Invalid Link

1.  User clicks an expired or invalid magic link.
2.  The user is redirected to a page (e.g., `/auth/error`) that displays an error message.
3.  The page provides a link to `/login` to request a new link.

## 3. Backend Logic

### 3.1. API Endpoints

-   **`POST /api/auth/signin`**
    -   **Description:** Sends a magic link for logging in.
    -   **Request Body:** `{ "email": "user@example.com" }`
    -   **Validation:** `zod` schema to validate the email.
    -   **Logic:**
        1.  Calls `supabase.auth.signInWithOtp` with the provided email.
        2.  Redirect URL will be configured in Supabase dashboard to point to the app.
    -   **Response:**
        -   `200 OK`: On success.
        -   `400 Bad Request`: If email is invalid.
        -   `500 Internal Server Error`: For Supabase or other server errors.

-   **`POST /api/auth/signup`**
    -   **Description:** Initiates the registration process by sending a magic link to the user's email.
    -   **Request Body:** `{ "email": "user@example.com" }`
    -   **Validation:** `zod` schema for email format.
    -   **Logic:**
        1.  Calls `supabase.auth.signUp` with the provided email. The redirect URL will be configured in Supabase to point to `/register/complete`.
    -   **Response:**
        -   `200 OK`: On success.
        -   `400 Bad Request`: For invalid data.
        -   `500 Internal Server Error`: For server errors.

-   **`POST /api/auth/signout`**
    -   **Description:** Signs the user out.
    -   **Logic:**
        1.  Calls `supabase.auth.signOut`.
        2.  Clears the session cookie.
        3.  Redirects the user to the homepage (`/`).

-   **`GET /api/profiles/check-username`**
    -   **Description:** Checks if a username is already in use.
    -   **Query Parameter:** `?username=some_user`
    -   **Logic:**
        1.  Queries the `profiles` table.
        2.  Returns a boolean indicating availability.
    -   **Response:**
        -   `200 OK`: `{ "isUnique": true/false }`

-   **`PATCH /api/profiles/me` (New)**
    -   **Description:** Sets the username for the currently logged-in new user to complete their registration.
    -   **Request Body:** `{ "username": "new_user" }`
    -   **Validation:** `zod` schema for username format. Check for username uniqueness.
    -   **Logic:**
        1.  Get the user from `Astro.locals.user`.
        2.  Ensure the user does not already have a username set.
        3.  Update the corresponding row in the `profiles` table with the new username.
    -   **Response:**
        -   `200 OK`: On success.
        -   `400 Bad Request`: If data is invalid or user already has a username.
        -   `401 Unauthorized`: If user is not logged in.
        -   `409 Conflict`: If username is already taken.

### 3.2. Middleware

-   **File:** `src/middleware/index.ts`
-   **Description:** Middleware to run on every request to manage user sessions.
-   **Logic:**
    1.  On each request, create a server-side Supabase client with the request's cookies.
    2.  Use `supabase.auth.getSession()` to retrieve the current session.
    3.  If a session exists, fetch the user's profile from the `profiles` table.
    4.  Store session and user data in `Astro.locals` (e.g., `Astro.locals.session`, `Astro.locals.user`).
    5.  **Profile Completion Check:** If the user is authenticated but their profile has a `NULL` username, and they are not accessing `/register/complete` or an API endpoint, redirect them to `/register/complete`.
    6.  This makes user data available in all Astro pages and API endpoints.
    7.  It will also handle protected routes. If a user tries to access a protected page without being authenticated, they will be redirected to `/login`.
    8.  It will refresh the token if necessary.

### 3.3. Database

-   **Table: `profiles`**
    -   **Description:** Stores public user data.
    -   **Schema:**
        -   `id` (uuid, Primary Key, Foreign Key to `auth.users.id`)
        -   `username` (text, unique)
        -   `display_name` (text)
        -   `created_at` (timestamp with time zone)
    -   **Trigger:** A database trigger will be created. On a new user insertion into `auth.users`, a new row will be created in the `profiles` table. The `id` will be from `NEW.id`. The `username` will initially be `NULL`.

## 4. Authentication System Integration

### 4.1. Supabase Auth

-   We will use Supabase's built-in "magic link" (Email OTP) authentication.
-   The "Secure email change" setting in Supabase Auth will be enabled.
-   The Site URL and Redirect URLs in the Supabase dashboard will be configured to point to the deployed application's domain. The primary redirect URL will be the root of the application for logins. A separate redirect URL will be configured for sign-ups to point to `/api/auth/callback`, which will then redirect to `/register/complete`.

### 4.2. Astro Integration

-   We will use `@supabase/auth-helpers-astro` to simplify Supabase integration.
-   The middleware (`src/middleware/index.ts`) will be the central point for managing sessions on the server side, as recommended by the library.
-   Environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) will be securely stored and used to initialize the Supabase client.

### 4.3. Client-Side Interaction

-   React components will not interact with Supabase directly. They will make `fetch` requests to the application's own API endpoints (`/api/...`). This approach encapsulates the backend logic and provides a clear separation of concerns.
