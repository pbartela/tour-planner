# Architecture Patterns

## Directory Structure

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

## Key Architectural Patterns

### 1. Service Layer Pattern

Business logic is extracted into services in `src/lib/services/`:

- `auth.service.ts` - Authentication logic
- `profile.service.ts` - User profile management
- `tour.service.ts` - Tour CRUD operations
- Services receive a `SupabaseClient` instance and user ID
- **Never import clients directly in services**

### 2. API Route Pattern

All API routes in `src/pages/api/` follow this structure:

1. Set `export const prerender = false`
2. Validate session
3. Apply rate limiting
4. Validate input with Zod
5. Call service layer
6. Return standardized response

```typescript
export const prerender = false;

export const POST: APIRoute = async ({ locals, request }) => {
  const { supabase } = locals;

  // 1. Validate session
  const user = await validateSession(supabase);
  if (!user) {
    return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "..." } }), { status: 401 });
  }

  // 2. Rate limiting
  const clientId = getClientIdentifier(request, user.id);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.API);

  // 3. Validate input
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    /* return 400 */
  }

  // 4. Call service
  const result = await service.method(supabase, user.id, parsed.data);

  // 5. Return response
  return new Response(JSON.stringify(result), { status: 200 });
};
```

### 3. Type Safety with DTOs and Commands

All API contracts defined in `src/types.ts`:

- **DTOs** (Data Transfer Objects): Response shapes
- **Commands**: Request payloads
- Derived from `database.types.ts` (generated from Supabase schema)

### 4. Supabase Client Management

Two types of clients:

- **Browser Client** (`supabaseBrowserClient`): Singleton for client-side
- **Server Client** (`createSupabaseServerClient`): Request-scoped

**IMPORTANT**: In Astro routes and API endpoints, always use `context.locals.supabase`

### 5. Security Services (`src/lib/server/`)

- `session-validation.service.ts` - Validates user sessions
- `csrf.service.ts` - CSRF protection
- `rate-limit.service.ts` - In-memory rate limiting
- `logger.service.ts` - Secure error logging
- `env-validation.service.ts` - Runtime environment validation

### 6. Middleware Flow (`src/middleware/index.ts`)

For every request:

1. Create Supabase server client
2. Determine locale from URL (en-US or pl-PL)
3. Set i18next language for SSR
4. Generate/validate CSRF tokens for API routes
5. Validate user session
6. Redirect logic for protected/auth routes

### 7. Component Organization

- Check `.cursor/rules/components/COMPONENTS_REFERENCE.md` before creating new components
- Use Astro components (.astro) for static content
- Use React components (.tsx) only when interactivity needed
- Extract reusable components to appropriate directories

### 8. Database & RLS

- All tables use Row Level Security (RLS)
- Never bypass RLS in application code
- Migrations in `supabase/migrations/`
- Generate types after schema changes

### 9. Styling Pattern

- Prefer DaisyUI component classes when available
- Use Tailwind utilities for custom styling
- Use semantic DaisyUI color names (primary, secondary, etc.)
- Implement dark mode with `dark:` variant
- Shadcn/ui components in `src/components/ui/`

### 10. Internationalization

- Supported locales: en-US, pl-PL
- URL structure: `/:locale/path`
- Translations in namespaces: common, auth, tours
- Use `react-i18next` in React components
- Server-side rendering configured
