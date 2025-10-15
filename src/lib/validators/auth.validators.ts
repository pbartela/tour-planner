import { z } from "zod";

import type { SignInCommand } from "@/types";

export const signInCommandSchema: z.ZodType<SignInCommand> = z.object({
	email: z.string().email({ message: "Please enter a valid email address." }),
});
