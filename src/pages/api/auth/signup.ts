import type { APIRoute } from "astro";
import { SignInWithMagicLinkSchema } from "@/lib/validators/auth.validators";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, url }) => {
  try {
    const body = await request.json();
    // We can reuse the same schema as for the magic link sign-in
    const validation = SignInWithMagicLinkSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error.flatten() }), { status: 400 });
    }

    const { email } = validation.data;
    const { supabase } = locals;

    const { error } = await supabase.auth.signUp({
      email,
      options: {
        emailRedirectTo: `${url.origin}/register/complete`,
      },
    });

    if (error) {
      console.error("Error signing up:", error);
      return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: "Confirmation link sent." }), {
      status: 200,
    });
  } catch (error) {
    console.error("Unexpected error in signup endpoint:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
};
