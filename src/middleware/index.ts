import { defineMiddleware } from "astro:middleware";
import type { User } from "src/types";
import { createSupabaseServerClient } from "@/db/supabase.client";

const protectedRoutes = ["/", "/profile", "/tours"];
// Routes that authenticated users should be redirected away from.
const authRoutes = ["/login"];

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseServerClient(context.cookies);
  context.locals.supabase = supabase;

  const lang = context.params.locale || "en-US";
  const pathWithoutLocale = context.params.locale
    ? context.url.pathname.replace(new RegExp(`^/${context.params.locale}`), "") || "/"
    : context.url.pathname;

  // API routes are not handled by this page-level redirect middleware.
  if (pathWithoutLocale.startsWith("/api/")) {
    return next();
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const sessionUser = session?.user;

  context.locals.session = session;

  if (sessionUser) {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", sessionUser.id).single();

    if (profile) {
      const user: User = {
        id: sessionUser.id,
        email: sessionUser.email || "",
        profile,
      };
      context.locals.user = user;

      // If a user is fully authenticated and tries to visit an auth route (e.g., /login),
      // redirect them to the main dashboard.
      if (authRoutes.some((route) => pathWithoutLocale.startsWith(route))) {
        return context.redirect(`/${lang}/`);
      }
    }
    // If there is a session user but no profile, they are effectively logged out
    // from the app's perspective. The logic below will handle redirection if needed.
  }

  const isProtectedRoute = protectedRoutes.some((route) =>
    route === "/" ? pathWithoutLocale === route : pathWithoutLocale.startsWith(route)
  );

  // If user is not logged in and trying to access a protected route, redirect to login.
  if (!context.locals.user && isProtectedRoute) {
    return context.redirect(`/${lang}/login?redirect=${encodeURIComponent(pathWithoutLocale)}`);
  }

  return next();
});
