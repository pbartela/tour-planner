# Tour Planner - Project Context

Use this as foundational context when working on the Tour Planner codebase.

## Tech Stack

- **Frontend Framework**: Astro 5 with React 19
- **Styling**: Tailwind CSS 4, DaisyUI 5, Shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage)
- **Language**: TypeScript 5
- **Database**: PostgreSQL (via Supabase)

## Project Structure

```
./src
├── layouts/           # Astro layouts
├── pages/            # Astro pages
│   └── api/          # API endpoints
├── middleware/       # Astro middleware (auth, etc.)
├── db/               # Supabase clients and types
├── types.ts          # Shared types (Entities, DTOs)
├── components/       # Client-side components
│   ├── auth/         # Authentication components
│   ├── tours/        # Tour-related components
│   ├── ui/           # Shadcn/ui components
│   └── hooks/        # Custom React hooks
├── lib/              # Services and helpers
│   └── services/     # Business logic services
├── assets/           # Static internal assets
└── public/           # Public assets

./supabase/
└── migrations/       # Database migration files
```

## Key Architectural Patterns

### Component Guidelines
- Use Astro components (.astro) for static content and layouts
- Use React components (.tsx) only when interactivity is needed
- Never use "use client" directives (Next.js specific)
- Check `.cursor/rules/components/COMPONENTS_REFERENCE.md` before creating new components

### API Routes
- Use POST, GET (uppercase) for endpoint handlers
- Set `export const prerender = false` for dynamic API routes
- Use Zod for input validation
- Extract business logic into services in `src/lib/services`
- Access Supabase via `context.locals.supabase` not direct imports

### Database
- Use Supabase for all backend services
- Create migrations in `supabase/migrations/` with format: `YYYYMMDDHHmmss_description.sql`
- Always enable Row Level Security (RLS) on new tables
- Use `SupabaseClient` type from `src/db/supabase.client.ts`

### Styling
- Prefer DaisyUI component classes when available
- Use Tailwind utilities for custom styling
- Use semantic DaisyUI color names (primary, secondary, etc.) not Tailwind colors
- Follow accessibility best practices (ARIA attributes, keyboard navigation)

### Error Handling
- Handle errors and edge cases at the beginning of functions
- Use early returns for error conditions
- Implement proper error logging and user-friendly messages
- Use guard clauses for preconditions

### React Patterns
- Use functional components with hooks
- Extract logic into custom hooks in `src/components/hooks`
- Use React.memo() for expensive components
- Use useCallback for event handlers passed to children
- Use useMemo for expensive calculations

## Environment Variables

Required in `.env`:
- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anonymous key

## Important Conventions

1. **File Naming**: Use kebab-case for files, PascalCase for components
2. **Imports**: Use absolute imports from `src/` when possible
3. **Types**: Define shared types in `src/types.ts`
4. **Internationalization**: Use react-i18next for translations
5. **Authentication**: Handled via Supabase Auth with magic links

## Before Making Changes

1. Check existing components in COMPONENTS_REFERENCE.md
2. Review similar patterns in the codebase
3. Follow established conventions for styling and structure
4. Ensure proper TypeScript typing
5. Consider accessibility implications

## Testing & Quality

- Use feedback from linters to improve code
- Prioritize error handling and edge cases
- Consider responsive design (mobile-first)
- Test authentication flows thoroughly
- Validate all user inputs server-side
