# Code Style and Conventions

## Naming Conventions

- **Files**: kebab-case (e.g., `user-profile.tsx`, `tour-list.astro`)
- **Components**: PascalCase (e.g., `UserProfile`, `TourList`)
- **Variables/Functions**: camelCase (e.g., `getUserProfile`, `tourList`)
- **Types/Interfaces**: PascalCase (e.g., `TourDetailsDto`, `CreateTourCommand`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_PARTICIPANTS`, `DEFAULT_LOCALE`)

## TypeScript Standards

- Strict mode enabled with all strict flags:
  - `noImplicitAny: true`
  - `strictNullChecks: true`
  - `strictFunctionTypes: true`
  - `strictBindCallApply: true`
  - `strictPropertyInitialization: true`
  - `noImplicitThis: true`
  - `alwaysStrict: true`
- Always provide explicit types for function parameters and return values
- Avoid using `any` type - use `unknown` if type is truly unknown
- Use type imports when importing only types: `import type { User } from '@/types'`

## Prettier Configuration

- Semi-colons: Required (semi: true)
- Quotes: Double quotes (singleQuote: false)
- Tab width: 2 spaces
- Print width: 120 characters
- Trailing commas: ES5 standard

## Component Guidelines

### Astro Components (.astro)

- Use for static content and layouts
- Minimal client-side JavaScript
- Leverage server-side rendering

### React Components (.tsx)

- Use ONLY when interactivity is needed
- Functional components with hooks (no class components)
- **NEVER** use Next.js directives like `"use client"`
- Extract custom hooks to `src/lib/hooks/`
- Use React.memo() for expensive components
- Use useCallback for event handlers passed to children
- Use useMemo for expensive calculations

## Import Organization

- Use absolute imports with `@/` alias (maps to `src/`)
- Group imports:
  1. External libraries
  2. Astro/Framework imports
  3. Internal components
  4. Types
  5. Utilities/helpers
  6. Styles

## Error Handling

- Use early returns for error conditions (guard clauses)
- Handle errors at the beginning of functions
- Implement proper error logging with secure logging service
- Provide user-friendly error messages
- Never log sensitive data (tokens, passwords, etc.)

## Code Comments

- Use JSDoc for function documentation
- Explain "why" not "what" in comments
- Keep comments up-to-date with code changes
- Use TODO comments sparingly with context

## API Endpoint Conventions

- Use uppercase HTTP method names: `GET`, `POST`, `PATCH`, `DELETE`
- Set `export const prerender = false` for dynamic routes
- Follow standardized error response format
- Always validate input with Zod schemas
- Extract business logic to services

## Accessibility

- Include ARIA attributes where appropriate
- Ensure keyboard navigation support
- Use semantic HTML elements
- Test with screen readers
- Maintain proper heading hierarchy
