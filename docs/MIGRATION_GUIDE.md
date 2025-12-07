# Migration Guide

This document tracks breaking changes and migration instructions for the Plan Tour application.

## Breaking Changes

### QueryProvider Removal (Metadata Cache Update)

**Date**: November 2024
**Affected Files**:

- ❌ `src/components/QueryProvider.tsx` (REMOVED)
- ✅ `src/lib/queryClient.ts` (NEW)

#### Why This Changed

Astro treats React components as "islands of interactivity" which don't share React context. The previous `QueryClientProvider` approach didn't work correctly in Astro's architecture because each island is isolated. The new pattern uses a singleton `queryClient` instance that's imported directly.

#### Migration Steps

**Before** (Old Pattern - No longer works):

```tsx
import { useQuery } from "@tanstack/react-query";

function MyComponent() {
  const { data } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
  // This would fail because no QueryClientProvider wraps the component
}
```

**After** (New Pattern - Required):

```tsx
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

function MyComponent() {
  const { data } = useQuery(
    {
      queryKey: ["users"],
      queryFn: fetchUsers,
    },
    queryClient
  ); // Pass queryClient as second argument

  // ✅ Works correctly in Astro islands
}
```

#### For Mutations

**Before**:

```tsx
import { useMutation } from "@tanstack/react-query";

const mutation = useMutation({
  mutationFn: createTour,
});
```

**After**:

```tsx
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

const mutation = useMutation(
  {
    mutationFn: createTour,
  },
  queryClient
); // Pass queryClient as second argument
```

#### For `useQueryClient` Hook

If you were using `useQueryClient()` to access the query client:

**Before**:

```tsx
import { useQueryClient } from "@tanstack/react-query";

function MyComponent() {
  const queryClient = useQueryClient();
  // ...
}
```

**After**:

```tsx
import { queryClient } from "@/lib/queryClient";

function MyComponent() {
  // Just import and use the singleton directly
  queryClient.invalidateQueries({ queryKey: ["users"] });
}
```

#### Automated Migration

To update all components, search for these patterns:

1. **useQuery without queryClient**:
   - Search: `useQuery\(`
   - Find components missing the queryClient parameter
   - Add `, queryClient` as the second argument

2. **useMutation without queryClient**:
   - Search: `useMutation\(`
   - Find components missing the queryClient parameter
   - Add `, queryClient` as the second argument

3. **useQueryClient() calls**:
   - Search: `const.*=.*useQueryClient\(\)`
   - Replace with `import { queryClient } from '@/lib/queryClient'`
   - Remove the `useQueryClient()` call

#### Examples in Codebase

See these files for correct usage examples:

- `src/lib/hooks/useTourDetails.ts` - useQuery example
- `src/lib/hooks/useTourMutations.ts` - useMutation with optimistic updates
- `src/lib/hooks/useVoteMutation.ts` - useMutation example

#### Benefits of New Pattern

1. ✅ Works correctly with Astro's island architecture
2. ✅ Shared cache across all components (same instance)
3. ✅ Simpler - no need to wrap app in provider
4. ✅ Type-safe - TypeScript ensures queryClient is passed
5. ✅ Explicit dependencies - clearer what each component needs

---

## Future Breaking Changes

When adding new breaking changes:

1. Add a section above with the change description
2. Include migration steps with before/after examples
3. List affected files
4. Provide automated migration instructions if possible
5. Update this date: **Last Updated**: November 2024
