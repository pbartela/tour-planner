// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

import reactI18next from "astro-react-i18next";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [
    react(),
    sitemap(),
    reactI18next({
      defaultLocale: "en-US",
      locales: ["en-US", "pl-PL"],
      namespaces: ["auth", "tours"],
      defaultNamespace: "auth",
    }),
  ],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: node({
    mode: "standalone",
  }),
  experimental: {
    chromeDevtoolsWorkspace: true,
  },
});
