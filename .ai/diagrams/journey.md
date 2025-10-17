<user_journey_analysis>
### 1. User Paths

The documentation outlines two primary user paths for authentication, along with an onboarding path for new users.

-   **New User Registration Path**:
    1.  Starts as an unauthenticated user on the main page.
    2.  Navigates to the registration page.
    3.  Submits their email address.
    4.  Transitions to a state of waiting for email verification.
    5.  Clicks the magic link in their email.
    6.  Is redirected to the profile completion page.
    7.  Submits a unique username.
    8.  Is redirected to the welcome/onboarding page.
    9.  After onboarding, they are a fully authenticated and active user.

-   **Existing User Login Path**:
    1.  Starts as an unauthenticated user on the main page.
    2.  Navigates to the login page.
    3.  Submits their email address.
    4.  Transitions to a state of waiting for email verification.
    5.  Clicks the magic link in their email.
    6.  Is redirected to their dashboard as a fully authenticated user.

-   **Invalid Link Path**:
    1.  User clicks an expired or incorrect magic link.
    2.  They are taken to an error page.
    3.  From the error page, they can navigate back to the login page to start over.

### 2. Main Journeys and States

-   **Unauthenticated Journey**:
    -   **State**: `Not Logged In`. The user can browse public pages but cannot access protected content. They are presented with options to log in or register.
-   **Authentication Journey**:
    -   **State**: `Authentication Process`. This is a composite state that includes:
        -   `Login/Register Choice`: User decides whether to sign in or sign up.
        -   `Submitting Email`: User provides their email address.
        -   `Awaiting Email Verification`: The application has sent the magic link and is waiting for the user to act.
        -   `Verifying Link`: The user has clicked the link and the system is validating it.
-   **Profile Completion Journey (New Users)**:
    -   **State**: `Completing Profile`. The user has been authenticated but must provide a username to finish registration.
-   **Onboarding Journey (New Users)**:
    -   **State**: `Onboarding`. A guided tour for the new user after they've set their username.
-   **Authenticated Journey**:
    -   **State**: `Logged In`. The user has full access to the application's features, such as their tour dashboard.

### 3. Decision Points and Alternative Paths

-   **Initial Decision**: From the main page, the user can choose to go to `/login` or `/register`.
-   **Link Validity**: After the user clicks a magic link, the system checks if it's valid.
    -   If valid, the user proceeds.
    -   If invalid, the user is sent to an `Auth Error` state with an option to retry.
-   **User Type on Verification**: After a valid link is used, the system checks if the user has a username.
    -   If yes (existing user), they are logged in and sent to the dashboard.
    -   If no (new user), they are sent to the profile completion page.

### 4. Purpose of Each State

-   **Not Logged In**: To provide a public entry point and guide users toward authentication.
-   **Login/Register Pages**: To capture the user's email to initiate an authentication attempt.
-   **Awaiting Email Verification**: To clearly inform the user that the next step must happen in their email client, preventing confusion.
-   **Auth Error**: To handle invalid login attempts gracefully and provide a path to recovery.
-   **Completing Profile**: To ensure all new user accounts have a unique username as required.
-   **Onboarding**: To improve user retention and satisfaction by introducing them to key features.
-   **Logged In / Dashboard**: The target state, where users can engage with the core functionality of the application.

</user_journey_analysis>

<mermaid_diagram>
```mermaid
stateDiagram-v2
    [*] --> Niezalogowany

    state Niezalogowany {
        [*] --> StronaGłówna
        StronaGłówna --> Logowanie: Kliknij "Zaloguj się"
        StronaGłówna --> Rejestracja: Kliknij "Zarejestruj się"
    }

    state ProcesUwierzytelniania as "Proces Uwierzytelniania" {
        Logowanie --> OczekiwanieNaWeryfikacjeEmail: Podaj e-mail
        Rejestracja --> OczekiwanieNaWeryfikacjeEmail: Podaj e-mail

        OczekiwanieNaWeryfikacjeEmail --> WeryfikacjaTokena: Użytkownik klika magiczny link
        note right of OczekiwanieNaWeryfikacjeEmail
            System wysyła magiczny link na e-mail użytkownika.
            Użytkownik musi otworzyć swoją skrzynkę pocztową.
        end note

        state WeryfikacjaTokena <<choice>>
        WeryfikacjaTokena --> BładUwierzytelniania: Link niepoprawny
        WeryfikacjaTokena --> SprawdzenieProfiluUzytkownika: Link poprawny

        BładUwierzytelniania --> Logowanie: Spróbuj ponownie
    }

    state SprawdzenieProfiluUzytkownika <<choice>>
    SprawdzenieProfiluUzytkownika --> UzupełnianieProfilu: Nowy użytkownik (brak nazwy)
    SprawdzenieProfiluUzytkownika --> Zalogowany: Istniejący użytkownik

    state UzupełnianieProfilu {
        [*] --> FormularzNazwyUzytkownika
        FormularzNazwyUzytkownika --> Onboarding: Ustawiono nazwę użytkownika
    }

    state Onboarding {
        [*] --> Krok1
        Krok1 --> Krok2
        Krok2 --> Krok3
        Krok3 --> Zalogowany
    }


    state Zalogowany {
        [*] --> PulpitNawigacyjny
        PulpitNawigacyjny --> Niezalogowany: Wyloguj się
    }
```
</mermaid_diagram>
