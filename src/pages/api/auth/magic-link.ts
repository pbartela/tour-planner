import type { APIRoute } from "astro";
import { MagicLinkSchema } from "src/lib/validators/auth.validators";
import { createSupabaseAdminClient } from "src/db/supabase.admin.client";

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  const parsedData = MagicLinkSchema.safeParse(data);

  if (!parsedData.success) {
    return new Response(JSON.stringify(parsedData.error), { status: 400 });
  }

  const { email, redirectTo, locale } = parsedData.data;

  // Always redirect to auth callback page, passing the intended destination as a query param
  const redirectURL = new URL(request.url);
  redirectURL.pathname = "/auth-callback";
  if (redirectTo) {
    redirectURL.searchParams.set("next", redirectTo);
  }
  if (locale) {
    redirectURL.searchParams.set("locale", locale);
  }

  // Use admin client for server-side auth operations
  const supabaseAdmin = createSupabaseAdminClient();

  // Use signInWithOtp which handles both existing and new users
  const { error } = await supabaseAdmin.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectURL.toString(),
      shouldCreateUser: true,
    },
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ message: "Magic link sent successfully" }), { status: 200 });
};
