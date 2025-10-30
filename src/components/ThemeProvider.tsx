import { useEffect } from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
  userTheme?: string;
}

/**
 * ThemeProvider component
 *
 * Note: Theme switching is handled by the theme-change library.
 * This component only applies user's saved theme preference from the database on initial load.
 * The theme-change library handles all theme switching and localStorage persistence.
 */
export function ThemeProvider({ children, userTheme }: ThemeProviderProps) {
  useEffect(() => {
    // Apply user's saved theme from database if it exists and no theme is stored locally
    if (userTheme) {
      const storedTheme = localStorage.getItem("theme");
      if (!storedTheme) {
        // Only set from userTheme if no local preference exists
        localStorage.setItem("theme", userTheme);
        document.documentElement.setAttribute("data-theme", userTheme);
      }
    }
  }, [userTheme]);

  return <>{children}</>;
}
