// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

import reactI18next from "astro-react-i18next";

// https://astro.build/config
export default defineConfig({
  output: "server",
  // Environment variable validation - validates at build time
  env: {
    schema: {
      // Public environment variables (accessible on client)
      PUBLIC_SUPABASE_URL: envField.string({
        context: "client",
        access: "public",
      }),
      PUBLIC_SUPABASE_ANON_KEY: envField.string({
        context: "client",
        access: "public",
      }),
      PUBLIC_DEFAULT_LOCALE: envField.string({
        context: "client",
        access: "public",
        default: "en-US",
      }),
      // Server-only environment variables (never exposed to client)
      SUPABASE_SERVICE_ROLE_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      SUPABASE_WEBHOOK_SECRET: envField.string({
        context: "server",
        access: "secret",
      }),
      OPENROUTER_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true, // Mark as optional if not always needed
      }),
    },
  },
  integrations: [
    react(),
    sitemap(),
    reactI18next({
      defaultLocale: process.env.PUBLIC_DEFAULT_LOCALE || "en-US",
      locales: ["en-US", "pl-PL"],
      namespaces: ["auth", "tours"],
      defaultNamespace: "auth",
    }),
  ],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    build: {
      sourcemap: true,
    },
    server: {
      middlewareMode: false,
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  },
  adapter: node({
    mode: "standalone",
  }),
  experimental: {
    chromeDevtoolsWorkspace: true,
  },
});
