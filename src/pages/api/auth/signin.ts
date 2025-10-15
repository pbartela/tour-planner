import type { APIRoute } from "astro";

import { authService } from "@/lib/services/auth.service";
import { signInCommandSchema } from "@/lib/validators/auth.validators";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	try {
		const body = await request.json();
		const validation = signInCommandSchema.safeParse(body);

		if (!validation.success) {
			return new Response(JSON.stringify(validation.error.flatten()), { status: 400 });
		}

		const { email } = validation.data;
		const { supabase } = locals;

		const { error } = await authService.sendMagicLink(supabase, email);

		if (error) {
			console.error("Error sending magic link:", error);
			return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
		}

		return new Response(JSON.stringify({}), { status: 200 });
	} catch (error) {
		console.error("Unexpected error in signin endpoint:", error);
		return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
	}
};
