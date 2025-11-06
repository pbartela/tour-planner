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
  // Environment variable validation - validates at build time and runtime
  env: {
    schema: {
      // Public environment variables (accessible on client)
      PUBLIC_SUPABASE_URL: envField.string({
        context: "client",
        access: "public",
        url: true, // Validates that it's a valid URL
      }),
      PUBLIC_SUPABASE_ANON_KEY: envField.string({
        context: "client",
        access: "public",
        min: 1, // Ensures non-empty
      }),
      PUBLIC_DEFAULT_LOCALE: envField.string({
        context: "client",
        access: "public",
        default: "en-US",
      }),
      // Server-only environment variables (never exposed to client)
      SUPABASE_URL: envField.string({
        context: "server",
        access: "secret",
        url: true, // Validates that it's a valid URL
      }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({
        context: "server",
        access: "secret",
        min: 1, // Ensures non-empty
      }),
      OPENROUTER_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true, // Mark as optional if not always needed
      }),
    },
    // Validate environment variables at both build time and runtime
    validateSecrets: true,
  },
  integrations: [
    react(),
    sitemap(),
    reactI18next({
      defaultLocale: "en-US", // Default locale (validated at runtime via env-validation.service)
      locales: ["en-US", "pl-PL"],
      namespaces: ["common", "auth", "tours"],
      defaultNamespace: "common",
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
      // Allow Docker container hostname for E2E tests
      host: true,
      strictPort: false,
      allowedHosts: [".localhost", "localhost", "app", "app.test"],
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
