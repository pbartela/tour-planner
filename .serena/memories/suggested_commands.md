# Suggested Commands

## Development Commands

### Starting Development

```bash
npm run dev              # Start development server (http://localhost:4321)
npm run build            # Build for production
npm run preview          # Preview production build
```

### Code Quality

```bash
npm run lint             # Check for linting errors
npm run lint:fix         # Auto-fix linting errors
npm run format           # Format code with Prettier
```

### Component Development

```bash
npm run storybook        # Start Storybook (http://localhost:6006)
npm run build-storybook  # Build Storybook for production
npm run designs          # Serve static design files (http://localhost:8080)
```

## Supabase Local Development

### Database Management

```bash
npx supabase start       # Start local Supabase (requires Docker)
npx supabase stop        # Stop local Supabase
npx supabase db reset    # Reset local database
```

### Migrations

```bash
npx supabase migration new <name>    # Create new migration
npx supabase migration up             # Apply migrations
```

### Type Generation

```bash
# Generate TypeScript types from database schema
npx supabase gen types typescript --local > src/db/database.types.ts
```

### Local Supabase URLs

- API: http://localhost:54321
- Database: localhost:54322
- Studio: http://localhost:54323

## Internationalization (i18n)

```bash
npm run i18n:extract         # Extract translation keys and update JSON files
npm run i18n:extract:dry     # Dry run (check without modifying)
npm run i18n:check           # Check for translation warnings
```

**Workflow:**

1. Add translation keys in code using `t("namespace:key")` or `t("key")`
2. Run `npm run i18n:extract`
3. Translate new keys in `public/locales/en-US/` and `public/locales/pl-PL/`

## Git Commands (Standard)

```bash
git status               # Check repository status
git add .                # Stage all changes
git commit -m "message"  # Commit changes
git push                 # Push to remote
git pull                 # Pull from remote
```

## System Commands (Linux)

```bash
ls -la                   # List files with details
cd <directory>           # Change directory
grep <pattern> <file>    # Search in files
find . -name <pattern>   # Find files
cat <file>               # Display file contents
```

## Pre-commit Hooks

Husky is configured to run lint-staged on commit:

- `*.{ts,tsx,astro}` → `eslint --fix`
- `*.{json,css,md}` → `prettier --write`

## Task Completion Checklist

After implementing a feature:

1. Run `npm run lint:fix` to fix linting errors
2. Run `npm run format` to format code
3. Test the feature manually in development
4. If database schema changed: regenerate types
5. If i18n keys added: run `npm run i18n:extract`
6. Commit changes with descriptive message
