# GitHub Integration for Claude Code Review

This document explains how the Claude Code review system is integrated with GitHub Actions.

## How It Works

When a pull request is opened or updated, the GitHub Action at `.github/workflows/claude-code-review.yml` automatically:

1. **Checks out the repository** with full history to access all configuration files
2. **Invokes the `/review` command** which loads `.claude/commands/review.md`
3. **Reviews the PR** following the comprehensive checklist
4. **Posts a comment** on the PR with detailed feedback

## Review Process

The automated review covers:

### ✅ Architecture & Patterns

- Project structure conventions
- Logic separation (components vs services vs API routes)
- Reuse of existing components

### ✅ React & Astro Best Practices

- Proper component type usage (Astro for static, React for interactive)
- Hook usage and memoization
- No Next.js-specific directives

### ✅ API & Backend

- Uppercase HTTP methods
- Zod validation
- Business logic in services
- Error handling with early returns

### ✅ Database & Migrations

- Proper file naming
- RLS enabled on all tables
- Granular policies
- SQL best practices

### ✅ Styling & UI

- DaisyUI component usage
- Semantic colors
- Responsive design
- Accessibility

### ✅ Security

- Input validation
- Authentication checks
- No sensitive data exposure
- Proper cookie settings

### ✅ Performance

- No unnecessary re-renders
- Memoization where needed
- Optimized assets

## Configuration Files Used

The GitHub Action references these files:

1. **`.claude/commands/review.md`** - Main review checklist and format
2. **`.claude/commands/project-context.md`** - Project standards and patterns
3. **`.cursor/rules/components/COMPONENTS_REFERENCE.md`** - Component catalog
4. **`.cursor/rules/shared.mdc`** - General coding guidelines

## Required GitHub Secret

Ensure `CLAUDE_CODE_OAUTH_TOKEN` is set in repository secrets:

1. Go to repository Settings → Secrets and variables → Actions
2. Add new secret: `CLAUDE_CODE_OAUTH_TOKEN`
3. Value: Your Claude Code OAuth token from https://claude.ai/settings

## Customizing the Review

### Filter by File Types

Uncomment in `.github/workflows/claude-code-review.yml`:

```yaml
on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - "src/**/*.ts"
      - "src/**/*.tsx"
      - "src/**/*.astro"
```

### Filter by Author

Uncomment in the workflow to only review specific contributors:

```yaml
jobs:
  claude-review:
    if: |
      github.event.pull_request.author_association == 'FIRST_TIME_CONTRIBUTOR' ||
      github.event.pull_request.user.login == 'external-contributor'
```

### Adjust Review Depth

Modify the prompt in the workflow to focus on specific areas:

```yaml
prompt: |
  /review

  Focus this review on:
  - Security vulnerabilities
  - Performance issues
  - Breaking changes
```

## Review Output Format

The review comment will include:

### Summary

Brief overview of changes and overall assessment

### Issues Found

- **Critical**: Must be fixed before merge
- **Important**: Should be addressed
- **Minor**: Nice to have improvements

### Specific Feedback

File-by-file feedback with line references (e.g., `src/components/MyComponent.tsx:42`)

### Positive Notes

Recognition of good practices

### Recommendations

Broader improvement suggestions

## Manual Review

You can also invoke reviews manually in Claude Code CLI:

```bash
# Review current PR
claude-code "/review"

# Review specific files
claude-code "/review - check src/components/NewComponent.tsx"
```

## Troubleshooting

### Review Not Running

Check:

- [ ] `CLAUDE_CODE_OAUTH_TOKEN` is set in repository secrets
- [ ] Workflow has proper permissions (pull-requests: read)
- [ ] PR matches trigger conditions (types, paths, author filters)

### Review Missing Context

Ensure:

- [ ] `fetch-depth: 0` in checkout step (gets all files)
- [ ] `.claude/commands/` files are committed to repository
- [ ] Review command references correct file paths

### Review Format Issues

Verify:

- [ ] `.claude/commands/review.md` exists and is properly formatted
- [ ] Prompt in workflow correctly references `/review` command
- [ ] GitHub CLI commands are properly allowed in `claude_args`

## Disabling Automated Review

To temporarily disable automated reviews:

1. Comment out the workflow trigger:

   ```yaml
   # on:
   #   pull_request:
   #     types: [opened, synchronize]
   ```

2. Or disable the workflow in GitHub:
   - Go to Actions tab
   - Select "Claude Code Review" workflow
   - Click "..." → "Disable workflow"

## Best Practices

1. **Review the review** - AI reviews are helpful but not perfect
2. **Iterate on prompts** - Adjust the workflow prompt based on team needs
3. **Keep context files updated** - Update `.claude/commands/` as project evolves
4. **Use selectively** - Consider filtering by author or file type
5. **Human review still required** - AI reviews complement, not replace human judgment

## Resources

- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Project Review Guidelines](.claude/commands/review.md)
