import { QueryClient } from "@tanstack/react-query";

/**
 * Shared QueryClient instance for use across all React components in Astro.
 *
 * IMPORTANT: In Astro, React components are "islands of interactivity" and don't
 * share React context. Instead of using QueryClientProvider, import this instance
 * directly and pass it as the second argument to useQuery/useMutation hooks.
 *
 * @example
 * ```tsx
 * import { queryClient } from '@/lib/queryClient';
 * import { useQuery } from '@tanstack/react-query';
 *
 * const { data } = useQuery({
 *   queryKey: ['users'],
 *   queryFn: fetchUsers
 * }, queryClient);
 * ```
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - cache retention (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch on tab focus
      refetchOnMount: false, // Don't refetch if data is fresh
      retry: 1, // Only retry failed requests once
    },
  },
});
