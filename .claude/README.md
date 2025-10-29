# Claude Code Configuration

This directory contains Claude Code slash commands and context files for the Tour Planner project.

## Available Commands

### `/project-context`
Foundational context about the Tour Planner project including:
- Tech stack (Astro, React, TypeScript, Supabase, Tailwind, DaisyUI)
- Project structure and directory organization
- Key architectural patterns
- Coding conventions and best practices

**Use this when**: Starting work on the project or when you need to understand the project structure.

### `/review`
Comprehensive code review checklist covering:
- Architecture and patterns
- React and Astro best practices
- API and backend guidelines
- Database and migrations
- Styling and UI (DaisyUI, Tailwind)
- Accessibility
- Error handling
- TypeScript
- Security
- Performance

**Use this when**: Reviewing pull requests, checking code quality, or before committing changes.

### `/migration`
Guide for creating Supabase database migration files with:
- Proper file naming convention (YYYYMMDDHHmmss_description.sql)
- Migration structure and SQL guidelines
- Row Level Security (RLS) implementation
- Common table patterns
- Safety checks for destructive operations

**Use this when**: Creating new tables, altering schema, or adding database features.

### `/component`
Instructions for creating Astro or React components including:
- Decision guide (when to use Astro vs React)
- Component templates and structure
- Styling guidelines (DaisyUI, Tailwind)
- Accessibility checklist
- Internationalization patterns
- Performance optimization

**Use this when**: Creating new UI components or refactoring existing ones.

### `/api`
Template for creating Astro API endpoints with:
- Proper endpoint structure
- Zod validation
- Authentication and authorization
- Error handling patterns
- Service layer integration
- Security checklist

**Use this when**: Creating new API routes or refactoring existing endpoints.

### `/auth`
Complete guide for Supabase authentication integration:
- Magic link authentication setup
- Middleware configuration
- Auth API endpoints (login, callback, logout)
- Cookie management with SSR
- Security best practices
- Common pitfalls and troubleshooting

**Use this when**: Setting up authentication or debugging auth issues.

## How to Use

### In Claude Code

Simply type the slash command in your conversation:

```
/review
```

or

```
/component - I need to create a new card component
```

The command will load the appropriate context and guide you through the task.

### For Agents

These files serve as specialized knowledge bases for Claude Code agents. When working on specific tasks, agents can reference these files to ensure consistency with project standards.

## File Organization

```
.claude/
├── README.md                    # This file
└── commands/
    ├── project-context.md       # Project overview and structure
    ├── review.md                # Code review guidelines
    ├── migration.md             # Database migration guide
    ├── component.md             # Component creation guide
    ├── api.md                   # API endpoint guide
    └── auth.md                  # Authentication integration guide
```

## Maintenance

When updating these files:
1. Keep them synchronized with actual project patterns
2. Update examples when introducing new conventions
3. Add new commands as the project evolves
4. Remove outdated information

## Related Files

These Claude Code files complement the existing Cursor rules in `.cursor/rules/`:
- `.cursor/rules/shared.mdc` - General project guidelines
- `.cursor/rules/components/COMPONENTS_REFERENCE.md` - Component catalog
- `.cursor/rules/ui/` - UI framework specific rules
- `.cursor/rules/backend/` - Backend specific rules
- `.cursor/rules/supabase/` - Supabase specific rules

## Tips

1. **Chain commands**: Use multiple commands in sequence for complex tasks
   ```
   /project-context
   /component - create a tour detail card
   /review - review the component I just created
   ```

2. **Reference patterns**: Commands encourage checking existing code before creating new code

3. **Stay consistent**: Following these guides ensures code consistency across the team

4. **Iterate**: Commands can be improved as the project evolves

## Contributing

When adding new commands:
1. Create a new `.md` file in `.claude/commands/`
2. Include a description in the frontmatter
3. Structure content with clear sections
4. Provide examples and templates
5. Update this README

## Support

For issues or questions about these commands:
- Check the related Cursor rules in `.cursor/rules/`
- Review existing code for patterns
- Consult the team for project-specific decisions
