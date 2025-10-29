---
description: Create a new component following project patterns
---

You are a React and Astro expert creating components for the Tour Planner project.

## Before Creating a Component

**CRITICAL**: Check `.cursor/rules/components/COMPONENTS_REFERENCE.md` first!

1. Verify a similar component doesn't already exist
2. Check if you can reuse or extend existing components
3. Review existing patterns for similar functionality
4. Identify which UI primitives from `src/components/ui` you can use

## Decision: Astro vs React?

Choose the component type based on interactivity:

### Use Astro (.astro) when:
- Component is primarily static content
- No client-side state management needed
- No event handlers or interactivity
- Layout components, headers, footers
- Static content pages

### Use React (.tsx) when:
- Component needs client-side state
- Event handlers required (onClick, onChange, etc.)
- Real-time updates needed
- Forms with validation
- Interactive UI elements

**IMPORTANT**: Never use "use client" directive (that's Next.js specific, not Astro)

## Component Structure

### React Component Template

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
// Import UI components
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

/**
 * [Component Name] - Brief description
 *
 * @example
 * <ComponentName
 *   prop1="value"
 *   onAction={handleAction}
 * />
 */

interface ComponentNameProps {
  // Define all props with JSDoc comments
  /** Description of prop1 */
  prop1: string;
  /** Callback when action occurs */
  onAction?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function ComponentName({
  prop1,
  onAction,
  className = ''
}: ComponentNameProps) {
  const { t } = useTranslation('namespace');
  const [state, setState] = useState<Type>(initialValue);

  // Event handlers
  const handleClick = () => {
    // Handle event
    onAction?.();
  };

  return (
    <div className={`base-classes ${className}`}>
      {/* Component content */}
      <Button onClick={handleClick}>
        {t('button.label')}
      </Button>
    </div>
  );
}
```

### Astro Component Template

```astro
---
/**
 * [Component Name] - Brief description
 */

interface Props {
  title: string;
  description?: string;
  className?: string;
}

const { title, description, className = '' } = Astro.props;
---

<div class={`base-classes ${className}`}>
  <h2>{title}</h2>
  {description && <p>{description}</p>}
  <slot />
</div>

<style>
  /* Component-scoped styles if needed */
</style>
```

## Styling Guidelines

### 1. Use DaisyUI Components First
```tsx
// Good: Use DaisyUI classes
<button className="btn btn-primary">Click me</button>

// Avoid: Custom button styles when DaisyUI provides them
<button className="px-4 py-2 bg-blue-500 rounded">Click me</button>
```

### 2. Use Semantic Colors
```tsx
// Good: Semantic DaisyUI colors (theme-aware)
<div className="bg-base-100 text-base-content">
  <button className="btn btn-primary">Action</button>
</div>

// Bad: Hardcoded Tailwind colors (not theme-aware)
<div className="bg-white text-gray-900">
  <button className="bg-blue-500">Action</button>
</div>
```

### 3. Responsive Design
```tsx
// Good: Mobile-first responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### 4. Use Existing UI Components
```tsx
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
```

## Accessibility Checklist

- [ ] Semantic HTML elements used
- [ ] ARIA attributes where needed (aria-label, aria-describedby, etc.)
- [ ] Keyboard navigation supported (tab order, focus states)
- [ ] Focus states visible
- [ ] Screen reader friendly text
- [ ] Form labels properly associated with inputs
- [ ] Interactive elements have sufficient size (min 44x44px)
- [ ] Color contrast meets WCAG AA standards

## Internationalization

```tsx
import { useTranslation } from 'react-i18next';

function Component() {
  const { t } = useTranslation('namespace');

  return (
    <div>
      <h1>{t('heading.title')}</h1>
      <p>{t('description', { name: userName })}</p>
    </div>
  );
}
```

Translation file location: `public/locales/[lang]/[namespace].json`

## File Organization

Place components in the appropriate directory:

- `src/components/auth/` - Authentication related
- `src/components/tours/` - Tour/trip related
- `src/components/ui/` - Reusable UI primitives (Shadcn/ui style)
- `src/components/` - General shared components
- `src/layouts/` - Astro layout components
- `src/pages/` - Astro page components

## Component Patterns

### Form Components
```tsx
interface FormData {
  field1: string;
  field2: number;
}

function FormComponent({ onSubmit }: { onSubmit: (data: FormData) => Promise<void> }) {
  const [formData, setFormData] = useState<FormData>({ field1: '', field2: 0 });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Partial<FormData> = {};
    if (!formData.field1) newErrors.field1 = 'Required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Modal/Dialog Components
```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

### List Components with Loading States
```tsx
function ListComponent() {
  const [data, setData] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) return <SkeletonLoader />;
  if (error) return <ErrorState message={error} />;
  if (data.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

## Performance Optimization

```tsx
import { memo, useCallback, useMemo } from 'react';

// Memoize expensive components
export const ExpensiveComponent = memo(({ data }: Props) => {
  // Component logic
});

// Memoize callbacks passed to children
function ParentComponent() {
  const handleClick = useCallback(() => {
    // Handle click
  }, [dependencies]);

  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return expensiveOperation(data);
  }, [data]);

  return <ChildComponent onClick={handleClick} data={processedData} />;
}
```

## Testing Considerations

When creating components, consider:
- Edge cases (empty states, error states, loading states)
- Responsive behavior across screen sizes
- Accessibility with keyboard and screen readers
- Different user roles/permissions
- Internationalization in different languages

## Process

1. **Understand Requirements**: What does this component need to do?
2. **Check Existing Components**: Can we reuse anything?
3. **Choose Component Type**: Astro or React?
4. **Plan Structure**: Props, state, logic, styling
5. **Implement Component**: Follow patterns and guidelines
6. **Add Accessibility**: ARIA, keyboard support, focus states
7. **Add Internationalization**: Use translation keys
8. **Test Edge Cases**: Loading, error, empty states
9. **Document**: Add JSDoc comments and usage examples

## Output

Provide:
1. The complete component code
2. Explanation of design decisions
3. Usage example
4. Any translation keys needed
5. Any additional files needed (types, hooks, etc.)
