# UI Architecture for Tour Planner

## 1. UI Structure Overview

The user interface will be a hybrid architecture using **Astro** for server-side rendering, static site generation, and page routing, complemented by interactive **React** components ("islands") for dynamic functionality. This approach ensures fast initial page loads and a rich, app-like user experience.

- **Styling**: The UI will use **Shadcn/ui** for accessible, unstyled component primitives, with **DaisyUI** and **Tailwind CSS** providing the visual theme and responsive, mobile-first styling.
- **State Management**: Global client-side state (e.g., user session, theme) will be managed by **Zustand**. Server state, including data fetching, caching, and mutations, will be handled by **React Query**.
- **Real-time Updates**: **Supabase Realtime** (WebSockets) will push live updates for votes and comments to the client, with a fallback to periodic polling via React Query if the connection fails.
- **Navigation**: Page transitions will be enhanced with **Astro's View Transitions API** for smoother navigation.
- **Internationalization**: The application will support multiple languages using the `astro-i18n` library.

## 2. View List

### 1. Login / Registration View

- **View Path**: `/auth/signin`
- **Main Purpose**: Provide a single entry point for new user registration and existing user login via the passwordless "magic link" system.
- **Key Information**:
  - Email input field.
  - Informational text explaining the magic link process.
  - Success message upon form submission, instructing the user to check their email.
- **Key View Components**:
  - `AuthForm` (React): A client-side component containing the email form, validation logic (`react-hook-form`, Zod), and submission handler.
- **UX, Accessibility, and Security**:
  - **UX**: A single field simplifies the login process, reducing friction. Clear feedback is provided after submission.
  - **Accessibility**: The form will have proper labels, focus states, and validation feedback for screen readers.
  - **Security**: No passwords are handled or stored by the application, enhancing security. The magic link serves as a time-sensitive, single-use token.

### 2. Onboarding View

- **View Path**: Rendered conditionally as a modal over the Tour List View (`/`) for first-time users.
- **Main Purpose**: Introduce new users to the core features of the application to facilitate quick adoption.
- **Key Information**:
  - A 3-step guided tour explaining key functionalities (e.g., creating tours, inviting friends, discussion).
  - A clear Call to Action (CTA) to create their first tour.
  - An option to skip the onboarding process.
- **Key View Components**:
  - `OnboardingModal` (React): A stateful, full-screen modal component that manages the step-by-step flow.
- **UX, Accessibility, and Security**:
  - **UX**: A guided, skippable tour helps users feel comfortable without being restrictive.
  - **Accessibility**: The modal will trap focus, be dismissible via the `Esc` key, and have `aria` attributes to describe its purpose.
  - **Security**: This view is purely informational and handles no sensitive data. Its visibility is controlled by the `onboarding_completed` flag from the user's profile.

### 3. Tour List View (Dashboard)

- **View Path**: `/`
- **Main Purpose**: Serve as the main dashboard, displaying all active tours a user is participating in and providing a starting point for creating new tours.
- **Key Information**:
  - Grid of `TourCard` components, each showing tour title, dates, and a visual indicator for new, unread activity.
  - A prominent "Create New Tour" button.
  - An empty state message with a CTA if the user has no active tours.
  - Skeleton loaders while the initial tour list is being fetched.
- **Key View Components**:
  - `TourList` (React): Fetches and displays the list of tours using React Query.
  - `TourCard` (Astro/React): Displays summary information for a single tour.
  - `SkeletonLoader` (Astro/React): Provides a loading state placeholder.
  - `EmptyState` (Astro/React): Component for when there is no data to show.
- **UX, Accessibility, and Security**:
  - **UX**: The mobile-first grid is responsive. Skeleton loaders and a clear empty state improve perceived performance and user guidance.
  - **Accessibility**: Tour cards are navigable links with descriptive `aria-label`s.
  - **Security**: Data is fetched server-side by Astro, ensuring that only tours the authenticated user is a member of are ever rendered.

### 4. Tour Details View

- **View Path**: `/tours/{tourId}`
- **Main Purpose**: Provide a comprehensive view of a single tour, acting as the central hub for collaboration, discussion, and management.
- **Key Information**:
  - **Tour Data**: Title, destination, description, dates.
  - **Participants**: List of all tour participants.
  - **Voting**: Vote count, "Like" button, and owner controls to lock/unlock voting.
  - **Comments**: A chronological list of comments with forms to add, edit, and delete.
  - **Owner Controls**: Buttons for editing tour details, inviting/removing participants, and deleting the tour.
- **Key View Components**:
  - `TourHero` (React): Displays primary tour info and fetches destination metadata for a background image.
  - `ParticipantList` (React): Displays participants and owner controls.
  - `VotingWidget` (React): Handles real-time vote casting and display.
  - `CommentsSection` (React): Manages fetching, displaying, and interacting with comments.
  - `EditTourModal`, `InviteModal`, `ConfirmDeleteModal` (React): Modals for owner actions.
- **UX, Accessibility, and Security**:
  - **UX**: Real-time updates for votes and comments create a dynamic experience. Complex actions are handled in modals to avoid clutter.
  - **Accessibility**: Interactive elements have clear focus states and ARIA roles.
  - **Security**: Astro will perform a server-side check to ensure the user is a participant before rendering the page. Owner-specific components are only rendered if the user's ID matches the tour's `owner_id`.

### 5. Profile View

- **View Path**: `/profile`
- **Main Purpose**: Allow users to view and manage their personal information, application settings, and see their tour history.
- **Key Information**:
  - User's display name and email.
  - Form to edit display name.
  - Settings for application language and theme (light/dark/system).
  - Separate lists for active and archived tours.
  - Option to delete the account.
- **Key View Components**:
  - `ProfileForm` (React): For updating user information.
  - `SettingsForm` (React): For managing language and theme.
  - `TourList` (React): Reused from the dashboard, configured to show active or archived tours.
  - `DeleteAccountModal` (React): A two-step confirmation modal for account deletion.
- **UX, Accessibility, and Security**:
  - **UX**: Settings changes (like theme) are applied instantly. Tour lists are separated for clarity.
  - **Accessibility**: All forms and controls will be fully accessible.
  - **Security**: Account deletion is a destructive action protected by a two-step confirmation to prevent accidental data loss.

### 6. Archived Tour List View

- **View Path**: `/archive`
- **Main Purpose**: Allow users to browse, search, and reminisce over past tours.
- **Key Information**:
  - List of all archived tours the user participated in.
  - Search bar to filter tours by tags.
  - Display of tags associated with each tour.
- **Key View Components**:
  - `SearchableTourList` (React): A variant of the `TourList` component with added search/filter functionality.
  - `Tag` (Astro/React): A component for displaying a single tag.
- **UX, Accessibility, and Security**:
  - **UX**: The search functionality makes it easy to find specific past trips.
  - **Accessibility**: The search input is properly labeled.
  - **Security**: As with other views, data is fetched server-side to ensure users only see archives they were part of.

## 3. User Journey Map

### Main Use Case: Creating and Planning a New Tour

1.  **Login**: A user (`Alex`) lands on the **Login View**, enters their email, and clicks a magic link in their inbox.
2.  **Dashboard**: Alex is redirected to the **Tour List View**. If new, they see the **Onboarding View** modal first, which they complete or skip. The view is empty, so they see a CTA.
3.  **Create Tour**: Alex clicks "Create New Tour," which opens a `CreateTourModal`. They fill in the details (title, destination, dates) and submit the form.
4.  **Redirect to Details**: Upon successful creation, the application navigates Alex to the **Tour Details View** for their new tour.
5.  **Invite Friends**: As the owner, Alex sees an "Invite" button. They click it, enter their friends' emails in the `InviteModal`, and send the invitations.
6.  **Discussion**: Invited friends join and begin discussing the trip in the `CommentsSection`. Alex receives real-time updates as new comments appear.
7.  **Voting**: Participants vote "Like" on the tour using the `VotingWidget`. The vote count updates in real-time for everyone.
8.  **Management**: Alex, as the owner, can lock voting or edit tour details as plans are finalized.
9.  **Archiving**: After the tour's end date passes, it automatically moves from the active **Tour List View** to the **Archived Tour List View**.

## 4. Layout and Navigation Structure

- **Main Layout (`Layout.astro`)**: A global Astro layout will wrap all pages. It will include:
  - **Header**: Contains the application logo, a navigation menu, and a profile dropdown.
  - **Navigation Menu**: Links to "Dashboard" (`/`), "Archive" (`/archive`).
  - **Profile Dropdown**: Links to "Profile" (`/profile`) and a "Logout" button.
  - **Main Content Area**: An area where the content for each specific view is rendered.
  - **Footer**: Contains secondary links (e.g., About, Terms of Service).
- **Conditional Rendering**: The header will display "Login" and "Register" links for unauthenticated users, and the navigation menu/profile dropdown for authenticated users. This logic will be handled server-side in the Astro layout.
- **Mobile Navigation**: On smaller screens, the main navigation will collapse into a hamburger menu.

## 5. Key Components

This is a list of key reusable React components that will form the core of the interactive UI.

- **`TourCard`**: A card component used in `TourList` to display a summary of a tour and link to its details page.
- **`Modal`**: A generic, accessible modal component (built with Shadcn/ui Dialog) used as a base for all pop-up forms and confirmations (`CreateTourModal`, `ConfirmDeleteModal`, etc.).
- **`Toast`**: A non-blocking notification component (from a library like `react-hot-toast`) to provide feedback for actions like "Invitation sent" or "Comment deleted."
- **`Button`**: A styled wrapper around the Shadcn/ui `Button` component, applying DaisyUI classes (`btn`, `btn-primary`, etc.) for consistent styling.
- **`Input`**: A styled form input component with integrated label and error message display, built for use with `react-hook-form`.
- **`EmptyState`**: A reusable component displayed when a list (e.g., tours, comments) is empty, typically containing a message and a relevant CTA.
- **`SkeletonLoader`**: A component displaying shimmering placeholder shapes that mimic the layout of the content being loaded, improving perceived performance.
