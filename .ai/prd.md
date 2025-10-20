# Product Requirements Document (PRD) - Tour Planner

## 1. Product Overview

The "Tour Planner" application is a web tool designed to simplify the process of planning group trips and excursions. It allows users to create trip proposals, invite friends, discuss, and make decisions about the destination and itinerary. The application centralizes communication and organization, eliminating the chaos associated with using multiple communication channels like chats, emails, or social media. The main goal is to provide a single, dedicated place for efficient and enjoyable organization of joint trips.

## 2. User Problem

Organizing trips in a group of friends is often chaotic, inefficient, and leads to frustration. The key problems the application solves are:

- **Scattered communication:** Agreements on the destination, date, and itinerary get lost in a flood of messages on various platforms.
- **Lack of a central source of information:** Important details like addresses, dates, or links are hard to find.
- **Difficulty in decision-making:** Gathering final declarations of participation and jointly approving the plan is complicated and time-consuming.
- **Misunderstandings and conflicts:** Lack of transparency in planning can lead to unnecessary tension within the group.

## 3. Functional Requirements

### 3.1. Tour Management

- Users can create tours, providing a title, destination, start/end date, and description.
- The tour owner can edit all its details until its end date.
- The owner can delete a tour after a two-step confirmation (requiring typing the tour name).
- Tours are automatically archived after their end date and become read-only.
- Users can add tags to archived tours to facilitate later searching.

### 3.2. User Account System

- Registration and login are passwordless, using "magic links" sent to the user's email address. The links are valid for 15-20 minutes.
- Each user has a profile where they can edit their display name (a unique username or an optional first/last name) and preferences, such as application language and theme.
- The user's profile contains lists of their active and archived tours.

### 3.3. Social and Voting System

- The tour owner can invite participants by providing their email addresses.
- Participants can express their interest in a tour through a "like" voting system.
- The owner can define an optional "like" threshold, reaching which signifies the tour's acceptance.
- The owner has a tool to manually lock and unlock voting.
- Each tour has a chronological comments section. Users can only edit and delete their own comments.

### 3.4. Participant and Permission Management

- The tour owner has full permissions: editing and deleting the tour, inviting and removing participants, managing voting, and setting an optional participant limit.
- A participant can comment, vote, and leave the tour at any time.
- If the tour owner deletes their account, ownership of the tour is automatically transferred to the next person who joined the tour.

### 3.5. User Interface and User Experience (UI/UX)

- The application is fully responsive and adapted for mobile and desktop devices (RWD).
- The application supports themes (light/dark mode), with the option to change in the profile settings.
- The application has an internationalization (i18n) mechanism. The user selects a language upon registration and can change it later in their profile.
- A discreet indicator appears on the tour list to inform about new activity (e.g., a new comment). The indicator disappears after visiting the tour page.
- New users go through a simple, 3-step onboarding. The application correctly handles empty states (e.g., no tours).
- Key user actions (e.g., sending an invitation, deleting a comment) are confirmed by temporary messages (toast notifications).

## 4. Product Boundaries

The following functionalities are intentionally out of scope for the MVP (Minimum Viable Product) version to focus on the core product values:

- Adding intermediate points to the tour itinerary.
- A voting system (likes/dislikes) for individual comments or itinerary points.
- A global friends list on the user's account.
- Generating unique public links for inviting friends to a tour.
- An advanced notification system (email, push) for every activity.
- The ability for the tour owner to moderate other users' comments.
- Traditional login with a username and password or through third-party providers (e.g., Google, Facebook).

## 5. User Stories

### Authentication and Onboarding

- **ID:** US-001
- **Title:** New user registration via magic link
- **Description:** As a new user, I want to be able to register an account by providing my email and a unique username, so I can start planning tours.
- **Acceptance Criteria:**
  - After providing my email on the registration page, I receive a message with a magic link.
  - After clicking the link, I am taken to a registration completion page where I must provide a unique username (3-20 alphanumeric characters and underscores).
  - The system checks the uniqueness of the username in real-time.
  - After successful registration, I am logged in and see a welcome screen (onboarding).

- **ID:** US-002
- **Title:** Logging into the system
- **Description:** As a registered user, I want to be able to log into the application by providing my email, so I can access my tours.
- **Acceptance Criteria:**
  - After providing my registered email on the login page, I receive a message with a magic link.
  - The link is valid for 15-20 minutes.
  - After clicking a valid link, I am automatically logged in and redirected to my tour list.
  - Attempting to use an invalid or expired link results in an error message and a request to generate a new link.

- **ID:** US-003
- **Title:** New user onboarding
- **Description:** As a new user, after my first registration, I want to see a short guide to the application to quickly understand its basic functions.
- **Acceptance Criteria:**
  - Immediately after registration, a welcome screen with 3 simple informational steps is displayed.
  - The welcome screen has a clear Call to Action button encouraging the creation of a first tour.
  - The user can skip the onboarding.

### User Account Management

- **ID:** US-004
- **Title:** Viewing user profile
- **Description:** As a logged-in user, I want to have access to my profile page to see my details and tour lists.
- **Acceptance Criteria:**
  - There is a link to my profile in the application interface.
  - On the profile page, I see my display name and email address.
  - The profile page contains two separate lists: active and archived tours I am participating in.

- **ID:** US-005
- **Title:** Editing user profile
- **Description:** As a logged-in user, I want to be able to edit the details on my profile to update them.
- **Acceptance Criteria:**
  - There is an edit option on the profile page.
  - I can change my display name (choice between a unique username and an optional first/last name).
  - I cannot change my email address.
  - Changes are saved after clicking the "Save" button.

- **ID:** US-006
- **Title:** Changing application language
- **Description:** As a user, I want to be able to change the application's interface language in my profile settings to use it in my preferred language.
- **Acceptance Criteria:**
  - There is a dropdown list with available languages in the profile settings.
  - After selecting a new language and saving the changes, the entire application interface is displayed in that language.
  - The language choice is saved for my account.

- **ID:** US-007
- **Title:** Changing application theme (dark/light mode)
- **Description:** As a user, I want to be able to switch between a light and dark theme for the application to customize its appearance to my preferences.
- **Acceptance Criteria:**
  - There is a theme switch (light/dark) in the profile settings.
  - The theme change is immediate and applies to the entire application.
  - The theme choice is saved for my account on the given device/browser.

- **ID:** US-008
- **Title:** Deleting a user account
- **Description:** As a user, I want to have the option to permanently delete my account and all my data.
- **Acceptance Criteria:**
  - There is an option to delete the account in the profile settings.
  - The action requires a two-step confirmation (e.g., checkbox + "Delete" button, then entering a password or phrase).
  - After deleting the account, all my personal data is removed from the system.
  - If I am the owner of any tours, ownership is transferred to another participant.

### Tour Management

- **ID:** US-009
- **Title:** Creating a new tour
- **Description:** As a logged-in user, I want to be able to create a new tour by providing its key information so I can invite friends to it.
- **Acceptance Criteria:**
  - There is a "Create new tour" button on the tour list page.
  - The tour creation form requires a title, destination, start and end date, and a description.
  - I can optionally set a participant limit and a "like" threshold required for acceptance.
  - After successfully creating the tour, I become its owner and am redirected to its page.

- **ID:** US-010
- **Title:** Displaying the tour list
- **Description:** As a logged-in user, I want to see a list of all tours I am participating in, to have a quick overview of upcoming and past plans.
- **Acceptance Criteria:**
  - The default view after logging in is the list of active tours.
  - I can see basic information for each tour on the list: title, date.
  - A special indicator is visible for tours with new, unread activity.
  - If I am not participating in any tours, I see a friendly message and a button encouraging me to create my first one.

- **ID:** US-011
- **Title:** Displaying tour details
- **Description:** As a tour participant, I want to be able to see all its details on a dedicated page to have access to full information.
- **Acceptance Criteria:**
  - Clicking on a tour from the list takes me to its details page.
  - On the page, I can see the title, description, dates, participant list, and voting progress.
  - Below the details, there is a comments section.
  - Available actions (e.g., edit, invite) depend on my role (owner vs. participant).

- **ID:** US-012
- **Title:** Editing a tour by the owner
- **Description:** As the tour owner, I want to be able to edit its details to update the plan if needed.
- **Acceptance Criteria:**
  - On the page of a tour I own, I see an "Edit" button.
  - I can edit all fields: title, description, dates, participant limit, "like" threshold.
  - Editing is only possible until the tour's end date.
  - Other participants are informed of changes (e.g., through a new activity indicator).

- **ID:** US-013
- **Title:** Deleting a tour by the owner
- **Description:** As the tour owner, I want to be able to delete it if the plans are canceled.
- **Acceptance Criteria:**
  - On the page of a tour I own, I see a "Delete" option.
  - The deletion process requires a two-step confirmation, including typing the tour name.
  - After deletion, the tour is permanently removed from the system for all participants.

- **ID:** US-014
- **Title:** Leaving a tour by a participant
- **Description:** As a participant, I want to be able to leave a tour if I can no longer or do not want to participate.
- **Acceptance Criteria:**
  - On the page of a tour I am participating in (but do not own), I see a "Leave tour" button.
  - After confirmation, I am removed from the participant list and lose access to the tour details.

### Participants and Invitations

- **ID:** US-015
- **Title:** Inviting participants to a tour
- **Description:** As the tour owner, I want to be able to invite friends by providing their email addresses so they can join the planning.
- **Acceptance Criteria:**
  - There is an "Invite" option on the tour page.
  - I can paste one or more email addresses (e.g., separated by commas).
  - The system sends an email with an invitation and a magic link to each of the provided addresses.
  - An invitation is only sent to addresses that are not already tour participants.
  - The action is confirmed with a toast notification.

- **ID:** US-016
- **Title:** Removing participants from a tour by the owner
- **Description:** As the tour owner, I want to be able to remove a participant from the tour.
- **Acceptance Criteria:**
  - Next to each participant on the list (except me), there is a "Remove" option.
  - After confirmation, the selected user is removed from the participant list and loses access to the tour.

- **ID:** US-017
- **Title:** Accepting a tour invitation
- **Description:** As an invited person, I want to be able to easily join a tour after receiving an email.
- **Acceptance Criteria:**
  - I receive an email with invitation information and a magic link.
  - If I don't have an account, the link takes me through the registration process and then automatically adds me to the tour.
  - If I already have an account, the link logs me in, adds me to the tour, and then redirects me to its page.

### Voting and Interactions

- **ID:** US-018
- **Title:** Voting for a tour (Like)
- **Description:** As a tour participant, I want to be able to vote "like" to declare my intention to participate.
- **Acceptance Criteria:**
  - I see a "Like" button (or similar) on the tour page.
  - I can only cast one vote. Clicking it again revokes my vote.
  - The vote counter updates in real-time for all participants.
  - Voting is only possible if the owner has not locked this option.

- **ID:** US-019
- **Title:** Managing voting by the owner
- **Description:** As the tour owner, I want to be able to lock and unlock voting to close the list of attendees at the right moment.
- **Acceptance Criteria:**
  - On the page of a tour I own, there is a "Lock/Unlock Votes" switch.
  - When votes are locked, participants cannot vote or revoke their votes. They see an appropriate message.
  - The lock status is visible to all participants.

- **ID:** US-020
- **Title:** Adding a comment to a tour
- **Description:** As a tour participant, I want to be able to add comments to discuss plans with others.
- **Acceptance Criteria:**
  - Below the tour details, there is a field to type and send a comment.
  - After sending, my comment appears at the end of the comment list.
  - All participants can see my comment.
  - Adding a comment triggers a new activity indicator for other participants.

- **ID:** US-021
- **Title:** Editing my own comment
- **Description:** As the author of a comment, I want to be able to edit it to correct mistakes or update the content.
- **Acceptance Criteria:**
  - I see an "Edit" option next to my own comments.
  - After clicking, the comment content becomes editable.
  - After saving changes, the updated content is visible to everyone.
  - An "(edited)" tag may appear next to the edited comment.

- **ID:** US-022
- **Title:** Deleting my own comment
- **Description:** As the author of a comment, I want to be able to delete it.
- **Acceptance Criteria:**
  - I see a "Delete" option next to my own comments.
  - After confirmation, my comment is permanently removed from the discussion.

### Archive and Search

- **ID:** US-023
- **Title:** Automatic tour archiving
- **Description:** As a participant, I want completed tours to be automatically moved to the archive, so they don't clutter the list of active plans.
- **Acceptance Criteria:**
  - The day after its end date, a tour's status automatically changes to "archived".
  - An archived tour disappears from the active tours list and appears on the archived list.
  - All data of an archived tour (description, participants, comments) are available in read-only mode.

- **ID:** US-024
- **Title:** Adding tags to an archived tour
- **Description:** As a participant, I want to be able to add tags to archived tours to more easily categorize memories.
- **Acceptance Criteria:**
  - There is a field for adding tags on the archived tour page.
  - I can enter any tags (as free text, e.g., separated by commas).
  - The added tags are visible to all participants of that tour.

- **ID:** US-025
- **Title:** Searching archived tours by tags
- **Description:** As a user, I want to be able to search archived tours by tags to quickly find memories from a specific type of trip.
- **Acceptance Criteria:**
  - There is a search field on the archive page.
  - Entering a tag in the search field filters the tour list, showing only those that have the given tag.

### Edge Cases

- **ID:** US-026
- **Title:** Transfer of tour ownership after the owner's account is deleted
- **Description:** As a participant of an active tour, I want the tour to continue functioning even if its original owner deletes their account.
- **Acceptance Criteria:**
  - When the owner of an active tour deletes their account, the system automatically assigns ownership to a new person.
  - The new owner is the participant who joined the tour first after the founder.
  - All tour participants remain unchanged.
  - If the owner was the sole participant, the tour is deleted along with their account.

## 6. Success Metrics

The project's success will be measured based on the following key performance indicators (KPIs), which reflect user engagement and the achievement of the application's main goal.

- **Main Goal:** A successful trip planned using the application.

- **Measurable Indicators for MVP:**
  1.  **Activation:** The number of newly created tours in a given period (e.g., weekly/monthly). The goal is a steady increase in this indicator.
  2.  **Engagement:**
      - Average number of participants per tour.
      - Average number of comments per active tour.
