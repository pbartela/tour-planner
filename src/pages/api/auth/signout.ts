import type { APIRoute } from "astro";
import { checkCsrfProtection } from "@/lib/server/csrf.service";
import { secureError } from "@/lib/server/logger.service";

export const POST: APIRoute = async ({ request, locals, cookies, redirect }) => {
  // CSRF protection - signout is a state-changing operation that requires protection
  const csrfError = await checkCsrfProtection(request, cookies);
  if (csrfError) {
    return csrfError;
  }

  const { supabase } = locals;

  const { error } = await supabase.auth.signOut();

  if (error) {
    secureError("Error signing out", error);
    // Even if there's an error, we should try to redirect
  }

  // Clear cookies by setting them with an expired date
  // Note: Astro's `cookies.delete` should handle this, but being explicit can help
  locals.cookies.delete("sb-access-token", { path: "/" });
  locals.cookies.delete("sb-refresh-token", { path: "/" });

  return redirect("/", 303);
};
