# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Plan Tour is a web application for simplifying group trip planning. Users can create trip proposals, invite participants via email, vote on trips, discuss via comments, and manage all aspects of group travel in one centralized location.

**Tech Stack:**

- Astro 5 (SSR mode with Node adapter)
- React 19 (for interactive components)
- TypeScript 5 (strict mode enabled)
- Tailwind CSS 4 + DaisyUI + Shadcn/ui
- Supabase (PostgreSQL, Auth, RLS)
- React Hook Form + Zod (validation)
- i18next (internationalization: en-US, pl-PL)

## Development Commands

### Essential Commands

```bash
# Development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Linting
npm run lint          # Check for errors
npm run lint:fix      # Auto-fix errors

# Code formatting
npm run format        # Format with Prettier

# Storybook (component development)
npm run storybook     # Runs on port 6006
npm run build-storybook

# View static design files
npm run designs       # Serves designs/ on port 8080

# Testing
npm run test              # Run all tests (unit + E2E)
npm run test:unit         # Run unit tests with Vitest
npm run test:unit:watch   # Run unit tests in watch mode
npm run test:unit:ui      # Run unit tests with UI
npm run test:unit:coverage # Run unit tests with coverage
npm run test:e2e          # Run E2E tests with Playwright
npm run test:e2e:ui       # Run E2E tests in interactive UI mode
npm run test:e2e:smoke    # Run smoke tests only
npm run test:chromatic    # Run Chromatic visual regression tests

# Docker E2E Testing (recommended for full browser support)
npm run test:docker           # Run all E2E tests in Docker
npm run test:docker:build     # Build Docker containers
npm run test:docker:chromium  # Test only Chromium
npm run test:docker:firefox   # Test only Firefox
npm run test:docker:webkit    # Test only WebKit

# Test utilities
npm run test:debug    # Debug E2E tests with Playwright Inspector
npm run test:report   # Show HTML test report
```

**Note:** A `.env` file with valid Supabase credentials exists in the project root. Never ask about or check for the `.env` file - assume it exists and is properly configured.

### Supabase Local Development

```bash
# Start local Supabase (requires Docker)
npx supabase start

# Stop local Supabase
npx supabase stop

# Generate TypeScript types from database schema
npx supabase gen types typescript --local > src/db/database.types.ts

# Create a new migration
npx supabase migration new <migration_name> 

# Apply migrations
npx supabase migration up 

# Reset local database
npx supabase db reset -- this command should be done by user unless you need logs from it. When needed ask user to do it and wait for confirmation that it is done.
```

Local Supabase runs on:

- API: `http://localhost:54321`
- Database: `localhost:54322`
- Studio: `http://localhost:54323`

**Important: Database Migration Strategy**

This project does **not** have a production database. Therefore:
- It's acceptable to edit existing migrations in `supabase/migrations/` directly
- No need to create separate "fix" migrations for schema changes
- When making schema changes, edit the original migration file and run `npx supabase db reset`
- This approach keeps migration history clean and simple for local-only development

### Docker Testing

The project includes Docker Compose setup for running E2E tests in isolated containers:

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

**Docker Architecture:**
- `app` service: Astro dev server (fixed IP: 172.20.0.2, hostname: app.test)
- `playwright` service: Playwright test runner with all browsers
- Shared `test-network` with fixed subnet for consistent networking
- Uses domain-like hostname (`app.test`) instead of single-word hostname to avoid Chromium ERR_SSL_PROTOCOL_ERROR

**Important Notes:**
- The `.env` file with valid Supabase credentials exists in the project root
- Never ask about or check for the `.env` file - assume it exists and is properly configured
- Tests run with `CI=true` for consistent behavior
- App container uses healthcheck to ensure it's ready before tests start

## Architecture & Project Structure

### Directory Layout

```
src/
├── components/          # Client-side components
│   ├── auth/           # Authentication-related components
│   ├── shared/         # Reusable shared components
│   ├── tours/          # Tour-specific components
│   └── ui/             # Shadcn/ui components
├── db/                 # Supabase clients and database types
├── layouts/            # Astro layout components
├── lib/                # Core business logic
│   ├── client/         # Client-side utilities
│   ├── constants/      # Shared constants
│   ├── hooks/          # React custom hooks
│   ├── server/         # Server-side services
│   ├── services/       # Business logic services
│   ├── utils/          # Utility functions
│   └── validators/     # Zod schemas
├── middleware/         # Astro middleware (auth, i18n, CSRF)
├── pages/              # Astro pages
│   ├── api/            # API endpoints
│   └── [...locale]/    # Localized routes
├── styles/             # Global styles
└── types.ts            # Shared types (DTOs, Commands)

tests/
├── e2e/                # End-to-End tests (Playwright)
│   ├── auth/           # Authentication tests
│   ├── tours/          # Tour management tests
│   ├── i18n/           # Internationalization tests
│   ├── ui/             # UI and responsiveness tests
│   └── smoke.spec.ts   # Smoke tests
└── helpers/            # Test helper functions
```

### Key Architectural Patterns

#### 1. Service Layer Pattern

Business logic is extracted into services (`src/lib/services/`):

- `auth.service.ts` - Authentication logic
- `profile.service.ts` - User profile management (including account deletion)
- `tour.service.ts` - Tour CRUD operations

Services receive a `SupabaseClient` instance and user ID, never import clients directly.

**Account Deletion:**
The `profile.service.ts` includes a `deleteAccount()` method that handles complete account deletion:
- Deletes user avatar from storage (with graceful failure handling)
- Deletes tour_activity records
- Deletes auth.users record (triggers `handle_user_deletion` database function)
- Automatic tour ownership transfer via database trigger
- Comment anonymization (via cascade to special user `00000000-0000-0000-0000-000000000000`)
- Cascade deletes: participants, votes, invitations

#### 2. API Route Pattern

All API routes (`src/pages/api/`) follow this structure:

```typescript
export const prerender = false;

export const GET: APIRoute = async ({ url, locals, request }) => {
  const { supabase } = locals;

  // 1. Validate session
  const user = await validateSession(supabase);
  if (!user) {
    return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "..." } }), { status: 401 });
  }

  // 2. Rate limiting
  const clientId = getClientIdentifier(request, user.id);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.API);

  // 3. Validate input with Zod
  const parsed = schema.safeParse(/* input */);
  if (!parsed.success) {
    /* return 400 */
  }

  // 4. Call service layer
  const result = await service.method(supabase, user.id, parsed.data);

  // 5. Return standardized response
  return new Response(JSON.stringify(result), { status: 200 });
};
```

Use **uppercase** HTTP method names: `GET`, `POST`, `PATCH`, `DELETE`.

#### 3. Type Safety with DTOs and Commands

All API contracts are defined in `src/types.ts`:

- **DTOs** (Data Transfer Objects): Response shapes (e.g., `ProfileDto`, `TourDetailsDto`)
- **Commands**: Request payloads (e.g., `CreateTourCommand`, `UpdateProfileCommand`)
- Derived from `database.types.ts` (generated from Supabase schema)

#### 4. Supabase Client Management

Two types of clients:

- **Browser Client** (`supabaseBrowserClient`): Singleton for client-side components
- **Server Client** (`createSupabaseServerClient`): Request-scoped, created per request

**IMPORTANT**: In Astro routes and API endpoints, always use `context.locals.supabase`, never import clients directly.

#### 5. Security Services (`src/lib/server/`)

- `session-validation.service.ts` - Validates user sessions securely
- `csrf.service.ts` - CSRF token generation and validation
- `rate-limit.service.ts` - In-memory rate limiting
- `logger.service.ts` - Secure error logging (redacts sensitive data)
- `env-validation.service.ts` - Runtime environment validation
- `email.service.ts` - Custom email service using Resend with React Email templates
- `email-dev.middleware.ts` - Development email routing to local Inbucket SMTP

#### 6. Middleware Flow (`src/middleware/index.ts`)

For every request:

1. Create Supabase server client
2. Determine locale from URL (`en-US` or `pl-PL`)
3. Set i18next language for SSR
4. Generate/validate CSRF tokens for API routes
5. Validate user session
6. Redirect logic for protected/auth routes

#### 7. Error Handling Pattern

```typescript
// Early returns for errors (guard clauses)
if (!valid) {
  return errorResponse();
}

// Secure logging (never log user data or tokens)
secureError("Context about error", error);

// Standardized error responses
return new Response(
  JSON.stringify({
    error: {
      code: "ERROR_CODE",
      message: "User-friendly message"
    }
  }),
  { status: 4xx }
);
```

## Important Coding Conventions

### Astro-Specific

- Use `export const prerender = false` for API routes and SSR pages
- Access env vars via `import.meta.env` or the validated `ENV` constant
- Use `Astro.cookies` for server-side cookie management
- Leverage View Transitions API for page navigation

### React Components

- Use functional components with hooks (no class components)
- **NEVER** use Next.js directives like `"use client"`
- Extract custom hooks to `src/lib/hooks/`
- Use `useTranslation()` from `react-i18next` for i18n
- Implement `React.memo()` for expensive components
- Use `useCallback` and `useMemo` appropriately

### Styling

- Use Tailwind utility classes (v4 syntax)
- DaisyUI components where appropriate
- Shadcn/ui components in `src/components/ui/`
- Implement dark mode with `dark:` variant
- Reference existing components before creating new ones

### Storybook (Component Documentation)

All reusable UI components should have corresponding `.stories.tsx` files:

**Structure:**

```typescript
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ComponentName } from "./ComponentName";

const meta: Meta<typeof ComponentName> = {
  title: "UI/ComponentName",
  component: ComponentName,
  tags: ["autodocs"],
  argTypes: {
    // Define controls for interactive props
    variant: {
      control: "select",
      options: ["option1", "option2"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

// Export named stories showing key use cases
export const Primary: Story = {
  render: () => <ComponentName variant="primary" />,
};
```

**Best Practices:**

- Keep stories concise - show only essential variations
- Avoid redundant examples that differ only in text or quantity
- Focus on demonstrating:
  - All visual variants (colors, sizes, states)
  - Key props combinations
  - Real-world usage context
- Use descriptive story names: `AllVariants`, `WithIcons`, `InContext`
- Group related components visually in single stories
- Include `tags: ["autodocs"]` for automatic prop documentation
- Use `argTypes` to make props interactive in Storybook UI

**Example - Good vs Bad:**

```typescript
// ❌ Bad - redundant stories
export const PrimaryButton: Story = { args: { variant: "primary" } };
export const SecondaryButton: Story = { args: { variant: "secondary" } };
export const AccentButton: Story = { args: { variant: "accent" } };

// ✅ Good - single comprehensive story
export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="accent">Accent</Button>
    </div>
  ),
};
```

### Database & Supabase

- All data access uses Row Level Security (RLS)
- Never bypass RLS in application code
- Use migrations for schema changes (`supabase/migrations/`)
- Generate types after schema changes: `npx supabase gen types typescript --local`
- Import `SupabaseClient` type from `@/db/supabase.client.ts`, not `@supabase/supabase-js`

### Email System

The project uses **Resend** with **React Email** templates for full control over email content.

**Architecture:**

- **Production**: Emails sent via Resend API to real addresses
- **Development**: Emails routed through local Mailpit/Inbucket SMTP (http://localhost:54324)
  - Uses nodemailer to connect to Mailpit SMTP on port 54325 (configured in `supabase/config.toml`)
  - All emails visible in Mailpit web interface for testing

**Email Service** (`src/lib/server/email.service.ts`):
- `sendInvitationEmail()` - Sends tour invitation emails
- `sendEmail()` - Generic email sending function for future use
- Automatically handles dev/prod routing

**Email Templates** (`src/lib/templates/`):
- Built with React Email components (`@react-email/components`)
- `email-layout.tsx` - Base layout for consistent styling
- `invitation-email.tsx` - Tour invitation template
- Styled with Tailwind CSS utilities
- See `src/lib/templates/README.md` for template development guide

**Development Workflow:**

1. Start local Supabase (includes Mailpit): `npx supabase start`
2. Mailpit web UI available at: http://localhost:54324
3. SMTP server running on: localhost:54325 (configured in `supabase/config.toml`)
4. Send test email → Check Mailpit for captured email
5. All emails logged to console in development

**Testing Email System:**

```bash
# Quick test with provided script
node test-email.mjs

# Then check Mailpit: http://localhost:54324
```

**Adding New Email Templates:**

```typescript
// 1. Create template: src/lib/templates/my-email.tsx
import { Text, Button } from "@react-email/components";
import { EmailLayout } from "./email-layout";

export function MyEmail({ userName }: { userName: string }) {
  return (
    <EmailLayout preview="Preview text" heading="Email Heading">
      <Text>Hello {userName}!</Text>
      <Button href="/action">Click Here</Button>
    </EmailLayout>
  );
}

// 2. Add sender function to email.service.ts
export async function sendMyEmail(to: string, userName: string) {
  const html = await render(MyEmail({ userName }));
  return sendEmail(to, "Subject", html);
}
```

**Environment Variables:**

- `RESEND_API_KEY` - Resend API key (get from https://resend.com/api-keys)
- `RESEND_FROM_EMAIL` - Sender email (e.g., "Tour Planner <noreply@example.com>")

### Validation

- All API inputs validated with Zod schemas (`src/lib/validators/`)
- Schemas colocated by feature: `auth.validators.ts`, `tour.validators.ts`, etc.

### Path Aliases

- `@/*` maps to `src/*` (configured in `tsconfig.json` and `astro.config.mjs`)

## Environment Variables

Required environment variables (see `.env.example`):

**Public (client-accessible):**

- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `PUBLIC_DEFAULT_LOCALE` - Default locale (e.g., `en-US`)

**Server-only (secret):**

- `SUPABASE_URL` - Same as public URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `SUPABASE_AUTH_URL` - Optional override for Supabase Auth URL (defaults to SUPABASE_URL/auth/v1)
- `RESEND_API_KEY` - Resend API key for email functionality (required)
- `RESEND_FROM_EMAIL` - Sender email address (e.g., "Tour Planner <noreply@example.com>")
- `OPENROUTER_API_KEY` - Optional AI API key for future features

**Testing (optional):**

- `TEST_ACCESS_TOKEN` - Supabase access token for authenticated E2E tests
- `TEST_REFRESH_TOKEN` - Supabase refresh token for authenticated E2E tests
- `TEST_DATABASE_URL` - Database connection string for E2E tests (defaults to local Supabase)

Environment validation happens at both:

1. Build time (Astro config: `astro.config.mjs`)
2. Runtime (Zod validation: `src/lib/server/env-validation.service.ts`)

## Testing & Quality

### Code Quality

- Husky pre-commit hooks run `lint-staged`
- TypeScript in strict mode with all strict flags enabled
- Lint errors must be fixed before committing
- Use `npm run lint:fix` to auto-fix most issues

### Testing Strategy

The project follows a comprehensive testing strategy defined in `.ai/@test-plan.mdc`:

**Unit Testing (Vitest):**

- Tests colocated with source files (`*.test.ts`)
- Run with `npm run test:unit` or `npm run test:unit:watch`
- Coverage: validators, utils, services, React hooks
- 70% coverage threshold (statements, branches, functions, lines)
- Fast feedback loop with watch mode
- See `TESTING.md` for detailed documentation

**E2E Testing (Playwright):**

- Tests located in `tests/e2e/`
- Run with `npm run test:e2e` or `npm run test:e2e:ui` (interactive mode)
- Covers: authentication, tours, i18n, responsiveness
- Smoke tests for critical paths: `npm run test:e2e:smoke`
- Configured for Chromium, Firefox, and WebKit
- See `TESTING.md` for detailed documentation

**Visual Regression (Chromatic):**

- Automatic visual testing for all Storybook components
- Run with `npm run test:chromatic`
- Requires Chromatic project token (see `docs/CHROMATIC_SETUP.md`)
- Integrated with GitHub Actions for PR checks

**CI/CD (GitHub Actions):**

- `.github/workflows/test.yml` runs on every push/PR
- Lint + TypeScript check
- Vitest unit tests with coverage
- Playwright E2E tests (multi-browser)
- Chromatic visual tests
- Smoke tests on main/develop branches

**Test Files:**

- Unit tests: `*.test.ts` or `*.test.tsx` colocated with source
- E2E tests: `*.spec.ts` in `tests/e2e/`
- Storybook stories: `*.stories.tsx` in component directories
- Test helpers: `tests/helpers/`
- Test setup: `tests/setup.ts`

For full testing documentation, see [TESTING.md](./TESTING.md)

## Authentication Flow

- Passwordless magic link authentication via Supabase Auth
- Users receive email with magic link → redirected to `/auth/confirm` → session created
- All protected routes require authentication (enforced in middleware)
- User object shape: `{ id, email, profile }`

## Internationalization

- Supported locales: `en-US`, `pl-PL`
- URL structure: `/:locale/path` (e.g., `/en-US/tours`, `/pl-PL/tours`)
- Translations in namespaces: `common`, `auth`, `tours`
- Use `react-i18next` in React components
- i18next configured for server-side rendering

### Translation Key Extraction

The project uses `i18next-parser` to automatically extract translation keys from code. Run:

- `npm run i18n:extract` - Extract keys and update translation files
- `npm run i18n:extract:dry` - Check what would change without updating
- `npm run i18n:check` - Verify translation coverage

**Dynamic Translation Keys:**

When using dynamic translation keys (e.g., `t(\`status.${value}\`)`), you **must** add extraction hints as comments, otherwise the keys will be removed by the extraction script:

```typescript
// ❌ Bad - keys will be removed by i18n:extract
<p>{t(`invitations.status.${status}`)}</p>

// ✅ Good - keys preserved with extraction hints
// Dynamic status translation keys (extracted by i18next-parser):
// t('invitations.status.pending'), t('invitations.status.accepted'), t('invitations.status.declined')

return (
  <p>{t(`invitations.status.${status}`)}</p>
);
```

**Pattern:**

1. Add a descriptive comment explaining the dynamic keys
2. Add commented `t()` calls with all possible key values on a single line
3. Use simple key paths (without namespace prefix) - the namespace is inferred from the component's `useTranslation()` call
4. Place the comment **before** the code block that uses the dynamic keys (e.g., before `return` statement or JSX block)
5. List all possible dynamic values that could be used

**Example in component:**

```typescript
export const InvitedUsersList = ({ invitations }: Props) => {
  const { t } = useTranslation("tours");

  // Dynamic status translation keys (extracted by i18next-parser):
  // t('invitations.status.pending'), t('invitations.status.accepted'), t('invitations.status.declined')

  return (
    <ul>
      {invitations.map((inv) => (
        <li key={inv.id}>
          {t(`invitations.status.${inv.status}`)}
        </li>
      ))}
    </ul>
  );
};
```

## Security & Privacy Documentation

Comprehensive security and privacy documentation is available in the `docs/` directory:

- **Security Guidelines**: `docs/SECURITY.md` - Rate limiting, CSRF protection, authentication, API security
- **Security Architecture**: `docs/SECURITY_ARCHITECTURE.md` - Technical security documentation, RLS policies, data access patterns, threat model
- **Privacy Policy**: `docs/PRIVACY.md` - Email visibility model, data retention, user control, design rationale

**Key Security Concepts:**

- **Email Visibility**: Emails are intentionally visible to tour co-participants for identity verification and transparency. See `docs/PRIVACY.md` for full explanation.
- **Row-Level Security (RLS)**: All database tables enforce RLS policies. See `docs/SECURITY_ARCHITECTURE.md` for policy details.
- **Rate Limiting**: All endpoints have rate limits. Development mode has relaxed limits (7-10x production). Use `TEST_MODE=true` for production-like testing.
- **Performance**: Email is denormalized to `profiles.email` (synced from `auth.users` via trigger) to eliminate N+1 queries.

## Additional Notes

- Server runs on port **3000** (not 4321 in production mode)
- Project uses Node.js v22.14.0 (use `nvm use`)
- Docker required for local Supabase development
- Components reference available at `.cursor/rules/components/COMPONENTS_REFERENCE.md`
- Before creating new components, check if similar ones exist
