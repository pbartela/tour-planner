import { defineMiddleware } from "astro:middleware";
import type { User } from "src/types";
import { createSupabaseServerClient } from "@/db/supabase.client";
import { validateSession } from "@/lib/server/session-validation.service";

const protectedRoutes = ["/", "/profile", "/tours"];
// Routes that authenticated users should be redirected away from.
const authRoutes = ["/login"];

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseServerClient(context.cookies);
  context.locals.supabase = supabase;

  const lang = context.params.locale || import.meta.env.PUBLIC_DEFAULT_LOCALE || "en-US";

  // Only set locale cookie if it has changed to avoid unnecessary cookie writes
  const currentLocale = context.cookies.get("locale")?.value;
  if (currentLocale !== lang) {
    context.cookies.set("locale", lang, {
      path: "/",
      maxAge: 365 * 24 * 60 * 60, // 1 year
    });
  }

  const pathWithoutLocale = context.params.locale
    ? context.url.pathname.replace(new RegExp(`^/${context.params.locale}`), "") || "/"
    : context.url.pathname;

  // API routes are not handled by this page-level redirect middleware.
  if (pathWithoutLocale.startsWith("/api/")) {
    return next();
  }

  // SECURITY: Use secure session validation instead of direct getUser()
  const user = await validateSession(supabase);

  if (user) {
    context.locals.user = user;

    // If a user is fully authenticated and tries to visit an auth route (e.g., /login),
    // redirect them to the main dashboard.
    if (authRoutes.some((route) => pathWithoutLocale.startsWith(route))) {
      return context.redirect(`/${lang}/`);
    }
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
