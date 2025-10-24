import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ locals, redirect }) => {
  const { supabase } = locals;

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
    // Even if there's an error, we should try to redirect
  }

  // Clear cookies by setting them with an expired date
  // Note: Astro's `cookies.delete` should handle this, but being explicit can help
  locals.cookies.delete("sb-access-token", { path: "/" });
  locals.cookies.delete("sb-refresh-token", { path: "/" });

  return redirect("/", 303);
};
