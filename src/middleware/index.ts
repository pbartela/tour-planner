import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client.ts';

const publicRoutes = ['/login', '/register', '/register/complete', '/api/auth/signin'];

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  const { url, cookies, redirect, params } = context;

  const lang = params.locale ?? 'en-US';
  const path = url.pathname;
  const pathWithoutLocale = params.locale ? path.replace(new RegExp(`^/${params.locale}`), '') || '/' : path;

  const isPublic = publicRoutes.some(publicRoute => pathWithoutLocale.startsWith(publicRoute));

  if (isPublic) {
    return next();
  }

  const accessToken = cookies.get('sb-access-token');
  const refreshToken = cookies.get('sb-refresh-token');

  if (!accessToken || !refreshToken) {
    return redirect(`/${lang}/login`);
  }

  const { data, error } = await supabaseClient.auth.setSession({
    refresh_token: refreshToken.value,
    access_token: accessToken.value,
  });

  if (error || !data.session) {
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });
    return redirect(`/${lang}/login`);
  }

  context.locals.user = data.user;
  context.locals.session = data.session;

  return next();
});
