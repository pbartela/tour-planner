"use client";

import { useEffect, useState } from "react";

// DaisyUI themes - expanded list
const daisyUIThemes = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
] as const;

type DaisyUITheme = (typeof daisyUIThemes)[number];

type Theme = DaisyUITheme | "system";

const DEFAULT_THEME: Theme = "light";
const validThemes: readonly Theme[] = [...daisyUIThemes, "system"];

interface ThemeProviderProps {
  children: React.ReactNode;
  userTheme?: string;
}

function isValidTheme(theme: string): theme is Theme {
  return validThemes.includes(theme as Theme);
}

export function ThemeProvider({ children, userTheme }: ThemeProviderProps) {
  const initialTheme: Theme = userTheme && isValidTheme(userTheme) ? userTheme : DEFAULT_THEME;
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    // Update theme when userTheme changes
    if (userTheme && isValidTheme(userTheme)) {
      setTheme(userTheme);
    }
  }, [userTheme]);

  useEffect(() => {
    const root = document.documentElement;

    // Determine the actual theme to apply
    let appliedTheme: string;

    if (theme === "system") {
      // For system theme, check if user prefers dark mode and apply dark, otherwise default
      appliedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      appliedTheme = theme;
    }

    // Apply the theme using data-theme attribute (DaisyUI way)
    root.setAttribute("data-theme", appliedTheme);

    // Also maintain backward compatibility with CSS classes for any existing code
    root.classList.remove(...daisyUIThemes);
    if (appliedTheme === "light" || appliedTheme === "dark") {
      root.classList.add(appliedTheme);
    }

    // Store theme preference in localStorage for persistence
    localStorage.setItem("theme", theme);

    // Listen for system theme changes when theme is "system"
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? "dark" : "light";
        root.setAttribute("data-theme", newTheme);
        root.classList.remove("light", "dark");
        if (newTheme === "dark" || newTheme === "light") {
          root.classList.add(newTheme);
        }
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  return <>{children}</>;
}
