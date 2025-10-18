import { z } from "zod";

export const SignInWithEmailAndPasswordSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});

export const SignInWithMagicLinkSchema = z.object({
	email: z.string().email(),
	redirectTo: z.string().optional(),
});
