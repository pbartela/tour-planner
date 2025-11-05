# Task Completion Checklist

When finishing a task or feature implementation, follow this checklist:

## 1. Code Quality

- [ ] Run `npm run lint:fix` to auto-fix linting errors
- [ ] Run `npm run format` to format code with Prettier
- [ ] Verify TypeScript has no errors (strict mode compliance)
- [ ] Remove any console.log statements or debug code
- [ ] Check for security vulnerabilities (XSS, SQL injection, command injection)

## 2. Type Safety

- [ ] All functions have explicit return types
- [ ] No use of `any` type (use `unknown` if needed)
- [ ] If database schema changed: regenerate types with `npx supabase gen types typescript --local > src/db/database.types.ts`
- [ ] DTOs and Commands properly defined in `src/types.ts`

## 3. Internationalization

- [ ] If new text/labels added: use `t("key")` or `t("namespace:key")`
- [ ] Run `npm run i18n:extract` to update translation JSON files
- [ ] Add translations for both en-US and pl-PL locales
- [ ] Verify translations display correctly in both languages

## 4. Testing

- [ ] Test feature manually in development mode
- [ ] Test error cases and edge conditions
- [ ] Test responsive design (mobile and desktop)
- [ ] Test dark mode if UI was changed
- [ ] Test with both supported locales (en-US, pl-PL)

## 5. API Routes & Services

- [ ] Input validation with Zod schemas
- [ ] Rate limiting applied
- [ ] Session validation implemented
- [ ] Error handling with standardized responses
- [ ] Business logic extracted to services
- [ ] Secure logging (no sensitive data logged)

## 6. Database Changes

- [ ] Migration created with proper naming: `YYYYMMDDHHmmss_description.sql`
- [ ] RLS policies enabled on new tables
- [ ] Test migration with `npx supabase db reset`
- [ ] Types regenerated after schema changes

## 7. Documentation

- [ ] Update README.md if feature affects setup/usage
- [ ] Add JSDoc comments for complex functions
- [ ] Update CONTRIBUTING.md if development process changed
- [ ] Add comments explaining "why" not "what"

## 8. Accessibility

- [ ] Proper ARIA attributes added
- [ ] Keyboard navigation works
- [ ] Semantic HTML elements used
- [ ] Color contrast meets WCAG standards

## 9. Security

- [ ] No hardcoded secrets or credentials
- [ ] Environment variables used for sensitive data
- [ ] CSRF protection in place for state-changing operations
- [ ] Input sanitization and validation
- [ ] RLS policies protect data access

## 10. Git

- [ ] Commit message follows conventional commits format
- [ ] Branch name follows naming conventions
- [ ] Pre-commit hooks pass successfully
- [ ] No unintended files committed

## Quick Commands Summary

```bash
# Before committing
npm run lint:fix
npm run format

# If database changed
npx supabase gen types typescript --local > src/db/database.types.ts

# If i18n keys added
npm run i18n:extract

# Manual testing
npm run dev

# Final check
npm run build
```
