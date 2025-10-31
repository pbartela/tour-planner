const config = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      maxWidth: {
        "container-sm": "500px",
        "container-md": "540px",
      },
      minHeight: {
        "screen-60": "60vh",
      },
      maxHeight: {
        "screen-90": "90vh",
      },
      fontSize: {
        "4.5xl": "32px",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("@tailwindcss/typography")],
};

export default config;
