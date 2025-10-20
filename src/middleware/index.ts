import { defineMiddleware } from "astro:middleware";
import { supabaseClient as supabase } from "@/db/supabase.client";
import { CompletedProfileSchema } from "@/lib/validators/profile.validators";

const protectedRoutes = ["/", "/profile", "/tours"];
const authRoutes = ["/login", "/register/complete"];
const publicRoutes = ["/auth-callback"];

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabase;

  const lang = context.params.locale || "en-US";
  const pathWithoutLocale = context.params.locale
    ? context.url.pathname.replace(new RegExp(`^/${context.params.locale}`), "") || "/"
    : context.url.pathname;

  if (pathWithoutLocale.startsWith("/api/auth/") || publicRoutes.some((route) => pathWithoutLocale.startsWith(route))) {
    return next();
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  context.locals.session = session;
  context.locals.user = user ? { id: user.id, email: user.email! } : undefined;

  const isProtectedRoute = protectedRoutes.some((route) => pathWithoutLocale.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathWithoutLocale.startsWith(route));

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
    const isProfileComplete = CompletedProfileSchema.safeParse(profile).success;

    if (!isProfileComplete) {
      if (pathWithoutLocale !== "/register/complete" && !pathWithoutLocale.startsWith("/api")) {
        return context.redirect(`/${lang}/register/complete`);
      }
    } else if (isAuthRoute) {
      return context.redirect(`/${lang}/`);
    }
  } else if (isProtectedRoute && !isAuthRoute) {
    return context.redirect(`/${lang}/login?redirect=${encodeURIComponent(pathWithoutLocale)}`);
  }

  return next();
});
