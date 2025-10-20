import { z } from "zod";

export const MagicLinkSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().nullable().optional(),
  locale: z.string().optional(),
});
