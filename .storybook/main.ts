import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-onboarding", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    const tailwindcss = await import("@tailwindcss/vite").then((m) => m.default);
    return mergeConfig(config, {
      plugins: [
        tsconfigPaths({
          projects: ["./tsconfig.json"],
        }),
        tailwindcss({
          css: ["src/styles/global.css"],
        }),
      ],
    });
  },
};
export default config;
