import { z } from "zod";

import type { UpdateProfileCommand } from "@/types";

export const CompletedProfileSchema = z.object({
  username: z.string().min(3).max(20),
});

export const updateProfileCommandSchema: z.ZodType<UpdateProfileCommand> = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters.").max(20, "Username cannot exceed 20 characters.").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores.").optional(),
    display_name: z.string().min(1, "Display name cannot be empty.").optional(),
    language: z.enum(["en", "pl"]).optional(),
    theme: z.enum(["light", "dark", "system"]).optional(),
    onboarding_completed: z.boolean().optional(),
  })
  .partial();
