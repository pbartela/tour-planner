import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use happy-dom for faster DOM simulation (alternative: jsdom)
    environment: "happy-dom",

    // Enable global test APIs (describe, it, expect, etc.)
    globals: true,

    // Setup files to run before tests
    setupFiles: ["./tests/setup.ts"],

    // Include source files for coverage
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],

    // Exclude patterns
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/tests/e2e/**", // Exclude Playwright E2E tests
    ],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "**/*.config.{js,ts}",
        "**/node_modules/**",
        "**/dist/**",
        "**/.astro/**",
        "**/tests/**",
        "**/*.d.ts",
        "**/*.stories.{js,ts,jsx,tsx}",
        "**/types.ts",
      ],
      // Thresholds
      thresholds: {
        statements: 70,
        branches: 69,
        functions: 70,
        lines: 70,
      },
    },

    // Test timeout
    testTimeout: 10000,

    // Hooks timeout
    hookTimeout: 10000,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "astro:transitions/client": path.resolve(__dirname, "./tests/mocks/astro-transitions.ts"),
    },
  },
});
