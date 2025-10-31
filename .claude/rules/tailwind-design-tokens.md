# Tailwind CSS Design Tokens Rule

## Overview

This project follows a strict rule: **No arbitrary Tailwind CSS values using square bracket notation `[]` are allowed**, except for CSS calc() expressions and other special cases where standard tokens don't apply.

## Rule

**All Tailwind CSS values must use design tokens defined in the Tailwind configuration.**

### ❌ Don't Use Arbitrary Values

```tsx
// Bad - arbitrary values
<div className="w-[500px] h-[100vh] text-[32px] ring-[3px] z-[1] top-[50%]" />
```

### ✅ Use Design Tokens

```tsx
// Good - design tokens
<div className="w-container-sm h-screen text-4.5xl ring-4 z-10 top-1/2" />
```

## Custom Design Tokens

Our custom design tokens are defined in `tailwind.config.ts`:

```typescript
extend: {
  maxWidth: {
    "container-sm": "500px",  // For modals and small containers
    "container-md": "540px",  // For medium modals
  },
  minHeight: {
    "screen-60": "60vh",      // For 60% viewport height sections
  },
  maxHeight: {
    "screen-90": "90vh",      // For modals with 90% max height
  },
  fontSize: {
    "4.5xl": "32px",          // For large headings (between 3xl and 5xl)
  },
}
```

## Acceptable Exceptions

The following patterns are acceptable:

1. **CSS calc() expressions**: `max-w-[calc(100%-2rem)]` - Dynamic calculations
2. **CSS custom properties**: `w-[var(--custom-width)]` - Theme-based values
3. **Advanced selectors**: `[&>span]:text-xs` - Targeting child elements

## Common Replacements

### Sizing

| Arbitrary Value | Design Token | Notes |
|----------------|--------------|-------|
| `w-[500px]` | `w-container-sm` | Custom token |
| `w-[540px]` | `w-container-md` | Custom token |
| `w-[600px]` | `w-xl` (576px) | Closest standard |
| `max-w-[425px]` | `max-w-md` (448px) | Closest standard |
| `h-[100vh]` | `h-screen` | Standard token |
| `min-h-[60vh]` | `min-h-screen-60` | Custom token |
| `max-h-[90vh]` | `max-h-screen-90` | Custom token |

### Typography

| Arbitrary Value | Design Token | Notes |
|----------------|--------------|-------|
| `text-[32px]` | `text-4.5xl` | Custom token |
| `text-[0.8rem]` | `text-sm` (0.875rem) | Closest standard |

### Positioning

| Arbitrary Value | Design Token | Notes |
|----------------|--------------|-------|
| `top-[50%]` | `top-1/2` | Standard fractional |
| `left-[50%]` | `left-1/2` | Standard fractional |
| `translate-x-[-50%]` | `-translate-x-1/2` | Standard with negative |
| `translate-y-[-50%]` | `-translate-y-1/2` | Standard with negative |

### Effects

| Arbitrary Value | Design Token | Notes |
|----------------|--------------|-------|
| `ring-[3px]` | `ring-4` (4px) | Closest standard |

### Z-Index

| Arbitrary Value | Design Token | Notes |
|----------------|--------------|-------|
| `z-[1]` | `z-10` | Standard token |

## Adding New Design Tokens

When you need a value that doesn't have a close standard Tailwind token:

1. **Update `tailwind.config.ts`** in the appropriate `extend` section
2. **Use semantic naming**:
   - `container-sm`, `container-md`, `container-lg` for containers
   - `screen-60`, `screen-90` for viewport-relative sizes
   - `4.5xl`, `5.5xl` for font sizes between standard scales
3. **Document the token** in this file
4. **Use the new token** instead of arbitrary values

## Benefits

- **Consistency**: All sizing and spacing follows a coherent design system
- **Maintainability**: Changes to design tokens update all instances
- **Type Safety**: Tailwind IntelliSense provides autocomplete
- **Performance**: Smaller CSS bundles (no duplicate arbitrary values)
- **Readability**: Semantic token names are self-documenting

## Enforcement

This rule is enforced through:
- Code review process
- Regular codebase audits
- Claude Code following this guideline when making changes

When in doubt, check existing components or add a new design token rather than using arbitrary values.
