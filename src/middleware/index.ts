import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "@/db/supabase.client";
import { validateSession } from "@/lib/server/session-validation.service";
import { getOrCreateCsrfToken, checkCsrfProtection } from "@/lib/server/csrf.service";
import { yearsInSeconds } from "@/lib/constants/time";
import { ENV } from "@/lib/server/env-validation.service";
import i18next from "i18next";

const protectedRoutes = ["/", "/profile", "/tours", "/invite"];
// Routes that authenticated users should be redirected away from.
const authRoutes = ["/login"];
// Public auth routes that should be accessible without authentication
// (e.g., invitation verification, password reset, etc.)
const publicAuthRoutes = ["/auth/verify-invitation", "/auth/error", "/auth/confirm"];
// Allowed locales - must match those defined in astro.config.mjs
const allowedLocales = ["en-US", "pl-PL"] as const;

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseServerClient(context.request, context.cookies);
  context.locals.supabase = supabase;

  // Determine locale from URL params
  const requestedLocale = context.params.locale;
  const lang =
    requestedLocale && allowedLocales.includes(requestedLocale as (typeof allowedLocales)[number])
      ? requestedLocale
      : ENV.PUBLIC_DEFAULT_LOCALE;

  // Debug logging for redirect issues
  if (context.url.pathname.includes("/tours/")) {
    console.log("[Middleware Debug]", {
      pathname: context.url.pathname,
      params: context.params,
      requestedLocale,
      lang,
    });
  }

  // Set i18next language for server-side rendering
  await i18next.changeLanguage(lang);
  // Load common namespace for layout translations
  await i18next.loadNamespaces("common");

  // Set i18next cookie for client-side (used by React components)
  const currentLocale = context.cookies.get("i18next")?.value;
  if (currentLocale !== lang) {
    context.cookies.set("i18next", lang, {
      path: "/",
      maxAge: yearsInSeconds(1),
    });
  }

  const pathWithoutLocale = context.params.locale
    ? context.url.pathname.replace(new RegExp(`^/${context.params.locale}`), "") || "/"
    : context.url.pathname;

  // Generate CSRF token for all requests (will be reused if already exists)
  getOrCreateCsrfToken(context.cookies);

  // CSRF protection for API routes (with exemptions defined in csrf.service.ts)
  if (pathWithoutLocale.startsWith("/api/")) {
    const csrfError = await checkCsrfProtection(context.request, context.cookies);
    if (csrfError) {
      return csrfError;
    }
    return next();
  }

  // SECURITY: Use secure session validation instead of direct getUser()
  const user = await validateSession(supabase);

  // Check if the route is a public auth route (should be accessible without auth)
  const isPublicAuthRoute = publicAuthRoutes.some((route) => pathWithoutLocale.startsWith(route));

  if (user) {
    context.locals.user = user;

    // Check if user's saved language preference differs from current URL locale
    // If so, redirect to their preferred language (except for public auth routes)
    if (
      user.profile.language &&
      user.profile.language !== lang &&
      allowedLocales.includes(user.profile.language as (typeof allowedLocales)[number]) &&
      !isPublicAuthRoute
    ) {
      // Redirect to user's preferred language
      const newPath = `/${user.profile.language}${pathWithoutLocale}`;
      const fullUrl = newPath + context.url.search;
      console.log("[Middleware] Language redirect:", { from: context.url.pathname, to: fullUrl, userLang: user.profile.language, urlLang: lang });
      return context.redirect(fullUrl);
    }

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
  // BUT: skip this check for public auth routes
  if (!context.locals.user && isProtectedRoute && !isPublicAuthRoute) {
    const loginUrl =
      pathWithoutLocale === "/" ? `/${lang}/login` : `/${lang}/login?redirect=${encodeURIComponent(pathWithoutLocale)}`;
    console.log("[Middleware] Auth redirect:", { from: context.url.pathname, to: loginUrl, pathWithoutLocale });
    return context.redirect(loginUrl);
  }

  return next();
});
