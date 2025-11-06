// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import eslintPluginAstro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import pluginReact from "eslint-plugin-react";
import reactCompiler from "eslint-plugin-react-compiler";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

const baseConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  ignores: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/*.test.skip.{ts,tsx}"],
  extends: [eslint.configs.recommended, tseslint.configs.strict, tseslint.configs.stylistic],
  rules: {
    "no-console": "warn",
    "no-unused-vars": "off",
    // Allow unused variables that start with underscore (e.g., _error, _unused)
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
  },
});

// Test files configuration - relaxed rules for tests
const testConfig = tseslint.config({
  files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
  extends: [eslint.configs.recommended, tseslint.configs.recommended],
  languageOptions: {
    parser: tseslint.parser,
  },
  rules: {
    "no-console": "off",
    "no-undef": "off",
    "no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-call": "off",
  },
});

const jsxA11yConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  ignores: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
  extends: [jsxA11y.flatConfigs.recommended],
  languageOptions: {
    ...jsxA11y.flatConfigs.recommended.languageOptions,
  },
  rules: {
    ...jsxA11y.flatConfigs.recommended.rules,
  },
});

const reactConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  ignores: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
  extends: [pluginReact.configs.flat.recommended],
  languageOptions: {
    ...pluginReact.configs.flat.recommended.languageOptions,
    globals: {
      window: true,
      document: true,
    },
  },
  plugins: {
    "react-hooks": eslintPluginReactHooks,
    "react-compiler": reactCompiler,
  },
  settings: { react: { version: "detect" } },
  rules: {
    ...eslintPluginReactHooks.configs.recommended.rules,
    "react/react-in-jsx-scope": "off",
    "react-compiler/react-compiler": "error",
    // Disable prop-types for TypeScript files since TypeScript provides type checking
    "react/prop-types": "off",
  },
});

// Server-side files where console statements are acceptable for logging
const serverConfig = tseslint.config({
  files: ["src/lib/server/**/*.ts", "src/lib/services/**/*.ts", "src/middleware/**/*.ts", "src/pages/api/**/*.ts"],
  rules: {
    // Allow console statements in server-side code for logging
    "no-console": "off",
  },
});

// Test files have their own configuration with relaxed rules

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  // Explicitly ignore test files at the top level
  {
    ignores: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/*.test.skip.{ts,tsx}"],
  },
  baseConfig,
  testConfig,
  jsxA11yConfig,
  reactConfig,
  serverConfig,
  eslintPluginAstro.configs["flat/recommended"],
  eslintPluginPrettier,
  storybook.configs["flat/recommended"]
);
