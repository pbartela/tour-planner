import { z } from "zod";

import type { UpdateProfileCommand } from "@/types";

export const updateProfileCommandSchema: z.ZodType<UpdateProfileCommand> = z
  .object({
    display_name: z.string().min(1, "Display name cannot be empty.").optional(),
    language: z.enum(["en", "pl"]).optional(),
    theme: z.enum(["light", "dark", "system"]).optional(),
    onboarding_completed: z.boolean().optional(),
  })
  .partial();

export const completedProfileSchema = z.object({
  onboarding_completed: z.boolean(),
});
