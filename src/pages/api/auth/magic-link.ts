import type { APIRoute } from "astro";
import { supabaseClient as supabase } from "@/db/supabase.client";
import { MagicLinkSchema } from "@/lib/validators/auth.validators";
import { createSupabaseAdminClient } from "@/db/supabase.admin.client";

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  const body = await request.json();
  const result = MagicLinkSchema.safeParse(body);

  if (!result.success) {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
    });
  }

  const { email, redirectTo, locale } = result.data;
  const lang = locale || "en-US";

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const {
      data: { users },
      error: userError,
    } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error("Error finding user:", userError);
      throw new Error(`Error finding user: ${userError.message}`);
    }
    const user = users.find((u) => u.email === email);
    if (user) {
      // User exists, so sign them in
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${url.origin}/auth-callback?next=${encodeURIComponent(redirectTo || `/${lang}/`)}`,
        },
      });
      if (signInError) {
        throw signInError;
      }
    } else {
      // User does not exist, so create them and send a magic link
      const { error: signUpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${url.origin}/auth-callback?next=${encodeURIComponent(`/${lang}/register/complete`)}`,
        },
      });
      if (signUpError) {
        throw signUpError;
      }
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    // TODO: Add error logging
    console.error("Unexpected error in POST /api/auth/magic-link:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
};
