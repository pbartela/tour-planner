# Server-Side Utilities

This directory contains server-side only functions and utilities that are used in Astro pages, API routes, and middleware.

## Structure

- `error-mapping.service.ts` - Maps authentication error codes to user-friendly messages
- `README.md` - This documentation file

## Usage

These utilities are designed to be imported and used in:
- Astro pages (`.astro` files)
- API routes (`src/pages/api/`)
- Middleware (`src/middleware/`)

## Guidelines

- All functions should be pure server-side (no browser APIs)
- Use TypeScript for type safety
- Include proper error handling
- Document functions with JSDoc comments
- Keep functions focused and single-purpose
