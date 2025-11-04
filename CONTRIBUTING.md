# Contributing to Plan Tour

Thank you for your interest in contributing to Plan Tour! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Project Structure](#project-structure)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js `22.14.0` (use [nvm](https://github.com/nvm-sh/nvm) to manage Node versions: `nvm use`)
- npm or a compatible package manager
- Git
- A Supabase account for backend services

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork:**
   ```sh
   git clone https://github.com/YOUR_USERNAME/tour-planner.git
   cd tour-planner
   ```

3. **Add the upstream remote:**
   ```sh
   git remote add upstream https://github.com/turu/tour-planner.git
   ```

4. **Install dependencies:**
   ```sh
   npm install
   ```

5. **Set up environment variables:**
   Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```sh
   cp .env.example .env
   ```

6. **Start the development server:**
   ```sh
   npm run dev
   ```

The application should now be running at `http://localhost:4321`.

## Development Workflow

1. **Create a new branch** for your feature or bug fix:
   ```sh
   git checkout -b feature/your-feature-name
   ```
   or
   ```sh
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** following the [Code Standards](#code-standards)

3. **Test your changes** locally

4. **Commit your changes** following the [Commit Message Guidelines](#commit-message-guidelines)

5. **Push to your fork:**
   ```sh
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

### Branch Naming Best Practices

Use descriptive, kebab-case branch names that clearly indicate the type and scope of work:

#### Branch Name Format
```
<type>/<short-description>
```

#### Branch Types
- `feature/` - New feature implementation
- `fix/` - Bug fixes
- `refactor/` - Code refactoring without behavior changes
- `docs/` - Documentation updates
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks (dependencies, tooling)
- `perf/` - Performance improvements
- `security/` - Security-related changes

#### Good Examples
✅ `feature/invitation-system` - Clear scope, single feature
✅ `fix/rate-limiting-invitations` - Specific fix
✅ `refactor/query-client-pattern` - Clear refactoring goal
✅ `docs/rollback-guide` - Documentation addition
✅ `security/csrf-protection` - Security enhancement

#### Bad Examples
❌ `metada-cache` - Typo, unclear scope (metadata? what about it?)
❌ `updates` - Too vague
❌ `fix-stuff` - Not descriptive
❌ `feature/add-everything` - Too broad
❌ `john-dev` - Personal branch names

### Pull Request Scope Guidelines

**Golden Rule**: Each PR should represent ONE logical change that can be:
- Reviewed independently
- Deployed independently (when possible)
- Reverted independently if issues arise

#### What Counts as "One Logical Change"?

✅ **Good PR Scopes**:

1. **Single Feature**:
   - Title: "Add invitation system with email sending"
   - Changes: Invitation table, email service, UI components for sending invites
   - Why it's good: All changes work together for one user-facing feature

2. **Single Bug Fix**:
   - Title: "Fix rate limiting bypass in invitation endpoint"
   - Changes: Rate limit config, API endpoint update, tests
   - Why it's good: Focused on solving one specific problem

3. **Related Refactoring**:
   - Title: "Refactor query client to singleton pattern for Astro"
   - Changes: Remove QueryProvider, add queryClient.ts, update all consumers
   - Why it's good: Single architectural change with necessary updates

❌ **Bad PR Scopes**:

1. **Multiple Unrelated Features**:
   - Title: "Add metadata cache and fix navigation and update migrations"
   - Changes: Caching system + View Transitions + Database migrations + RLS policies
   - Why it's bad: Impossible to review, deploy, or revert independently

2. **Feature Creep**:
   - Title: "Add user profiles"
   - Changes: Profile CRUD + Avatar uploads + Email preferences + Theme settings
   - Why it's bad: Should be split into multiple PRs (core profiles, then enhancements)

#### When to Split a PR

**Split if**:
- PR has >500 lines of changes (unless mostly generated)
- Changes span multiple unrelated features
- Some changes could be deployed independently
- Reverting would affect unrelated functionality
- Reviewers request splitting for clarity

**Don't split if**:
- Changes are tightly coupled (e.g., API + UI for same feature)
- Splitting would break functionality
- It's a large refactoring that must be atomic

## Code Standards

### TypeScript

- **Strict Type Safety**: All code must pass TypeScript's strict mode checks
- **Explicit Return Types**: All functions should have explicit return type annotations
- **No `any` Types**: Avoid using `any` types. Use proper type definitions or `unknown` when necessary
- **Interfaces Over Types**: Prefer interfaces for object shapes unless you need union/intersection types

Example:
```typescript
// Good
export function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Avoid
export function calculateTotal(items: any) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### React Components

- **Functional Components**: Use functional components with hooks
- **Props Interface**: Always define a props interface for components
- **Return Types**: Explicitly type component return values as `React.JSX.Element`

Example:
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled = false }: ButtonProps): React.JSX.Element {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

### Code Style

- **Formatting**: Use Prettier for code formatting (`npm run format`)
- **Linting**: Ensure your code passes ESLint checks (`npm run lint`)
- **Line Length**: Keep lines under 120 characters when possible
- **Naming Conventions**:
  - Components: PascalCase for component files (e.g., `TourCard.tsx`, `DatePicker.tsx`, `DatePicker.stories.tsx`)
  - Functions/Variables: camelCase (e.g., `getTourDetails`)
  - Constants: UPPER_SNAKE_CASE (e.g., `MAX_PARTICIPANTS`)
  - Files: kebab-case for non-component files (e.g., `tour.service.ts`, utility files)

### File Organization

- **Imports Order**:
  1. React and external libraries
  2. Internal components and utilities (using `@/` alias)
  3. Types and interfaces
  4. Styles

Example:
```typescript
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { tourService } from "@/lib/services/tour.service";

import type { Tour } from "@/types";
```

### Documentation

- **JSDoc Comments**: Add JSDoc comments for public functions and complex logic
- **Inline Comments**: Explain "why" rather than "what" for complex code
- **Component Documentation**: Consider adding Storybook stories for new UI components

Example:
```typescript
/**
 * Validates and processes a magic link authentication request.
 *
 * @param email - User's email address
 * @param redirectTo - Optional redirect path after authentication
 * @returns Response indicating success or failure
 */
export async function sendMagicLink(
  email: string,
  redirectTo?: string
): Promise<{ success: boolean; error?: string }> {
  // Implementation
}
```

## Testing

Before submitting a pull request:

1. **Type Check**: Run `npm run build` to ensure TypeScript compilation passes
2. **Lint**: Run `npm run lint` to check for code quality issues
3. **Format**: Run `npm run format` to ensure consistent code formatting
4. **Manual Testing**: Test your changes thoroughly in the development environment

## Submitting Changes

### Pull Request Process

1. **Update Documentation**: If you've added new features, update the README or relevant documentation
2. **Self-Review**: Review your own code before submitting
3. **Write a Clear PR Description**:
   - Describe what changes you made and why
   - Reference any related issues (e.g., "Fixes #123")
   - Include screenshots for UI changes
4. **Keep PRs Focused**: One feature or fix per pull request
5. **Respond to Feedback**: Be open to feedback and make requested changes promptly

### Pull Request Title Format

Use the format: `<type>: <clear description>`

**Types**:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `test:` - Tests
- `chore:` - Maintenance
- `perf:` - Performance
- `security:` - Security fix

**Good Examples**:
- ✅ `feat: add invitation system with email notifications`
- ✅ `fix: resolve rate limiting bypass in invitation API`
- ✅ `refactor: convert Query Client to singleton for Astro compatibility`
- ✅ `docs: add database rollback guide`

**Bad Examples**:
- ❌ `Metada cache` - Typo, vague, missing type
- ❌ `Updates` - Too vague
- ❌ `WIP` - Not ready for review (use draft PRs instead)

### Pull Request Description Template

```markdown
## Summary
Brief description of what this PR does (1-2 sentences)

## Motivation
Why is this change needed? What problem does it solve?

## Changes
- Change 1
- Change 2
- Change 3

## Breaking Changes
List any breaking changes and migration steps (if applicable)
See MIGRATION_GUIDE.md if this introduces breaking changes.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to change)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement

## Testing
- [ ] Manual testing completed
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Tested in both dev and production mode
- [ ] Database migrations tested (if applicable)

## Deployment Notes
Any special considerations for deployment? Database migrations?

## Screenshots (if applicable)
Visual changes should include before/after screenshots

## Related Issues
Fixes #(issue number)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex logic
- [ ] Documentation updated (README, CLAUDE.md, etc.)
- [ ] No console.log or debugging code
- [ ] Migrations have rollback documentation (if applicable)
- [ ] Breaking changes documented in MIGRATION_GUIDE.md (if applicable)
```

## Project Structure

```
tour-planner/
├── .ai/                    # AI-related documentation and prompts
├── docs/                   # Project documentation
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components (shadcn/ui)
│   │   ├── auth/          # Authentication-related components
│   │   ├── tours/         # Tour-related components
│   │   └── shared/        # Shared utility components
│   ├── db/                # Database client configuration
│   ├── lib/               # Utilities and services
│   │   ├── services/      # Business logic services
│   │   ├── validators/    # Zod validation schemas
│   │   └── server/        # Server-side utilities
│   ├── middleware/        # Astro middleware
│   ├── pages/             # Astro pages and API routes
│   │   └── api/           # API endpoints
│   ├── styles/            # Global styles
│   └── types/             # TypeScript type definitions
├── supabase/
│   └── migrations/        # Database migrations
└── .storybook/            # Storybook configuration
```

## Commit Message Guidelines

Follow the Conventional Commits specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring without feature changes
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates

### Examples

```
feat(auth): add magic link authentication

Implement passwordless authentication using Supabase magic links.
Users can now log in by clicking a link sent to their email.

Closes #42
```

```
fix(tours): correct date formatting in tour list

The tour list was displaying dates in the wrong timezone.
Updated to use toISOString() for consistent formatting.
```

```
docs: update contributing guidelines

Add sections on code standards and commit message format
to help new contributors get started.
```

## Security Considerations

When contributing to the project, please keep security in mind:

- **Environment Variables**: Never commit `.env` files or expose secrets
- **Input Validation**: Always validate user input using Zod schemas
- **Rate Limiting**: Consider rate limiting for new endpoints that could be abused
- **CSRF Protection**: Include CSRF validation for state-changing endpoints
- **Error Messages**: Use generic error messages to avoid information leakage
- **Authentication**: Always verify user authentication for protected operations

See [docs/SECURITY.md](docs/SECURITY.md) for detailed security guidelines and [docs/SECURITY_IMPLEMENTATION.md](docs/SECURITY_IMPLEMENTATION.md) for implementation details.

## Additional Resources

- **[CLAUDE.md](./CLAUDE.md)** - Project architecture, tech stack, and coding conventions
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Breaking changes and migration instructions
- **[supabase/ROLLBACK_GUIDE.md](./supabase/ROLLBACK_GUIDE.md)** - Database migration rollback procedures
- **[docs/SECURITY.md](./docs/SECURITY.md)** - Security guidelines
- **[docs/SECURITY_IMPLEMENTATION.md](./docs/SECURITY_IMPLEMENTATION.md)** - Security implementation details

## Need Help?

- Check existing [Issues](https://github.com/turu/tour-planner/issues) for similar problems
- Create a new issue if you encounter a bug or have a feature request
- Review the [Additional Resources](#additional-resources) for guidance
- Reach out to the maintainers if you need clarification

Thank you for contributing to Plan Tour!
