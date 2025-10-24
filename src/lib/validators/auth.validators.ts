import { z } from "zod";

// Whitelist of allowed redirect paths (relative paths only)
// These are path prefixes that users can be redirected to after authentication
const ALLOWED_REDIRECT_PATHS = [
  '/',
  '/dashboard',
  '/tours',
  '/profile',
  '/settings',
] as const;

export const MagicLinkSchema = z.object({
  email: z.string().email(),
  redirectTo: z
    .string()
    .nullable()
    .optional()
    .refine(
      (url) => {
        if (!url) return true; // null/undefined is acceptable

        // Must be a relative path (starts with /)
        if (!url.startsWith('/')) return false;

        // Must not be a protocol-relative URL (starts with //)
        if (url.startsWith('//')) return false;

        // Extract the path part (before query params)
        const path = url.split('?')[0];

        // Check if path starts with any allowed prefix
        return ALLOWED_REDIRECT_PATHS.some(allowed =>
          path === allowed || path.startsWith(allowed + '/')
        );
      },
      { message: 'Invalid redirect URL. Must be a relative path within the application.' }
    ),
  locale: z.string().optional(),
});
