# Plan Tour

[![Project Status: Complete](https://img.shields.io/badge/status-complete-brightgreen.svg)](https://github.com/turu/tour-planner)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](https://github.com/turu/tour-planner)

A web application for simplifying the process of planning group trips and outings.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

**Plan Tour** is a web tool designed to simplify the planning of group trips and excursions. It allows users to create trip proposals, invite friends, and collectively discuss and decide on destinations and itineraries. The application centralizes communication and organization, eliminating the chaos of using multiple channels like chats, emails, or social media. The main goal is to provide a single, dedicated space for efficient and enjoyable organization of joint trips.

This project aims to solve common problems in group travel planning, such as:

- **Scattered Communication**: Important details get lost across various messaging apps.
- **Lack of Centralized Information**: Key information like addresses, dates, or links is hard to find.
- **Decision-Making Difficulties**: Gathering final commitments and approving a plan is complicated and time-consuming.
- **Misunderstandings and Conflicts**: A lack of transparency can lead to unnecessary tension within the group.

## Tech Stack

The project is built with a modern tech stack, focusing on performance, developer experience, and scalability.

- **Frontend**:
  - [Astro 5](https://astro.build/) - For building fast, content-focused websites.
  - [React 19](https://react.dev/) - For creating interactive UI components.
  - [TypeScript 5](https://www.typescriptlang.org/) - For static typing and improved code quality.
  - [Tailwind CSS 4](https://tailwindcss.com/) - A utility-first CSS framework for rapid UI development.
  - [Shadcn/ui](https://ui.shadcn.com/) - A collection of beautifully designed, accessible UI components.

- **Backend**:
  - [Supabase](https://supabase.io/) - An open-source Firebase alternative providing a PostgreSQL database, authentication, and a BaaS (Backend-as-a-Service) SDK.

- **CI/CD & Hosting**:
  - [GitHub Actions](https://github.com/features/actions) - For continuous integration and deployment pipelines.
  - [DigitalOcean](https://www.digitalocean.com/) - For hosting the application via a Docker image.

## Getting Started Locally

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js `22.14.0` (it's recommended to use [nvm](https://github.com/nvm-sh/nvm) - `nvm use`).
- npm or a compatible package manager.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/turu/tour-planner.git
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd tour-planner
    ```
3.  **Install dependencies:**
    ```sh
    npm install
    ```
4.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add your Supabase credentials. You can copy the example file if one is available.
    ```env
    PUBLIC_SUPABASE_URL="your-supabase-url"
    PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
    ```
5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Available Scripts

In the project directory, you can run the following scripts:

| Script             | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `npm run dev`      | Runs the app in development mode with hot-reloading. |
| `npm run build`    | Builds the app for production to the `dist/` folder. |
| `npm run preview`  | Serves the production build locally for preview.     |
| `npm run lint`     | Lints the codebase for potential errors.             |
| `npm run lint:fix` | Lints the codebase and automatically fixes issues.   |
| `npm run format`   | Formats the code using Prettier.                     |

## Project Scope

The initial version (MVP) of the application will focus on the core functionalities required for trip planning.

### Key Features

- **Trip Management**:
  - Create, edit, and delete trips with details like title, destination, dates, and description.
  - Trips are automatically archived and become read-only after their end date.
- **User Accounts**:
  - Passwordless authentication using "magic links" sent to the user's email.
  - User profiles with customizable display names, language, and theme preferences (light/dark mode).
- **Social & Voting System**:
  - Invite participants to a trip via email.
  - A "like" based voting system to confirm participation and approve trips.
  - A chronological comment section under each trip for discussions.
- **Permissions Management**:
  - The trip creator (owner) has full administrative rights over the trip.
  - Participants can comment, vote, and leave a trip at any time.
  - If an owner deletes their account, ownership is automatically transferred to another participant.
- **User Experience**:
  - Fully responsive design for both mobile and desktop.
  - Internationalization (i18n) support.
  - A simple onboarding process for new users.
  - Toast notifications for key actions like sending invitations or deleting comments.

### Out of Scope for MVP

To ensure a focused and streamlined initial release, the following features are intentionally excluded from the MVP:

- Adding intermediate points to a trip itinerary.
- Voting on individual comments.
- A global friends list feature.
- Public, shareable links for trip invitations.
- Advanced notification system (e.g., email/push notifications for all activities).
- Traditional login methods (username/password or social logins).

## Project Status

The project is **feature-complete** with 100% of planned User Stories implemented. All core MVP features and optional enhancements are fully functional, including:

- ✅ Complete authentication & onboarding system
- ✅ Full user account management (including account deletion)
- ✅ Comprehensive tour management & participant features
- ✅ Voting system with owner controls
- ✅ Comments with edit/delete functionality
- ✅ Automatic tour archiving with tag-based search
- ✅ Internationalization (en-US, pl-PL)
- ✅ Dark mode & responsive design
- ✅ Comprehensive test coverage (unit + E2E tests)

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
