<architecture_analysis>
### 1. Components List

Based on the `auth-spec.md`, the key UI elements for the authentication module are:

-   **Astro Pages**:
    -   `/login`: For existing users to sign in.
    -   `/register`: For new users to start registration.
    -   `/register/complete`: For new users to set their username after email verification.
    -   `/welcome`: Onboarding page for new users.
    -   `/` (index.astro): Landing page with conditional content for authenticated/unauthenticated users.
-   **React Components**:
    -   `LoginForm.tsx`: Handles the user login form.
    -   `RegisterForm.tsx`: Handles the initial user registration form (email only).
    -   `CompleteRegistrationForm.tsx`: Handles the final registration step (setting username).
    -   `LogoutButton.tsx`: A button for users to sign out.
-   **Astro Layouts**:
    -   `Layout.astro` (Modified): The main layout, which will conditionally render navigation based on auth state.
    -   `AuthLayout.astro` (New): A simpler layout for the auth-related pages (`/login`, `/register`).

### 2. Pages and Their Components

-   The `/login` page will use the `AuthLayout.astro` and render the `LoginForm.tsx` component.
-   The `/register` page will use the `AuthLayout.astro` and render the `RegisterForm.tsx` component.
-   The `/register/complete` page will use the `Layout.astro` (or another protected layout) and render the `CompleteRegistrationForm.tsx` component.
-   The main `Layout.astro` will contain the logic to display either Login/Register links or the `LogoutButton.tsx` within a user menu.
-   The `/welcome` page will use `Layout.astro` and display onboarding content.

### 3. Data Flow Between Components

-   **`RegisterForm.tsx`**: The user enters an email. On submission, the component calls the `POST /api/auth/signup` endpoint. It displays a success or error message.
-   **`LoginForm.tsx`**: The user enters an email. On submission, the component calls the `POST /api/auth/signin` endpoint and shows a success/error message.
-   **`CompleteRegistrationForm.tsx`**: The user enters a username. The component performs real-time validation by calling `GET /api/profiles/check-username`. On submission, it calls `PATCH /api/profiles/me`. On success, it triggers a redirect to `/welcome`.
-   **`Layout.astro`**: It reads the user's session status from `Astro.locals.user` (populated by the middleware) to decide which navigation elements to render.

### 4. Component Functionality

-   **`LoginForm.tsx`**: Captures the user's email and initiates the magic link login process.
-   **`RegisterForm.tsx`**: Captures the user's email to start the registration flow.
-   **`CompleteRegistrationForm.tsx`**: Allows a newly verified user to finalize their profile by choosing a unique username.
-   **`LogoutButton.tsx`**: Triggers a `POST` request to `/api/auth/signout` to terminate the user's session.
-   **`AuthLayout.astro`**: Provides a minimal, centered layout for displaying authentication forms.
-   **`Layout.astro`**: Acts as the main application shell, adapting its UI based on the user's authentication state.

</architecture_analysis>

<mermaid_diagram>
```mermaid
flowchart TD
    classDef astroPage fill:#FF5E00,stroke:#333,stroke-width:2px,color:#fff;
    classDef reactComp fill:#61DAFB,stroke:#333,stroke-width:2px,color:#000;
    classDef astroLayout fill:#BC00FF,stroke:#333,stroke-width:2px,color:#fff;
    classDef modified fill:#f96,stroke:#333,stroke-width:4px,color:#fff;

    subgraph "Architektura UI Autentykacji"
        direction TB

        subgraph "Layouts"
            L1["Layout.astro"]:::astroLayout:::modified
            L2["AuthLayout.astro"]:::astroLayout
        end

        subgraph "Strony Astro (.astro)"
            P1["/login"]:::astroPage
            P2["/register"]:::astroPage
            P3["/register/complete"]:::astroPage
            P4["/welcome"]:::astroPage
            P5["/"]:::astroPage:::modified
        end

        subgraph "Komponenty React (.tsx)"
            C1["LoginForm"]:::reactComp
            C2["RegisterForm"]:::reactComp
            C3["CompleteRegistrationForm"]:::reactComp
            C4["LogoutButton"]:::reactComp
        end

        subgraph "API Endpoints (Backend)"
            A1["POST /api/auth/signin"]
            A2["POST /api/auth/signup"]
            A3["POST /api/auth/signout"]
            A4["PATCH /api/profiles/me"]
            A5["GET /api/profiles/check-username"]
        end

        %% Relationships
        L2 -- "Używany przez" --> P1
        L2 -- "Używany przez" --> P2
        L1 -- "Używany przez" --> P3
        L1 -- "Używany przez" --> P4
        L1 -- "Używany przez" --> P5

        P1 -- "Renderuje" --> C1
        P2 -- "Renderuje" --> C2
        P3 -- "Renderuje" --> C3
        L1 -- "Warunkowo renderuje" --> C4

        C1 -- "Wywołuje" --> A1
        C2 -- "Wywołuje" --> A2
        C4 -- "Wywołuje" --> A3
        C3 -- "Wywołuje" --> A4
        C3 -- "Wywołuje (walidacja)" --> A5
    end
```
</mermaid_diagram>
