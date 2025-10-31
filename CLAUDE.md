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
```

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
npx supabase db reset
```

Local Supabase runs on:
- API: `http://localhost:54321`
- Database: `localhost:54322`
- Studio: `http://localhost:54323`

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
```

### Key Architectural Patterns

#### 1. Service Layer Pattern
Business logic is extracted into services (`src/lib/services/`):
- `auth.service.ts` - Authentication logic
- `profile.service.ts` - User profile management
- `tour.service.ts` - Tour CRUD operations

Services receive a `SupabaseClient` instance and user ID, never import clients directly.

#### 2. API Route Pattern
All API routes (`src/pages/api/`) follow this structure:
```typescript
export const prerender = false;

export const GET: APIRoute = async ({ url, locals, request }) => {
  const { supabase } = locals;

  // 1. Validate session
  const user = await validateSession(supabase);
  if (!user) {
    return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "..." }}), { status: 401 });
  }

  // 2. Rate limiting
  const clientId = getClientIdentifier(request, user.id);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.API);

  // 3. Validate input with Zod
  const parsed = schema.safeParse(/* input */);
  if (!parsed.success) { /* return 400 */ }

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

### Database & Supabase
- All data access uses Row Level Security (RLS)
- Never bypass RLS in application code
- Use migrations for schema changes (`supabase/migrations/`)
- Generate types after schema changes: `npx supabase gen types typescript --local`
- Import `SupabaseClient` type from `@/db/supabase.client.ts`, not `@supabase/supabase-js`

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
- `OPENROUTER_API_KEY` - Optional AI API key

Environment validation happens at both:
1. Build time (Astro config: `astro.config.mjs`)
2. Runtime (Zod validation: `src/lib/server/env-validation.service.ts`)

## Testing & Quality

- Husky pre-commit hooks run `lint-staged`
- TypeScript in strict mode with all strict flags enabled
- Lint errors must be fixed before committing
- Use `npm run lint:fix` to auto-fix most issues

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

## Additional Notes

- Server runs on port **3000** (not 4321 in production mode)
- Project uses Node.js v22.14.0 (use `nvm use`)
- Docker required for local Supabase development
- Components reference available at `.cursor/rules/components/COMPONENTS_REFERENCE.md`
- Before creating new components, check if similar ones exist
