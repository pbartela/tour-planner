# Environment and Configuration

## Required Environment Variables

### Public Variables (Client-Accessible)

- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `PUBLIC_DEFAULT_LOCALE` - Default locale (e.g., `en-US`)

### Server-Only Variables (Secret)

- `SUPABASE_URL` - Same as public URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `OPENROUTER_API_KEY` - Optional AI API key

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in Supabase credentials
3. Environment validation happens at:
   - Build time: `astro.config.mjs`
   - Runtime: `src/lib/server/env-validation.service.ts`

## Path Aliases

- `@/*` maps to `src/*`
- Configured in `tsconfig.json` and `astro.config.mjs`

## Server Configuration

- Development: `http://localhost:4321`
- Production port: 3000 (not 4321)
- Node.js version: v22.14.0 (use `nvm use`)

## Local Supabase Configuration

- API: `http://localhost:54321`
- Database: `localhost:54322`
- Studio: `http://localhost:54323`
- Docker required for local development

## Build Configuration

- Astro 5 with Node adapter (SSR mode)
- View Transitions API enabled
- Sitemap generation enabled
- TypeScript strict mode with all flags enabled

## Husky & Lint-Staged

Pre-commit hooks configured:

- `*.{ts,tsx,astro}` → `eslint --fix`
- `*.{json,css,md}` → `prettier --write`

## Supported Locales

- `en-US` (English - United States)
- `pl-PL` (Polish - Poland)

## Browser Support

Modern browsers with ES2020+ support

## Deployment

- Hosting: DigitalOcean
- CI/CD: GitHub Actions
- Docker image deployment
