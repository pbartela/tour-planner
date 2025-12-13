# Tour Planner

[![Project Status: Complete](https://img.shields.io/badge/status-complete-brightgreen.svg)](https://github.com/turu/tour-planner)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](https://github.com/turu/tour-planner)

A comprehensive web application for simplifying the process of planning group trips and excursions. This project serves as a final university project demonstrating modern full-stack web development practices.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Screenshots](#screenshots)
- [Installation & Configuration](#installation--configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Usage Guide](#usage-guide)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [For Evaluators](#for-evaluators)
- [Troubleshooting](#troubleshooting)
- [Additional Documentation](#additional-documentation)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [License](#license)

## Project Description

**Tour Planner** is a web tool designed to solve the common problems associated with organizing group trips and excursions. The application centralizes communication and organization, eliminating the chaos of using multiple channels like chats, emails, or social media.

### Problem Statement

Organizing trips in a group of friends is often chaotic, inefficient, and leads to frustration. The key problems this application solves are:

- **Scattered Communication**: Agreements on destination, dates, and itinerary get lost in a flood of messages across various platforms
- **Lack of Centralized Information**: Important details like addresses, dates, or links are hard to find
- **Difficulty in Decision-Making**: Gathering final declarations of participation and jointly approving the plan is complicated and time-consuming
- **Misunderstandings and Conflicts**: Lack of transparency in planning can lead to unnecessary tension within the group

### Solution Overview

The application provides a single, dedicated place for efficient and enjoyable organization of joint trips. Users can:

- Create trip proposals with all essential details (title, destination, dates, description)
- Invite friends via email to join the planning process
- Discuss plans through a chronological comment system
- Vote on trips using a "like" system to confirm participation
- Automatically archive completed trips for future reference
- Search archived trips using tags for easy categorization

### Key Features

- ✅ **Tour Management**: Create, edit, and delete tours with full CRUD operations
- ✅ **Passwordless Authentication**: Magic link authentication via email (no passwords required)
- ✅ **User Profiles**: Customizable display names, language preferences, and theme settings
- ✅ **Participant Management**: Invite participants via email, remove participants, and manage permissions
- ✅ **Voting System**: Like-based voting with owner controls (lock/unlock voting)
- ✅ **Comments**: Full comment system with edit and delete functionality
- ✅ **Automatic Archiving**: Tours automatically archive after their end date
- ✅ **Tagging System**: Add tags to archived tours for categorization and search
- ✅ **Internationalization**: Support for multiple languages (English, Polish)
- ✅ **Dark Mode**: Theme switching with 30+ DaisyUI themes
- ✅ **Responsive Design**: Fully responsive for mobile and desktop devices
- ✅ **Activity Indicators**: Visual indicators for new activity on tours
- ✅ **Onboarding**: Guided 3-step onboarding for new users

## Tech Stack

The project is built with a modern, production-ready tech stack focusing on performance, developer experience, and scalability.

### Frontend

- **[Astro 5](https://astro.build/)** - Modern web framework for building fast, content-focused websites with minimal JavaScript
- **[React 19](https://react.dev/)** - Library for building interactive user interfaces
- **[TypeScript 5](https://www.typescriptlang.org/)** - Static typing for improved code quality and developer experience
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework for rapid UI development
- **[DaisyUI 5](https://daisyui.com/)** - Component library built on Tailwind CSS
- **[Shadcn/ui](https://ui.shadcn.com/)** - Collection of accessible, customizable React components
- **[React Query (TanStack Query)](https://tanstack.com/query)** - Powerful data synchronization for React
- **[React Hook Form](https://react-hook-form.com/)** - Performant forms with easy validation
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation

### Backend

- **[Supabase](https://supabase.io/)** - Open-source Firebase alternative providing:
  - PostgreSQL database with Row-Level Security (RLS)
  - Built-in authentication (magic links, OTP)
  - Real-time subscriptions
  - RESTful API (PostgREST)
  - Database migrations and management

### Testing

- **[Vitest](https://vitest.dev/)** - Fast unit testing framework
- **[Playwright](https://playwright.dev/)** - End-to-end testing framework
- **[Testing Library](https://testing-library.com/)** - Simple and complete testing utilities
- **[Chromatic](https://www.chromatic.com/)** - Visual regression testing with Storybook

### Development Tools

- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Husky](https://typicode.github.io/husky/)** - Git hooks
- **[Storybook](https://storybook.js.org/)** - Component development and documentation

### CI/CD & Hosting

- **[GitHub Actions](https://github.com/features/actions)** - Continuous integration and deployment
- **[DigitalOcean](https://www.digitalocean.com/)** - Application hosting via Docker

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

### Required

- **Node.js 22.14.0** - It's recommended to use [nvm](https://github.com/nvm-sh/nvm) for version management:
  ```bash
  nvm use  # Uses .nvmrc automatically
  # Or manually:
  nvm install 22.14.0
  nvm use 22.14.0
  ```
- **npm** (comes with Node.js) or a compatible package manager (yarn, pnpm)
- **Docker Desktop** - Required for running Supabase locally
  - Download from [docker.com](https://www.docker.com/products/docker-desktop)
  - Ensure Docker is running before starting Supabase
- **Git** - For cloning the repository

### Optional but Recommended

- **VS Code** or your preferred code editor
- **Supabase CLI** (installed via npm when needed)

## Quick Start

For evaluators who want to get the application running quickly:

1. **Install prerequisites** (Node.js 22.14.0, Docker Desktop)
2. **Clone and install**:
   ```bash
   git clone https://github.com/turu/tour-planner.git
   cd tour-planner
   npm install
   ```
3. **Set up environment variables** (see [Installation & Configuration](#installation--configuration))
4. **Start Supabase**:
   ```bash
   npx supabase start
   ```
5. **Start the application**:
   ```bash
   npm run dev
   ```
6. **Open** `http://localhost:3000` in your browser

> ⚠️ **Note**: The `.env` file is git-ignored and must be created manually. See the [Installation & Configuration](#installation--configuration) section for details.

> 📧 **Important - Email Access**: All emails (magic links, invitations) are captured by **Mailpit** at `http://localhost:54324`. No external email service is configured by default. You must check Mailpit to receive authentication emails.

## Screenshots

| Tour List | Create Tour |
|-----------|-------------|
| ![Tour List](designs/main_page_-_trips_collection/screen.png) | ![Create Tour](designs/add_new_trip/screen.png) |

## Installation & Configuration

### Step 1: Clone the Repository

```bash
git clone https://github.com/turu/tour-planner.git
cd tour-planner
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all project dependencies including:
- Astro, React, TypeScript
- Supabase client libraries
- Testing frameworks (Vitest, Playwright)
- Development tools (ESLint, Prettier)

### Step 3: Set Up Environment Variables

Create a `.env` file in the root directory of the project. This file is git-ignored for security reasons.

**Required Environment Variables:**

```env
# Public variables (accessible on client)
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
PUBLIC_DEFAULT_LOCALE=en-US

# Server-only variables (never exposed to client)
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Optional Environment Variables:**

```env
# Email functionality (optional for local development)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@example.com

# AI functionality (optional)
OPENROUTER_API_KEY=your-openrouter-api-key
```

**Getting Supabase Credentials:**

After starting Supabase locally (see [Database Setup](#database-setup)), you can find the credentials:

1. Run `npx supabase status` to see all connection details
2. Or check the output of `npx supabase start` which displays:
   - API URL: `http://localhost:54321`
   - anon key: `eyJhbGci...` (JWT token)
   - service_role key: `eyJhbGci...` (JWT token)

**Example `.env` file for local development:**

```env
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
PUBLIC_DEFAULT_LOCALE=en-US
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

> ⚠️ **Important**: The example keys above are default Supabase local development keys. For production, always use secure, unique keys.

## Database Setup

This project uses Supabase (PostgreSQL) for the database. For local development, Supabase runs in Docker containers.

### Step 1: Start Supabase Locally

Ensure Docker Desktop is running, then:

```bash
npx supabase start
```

This command will:
- Download and start Docker containers for PostgreSQL, PostgREST, GoTrue (auth), and other Supabase services
- Apply all database migrations automatically
- Display connection details and credentials

**Expected output:**
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
      Mailpit URL: http://localhost:54324  <-- Check here for emails!
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGci...
service_role key: eyJhbGci...
```

### Step 2: Verify Database Setup

1. **Check Supabase status:**
   ```bash
   npx supabase status
   ```

2. **Access Supabase Studio** (Database GUI):
   - Open `http://localhost:54323` in your browser
   - This provides a visual interface to browse tables, run queries, and manage data

3. **Verify migrations:**
   - Migrations are automatically applied when you run `npx supabase start`
   - To manually apply migrations: `npx supabase migration up`
   - Migration files are located in `supabase/migrations/`

### Step 3: Generate TypeScript Types (Optional but Recommended)

After making schema changes, regenerate TypeScript types:

```bash
npx supabase gen types typescript --local > src/db/database.types.ts
```

### Supabase Local Services

When Supabase is running locally, the following services are available:

| Service | URL | Description |
|---------|-----|-------------|
| API | `http://localhost:54321` | PostgREST API endpoint |
| Database | `localhost:54322` | PostgreSQL database |
| Studio | `http://localhost:54323` | Supabase Studio (database GUI) |
| Mailpit | `http://localhost:54324` | Email testing server (view magic links, invitations) |

> 📧 **Email Testing with Mailpit**: All emails sent by the application (magic links, tour invitations) are captured by Mailpit. Open `http://localhost:54324` to view and interact with these emails. This is the **only way** to receive authentication emails in local development unless you configure an external SMTP provider.

### Stopping Supabase

To stop Supabase services:

```bash
npx supabase stop
```

To reset the database (removes all data):

```bash
npx supabase db reset
```

> ⚠️ **Warning**: `db reset` will delete all data. Use with caution.

## Running the Application

### Development Mode

Start the development server with hot-reloading:

```bash
npm run dev
```

The application will be available at:
- **URL**: `http://localhost:3000`
- **Port**: 3000 (configured in `astro.config.mjs`)

The development server includes:
- Hot module replacement (HMR) for instant updates
- Source maps for debugging
- TypeScript type checking
- ESLint integration

### Production Build

To build the application for production:

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

This serves the production build for testing before deployment.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot-reloading |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Lint the codebase for potential errors |
| `npm run lint:fix` | Lint and automatically fix issues |
| `npm run format` | Format code using Prettier |
| `npm run test` | Run all tests (unit + E2E) |
| `npm run test:unit` | Run unit tests with Vitest |
| `npm run test:unit:watch` | Run unit tests in watch mode |
| `npm run test:unit:coverage` | Run unit tests with coverage report |
| `npm run test:e2e` | Run end-to-end tests with Playwright |
| `npm run test:e2e:headed` | Run E2E tests with visible browser |
| `npm run test:e2e:ui` | Run E2E tests in interactive UI mode |
| `npm run storybook` | Start Storybook component development server |
| `npm run build-storybook` | Build Storybook for production |
| `npm run i18n:extract` | Extract translation keys from code |

## Usage Guide

This section provides a walkthrough of the main features for testing and evaluation.

### 1. Authentication (Magic Link)

> 📧 **Important**: In local development, all emails are sent to **Mailpit** at `http://localhost:54324`. You **must** check Mailpit to receive magic links - no emails are sent externally unless you configure SMTP.

1. **Navigate to the login page** (`/login` or `/register`)
2. **Enter your email address** in the form
3. **Click "Continue with Email"**
4. **Open Mailpit** at `http://localhost:54324`
5. **Find the email** with subject "Magic Link - Sign In"
6. **Click the magic link** in the email
7. **You'll be automatically logged in** and redirected to the dashboard

### 2. Creating a Tour

1. **Log in** to the application
2. **Click the "Create New Tour" button** (FAB button on the tour list page)
3. **Fill in the tour details**:
   - Title (e.g., "Summer Beach Trip")
   - Destination (e.g., "Hawaii" or a URL)
   - Description (optional)
   - Start date and end date
   - Participant limit (optional)
   - Like threshold (optional)
4. **Click "Create Tour"**
5. **You'll be redirected** to the tour details page

### 3. Inviting Participants

1. **Navigate to a tour** you own
2. **Click "Invite Participants"** button
3. **Enter email addresses** (comma-separated or one per line)
4. **Click "Send Invitations"**
5. **Invitations are sent via email** - check Mailpit at `http://localhost:54324`
6. **Participants can accept** the invitation by clicking the link in the email

### 4. Voting System

1. **Navigate to a tour** you're participating in
2. **Click the "Like" button** to vote for the tour
3. **Vote count updates** in real-time
4. **Click again** to remove your vote
5. **Tour owner can lock/unlock voting** using the toggle switch

### 5. Comments

1. **Navigate to a tour** details page
2. **Scroll to the comments section**
3. **Type a comment** in the input field
4. **Click "Post Comment"** or press Enter
5. **Edit your comment** by clicking the edit icon
6. **Delete your comment** by clicking the delete icon

### 6. Tour Archiving

1. **Tours automatically archive** after their end date passes
2. **Archived tours** appear in the "Archived" tab
3. **Archived tours are read-only** (cannot be edited or deleted)
4. **Tags can be added** to archived tours for categorization

### 7. Tagging Archived Tours

1. **Navigate to an archived tour**
2. **Scroll to the Tags section**
3. **Type a tag name** in the input field
4. **Select from autocomplete** or press Enter to create a new tag
5. **Tags are displayed as badges** below the input
6. **Click the X on a tag** to remove it

### 8. Searching Archived Tours

1. **Navigate to the tour list**
2. **Switch to the "Archived" tab**
3. **Use the tag filter** to search by tags
4. **Enter tag names** (comma-separated for multiple tags)
5. **Only tours with ALL specified tags** will be displayed (logical AND)

### 9. User Profile Management

1. **Click your profile** in the navigation
2. **View your profile** information
3. **Edit display name** and preferences
4. **Change language** (English/Polish)
5. **Switch theme** (light/dark/system)
6. **View active and archived tours**

## Testing

This project includes comprehensive testing with unit tests and end-to-end tests.

### Running Tests

#### All Tests

Run both unit and E2E tests:

```bash
npm run test
```

#### Unit Tests (Vitest)

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode (auto-rerun on changes)
npm run test:unit:watch

# Run tests with interactive UI
npm run test:unit:ui

# Run tests with coverage report
npm run test:unit:coverage
```

Coverage reports are generated in the `coverage/` directory. Open `coverage/index.html` in a browser to view the detailed report.

#### End-to-End Tests (Playwright)

**Prerequisites for E2E tests:**
- Supabase must be running locally (`npx supabase start`)
- Application must be running in test mode or use Docker setup

**Run E2E tests:**

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with visible browser
npm run test:e2e:headed

# Run tests in interactive UI mode
npm run test:e2e:ui

# Run smoke tests only
npm run test:e2e:smoke

# Run authentication tests only
npm run test:e2e:auth

# Debug tests with Playwright Inspector
npm run test:debug

# Show test report
npm run test:report
```

#### Docker Testing

For isolated testing environment:

```bash
# Build Docker images
npm run test:docker:build

# Run all E2E tests in Docker
npm run test:docker

# Run tests for specific browsers
npm run test:docker:chromium
npm run test:docker:firefox
npm run test:docker:webkit

# Run tests in interactive UI mode
npm run test:docker:ui

# Stop and remove containers
npm run test:docker:down
```

### Test Structure

```
tests/
├── e2e/                    # End-to-end tests (Playwright)
│   ├── auth/              # Authentication tests
│   ├── tours/             # Tour management tests
│   ├── i18n/              # Internationalization tests
│   ├── ui/                # UI and responsiveness tests
│   └── smoke.spec.ts      # Smoke tests
├── helpers/               # Test helper functions
│   └── auth.ts            # Authentication helpers
└── setup.ts               # Vitest setup

src/
├── lib/
│   ├── validators/        # Zod validators with tests
│   ├── utils/             # Helper functions with tests
│   ├── services/          # Business services with tests
│   └── hooks/             # React hooks with tests
```

### Test Coverage

The project maintains **100% test coverage** for critical paths including:
- Authentication flows
- Tour CRUD operations
- Comment system
- Voting system
- Invitation system
- Profile management

View detailed coverage reports by running `npm run test:unit:coverage` and opening `coverage/index.html`.

## Project Structure

```
tour-planner/
├── src/                          # Source code
│   ├── components/              # React and Astro components
│   │   ├── auth/                # Authentication components
│   │   ├── tours/               # Tour-related components
│   │   ├── profile/             # Profile management components
│   │   ├── invitations/         # Invitation components
│   │   ├── ui/                  # Reusable UI components (Shadcn/ui)
│   │   └── shared/              # Shared components
│   ├── layouts/                 # Astro layouts
│   │   ├── Layout.astro         # Main application layout
│   │   └── AuthLayout.astro      # Authentication pages layout
│   ├── pages/                   # Astro pages and API routes
│   │   ├── [...locale]/         # Localized pages
│   │   └── api/                 # API endpoints
│   │       ├── auth/            # Authentication endpoints
│   │       ├── tours/            # Tour management endpoints
│   │       ├── profiles/        # Profile endpoints
│   │       └── ...
│   ├── lib/                     # Business logic and utilities
│   │   ├── services/            # Service layer (business logic)
│   │   ├── hooks/               # React hooks
│   │   ├── validators/          # Zod validation schemas
│   │   ├── utils/               # Utility functions
│   │   ├── server/              # Server-side utilities
│   │   └── client/              # Client-side utilities
│   ├── db/                      # Database configuration
│   │   ├── database.types.ts    # Generated TypeScript types
│   │   ├── supabase.client.ts   # Supabase client
│   │   └── supabase.admin.client.ts  # Admin client
│   ├── middleware/              # Astro middleware
│   │   └── index.ts             # Session management
│   ├── types.ts                 # TypeScript type definitions
│   └── styles/                 # Global styles
│       └── global.css           # Tailwind CSS imports
├── supabase/                    # Supabase configuration
│   ├── migrations/              # Database migrations
│   │   ├── 20251014100000_initial_schema.sql
│   │   └── ...
│   ├── functions/               # Edge functions
│   ├── templates/               # Email templates
│   ├── config.toml              # Supabase local configuration
│   └── init-supabase.sh         # Database initialization script
├── tests/                       # Test files
│   ├── e2e/                     # End-to-end tests
│   ├── helpers/                 # Test helpers
│   └── setup.ts                 # Test setup
├── docs/                        # Additional documentation
│   ├── TESTING.md               # Testing documentation
│   ├── SECURITY.md              # Security documentation
│   ├── DOCKER_TESTING.md        # Docker testing guide
│   └── ...
├── public/                      # Static assets
│   ├── locales/                # Translation files
│   │   ├── en-US/              # English translations
│   │   └── pl-PL/              # Polish translations
│   └── favicon.png             # Favicon
├── .ai/                         # Project planning documents
│   ├── api-plan.md             # API specification
│   ├── db-plan.md              # Database schema
│   ├── prd.md                  # Product requirements
│   └── ...
├── astro.config.mjs             # Astro configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── playwright.config.ts        # Playwright configuration
├── vitest.config.ts            # Vitest configuration
└── README.md                   # This file
```

### Key Directories

- **`src/components/`**: All React and Astro components organized by feature
- **`src/pages/api/`**: REST API endpoints following RESTful conventions
- **`src/lib/services/`**: Business logic layer (separated from API routes)
- **`src/lib/hooks/`**: React hooks for data fetching and state management
- **`supabase/migrations/`**: Database schema migrations (versioned)
- **`tests/e2e/`**: End-to-end tests organized by feature area
- **`docs/`**: Comprehensive project documentation

## For Evaluators

This section provides a checklist for evaluating the project.

### Setup Verification

- [ ] Prerequisites installed (Node.js 22.14.0, Docker)
- [ ] Repository cloned successfully
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env` file created)
- [ ] Supabase started locally (`npx supabase start`)
- [ ] Application runs in development mode (`npm run dev`)
- [ ] Application accessible at `http://localhost:3000`

### Functionality Testing

- [ ] **Mailpit Access**: Can open Mailpit at `http://localhost:54324`
- [ ] **Authentication**: Magic link login/registration works (check Mailpit for email)
- [ ] **Tour Creation**: Can create a new tour with all required fields
- [ ] **Tour Editing**: Can edit tour details (as owner)
- [ ] **Tour Deletion**: Can delete tour with confirmation (as owner)
- [ ] **Invitations**: Can invite participants via email (check Mailpit)
- [ ] **Voting**: Can vote/unvote on tours
- [ ] **Voting Lock**: Owner can lock/unlock voting
- [ ] **Comments**: Can add, edit, and delete comments
- [ ] **Archiving**: Tours automatically archive after end date
- [ ] **Tagging**: Can add/remove tags on archived tours
- [ ] **Search**: Can search archived tours by tags
- [ ] **Profile**: Can view and edit user profile
- [ ] **Internationalization**: Language switching works (en/pl)
- [ ] **Theme**: Theme switching works (light/dark/system)

### Code Quality

- [ ] **Tests Pass**: All unit and E2E tests pass (`npm run test`)
- [ ] **Linting**: No linting errors (`npm run lint`)
- [ ] **Type Safety**: TypeScript compiles without errors
- [ ] **Code Structure**: Clean separation of concerns (components, services, API routes)

### Documentation

- [ ] README is comprehensive and clear
- [ ] Code is well-commented where necessary
- [ ] API documentation available (`.ai/api-plan.md`)
- [ ] Database schema documented (`.ai/db-plan.md`)

### Technical Excellence

- [ ] **Security**: Row-Level Security (RLS) policies in place
- [ ] **Error Handling**: Proper error handling throughout
- [ ] **Validation**: Input validation using Zod schemas
- [ ] **Performance**: Optimized queries and caching
- [ ] **Accessibility**: Accessible UI components
- [ ] **Responsive Design**: Works on mobile and desktop

## Troubleshooting

### Common Issues

#### Docker Not Running

**Problem**: `npx supabase start` fails with Docker errors.

**Solution**:
1. Ensure Docker Desktop is installed and running
2. Check Docker status: `docker ps`
3. Restart Docker Desktop if needed

#### Port Already in Use

**Problem**: Port 3000 or 54321 is already in use.

**Solution**:
1. Find the process using the port:
   ```bash
   # Linux/Mac
   lsof -i :3000
   # Windows
   netstat -ano | findstr :3000
   ```
2. Stop the process or change the port in `astro.config.mjs`

#### Environment Variables Not Loading

**Problem**: Application shows errors about missing environment variables.

**Solution**:
1. Verify `.env` file exists in the project root
2. Check that all required variables are set (see [Installation & Configuration](#installation--configuration))
3. Restart the development server after changing `.env`
4. Ensure `.env` file is in the root directory, not in `src/`

#### Supabase Connection Errors

**Problem**: Cannot connect to Supabase or database errors.

**Solution**:
1. Verify Supabase is running: `npx supabase status`
2. Check that credentials in `.env` match Supabase output
3. Restart Supabase: `npx supabase stop && npx supabase start`
4. Check Supabase logs for errors

#### Migration Errors

**Problem**: Database migrations fail to apply.

**Solution**:
1. Reset the database: `npx supabase db reset`
2. Check migration files in `supabase/migrations/` for syntax errors
3. Verify PostgreSQL is running in Docker

#### Tests Failing

**Problem**: Unit or E2E tests fail.

**Solution**:
1. Ensure Supabase is running for E2E tests
2. Check that test environment variables are set
3. Run tests individually to identify specific failures:
   ```bash
   npm run test:unit:watch  # For unit tests
   npm run test:e2e:headed  # For E2E tests with visible browser
   ```

#### Magic Links Not Working

**Problem**: Cannot receive or use magic links for authentication.

**Solution**:
1. **For local development, check Mailpit at `http://localhost:54324`** - this is where ALL emails are sent
2. Ensure Supabase auth service is running (`npx supabase status`)
3. Check that redirect URLs are configured in `supabase/config.toml`
4. Verify email templates exist in `supabase/templates/`
5. If Mailpit inbox is empty, try resending the magic link

### Getting Help

If you encounter issues not covered here:

1. Check the detailed documentation in the `docs/` folder
2. Review the project planning documents in `.ai/` folder
3. Check GitHub Issues (if repository is public)
4. Review Supabase logs: `npx supabase logs`

## Additional Documentation

This project includes comprehensive documentation:

- **[API Documentation](.ai/api-plan.md)**: Complete REST API specification
- **[Database Schema](.ai/db-plan.md)**: Database schema and RLS policies
- **[Testing Guide](docs/TESTING.md)**: Detailed testing documentation
- **[Security Documentation](docs/SECURITY.md)**: Security architecture and practices
- **[Docker Testing Guide](docs/DOCKER_TESTING.md)**: Docker-based testing setup
- **[Product Requirements](.ai/prd.md)**: Complete product requirements document
- **[Implementation Roadmap](.ai/implementation-roadmap.md)**: Feature implementation status
- **[Privacy Policy](docs/PRIVACY.md)**: Privacy documentation

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines, code standards, and how to submit changes.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

---

**Project Status**: ✅ Complete - All planned features implemented and tested.

**Last Updated**: 2025-01-04
