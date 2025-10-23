"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  userTheme?: string;
}

function isValidTheme(theme: string): theme is Theme {
  return ["light", "dark", "system"].includes(theme);
}

export function ThemeProvider({ children, userTheme }: ThemeProviderProps) {
  const defaultTheme: Theme = "system";
  const initialTheme: Theme = userTheme && isValidTheme(userTheme) ? userTheme : defaultTheme;
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    // Update theme when userTheme changes
    if (userTheme && isValidTheme(userTheme)) {
      setTheme(userTheme);
    }
  }, [userTheme]);

  useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    // Determine the actual theme to apply
    let appliedTheme: "light" | "dark";

    if (theme === "system") {
      appliedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      appliedTheme = theme;
    }

    // Apply the theme class
    root.classList.add(appliedTheme);

    // Store theme preference in localStorage for persistence
    localStorage.setItem("theme", theme);

    // Listen for system theme changes when theme is "system"
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove("light", "dark");
        root.classList.add(e.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  return <>{children}</>;
}
