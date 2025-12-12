import { useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/constants/storage";
import { getStorageItem, setStorageItem } from "@/lib/client/storage";
import { notifyStorageError } from "@/lib/client/storage-notifications";

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
      const storedResult = getStorageItem(STORAGE_KEYS.THEME);
      if (!storedResult.value) {
        // Only set from userTheme if no local preference exists
        const setResult = setStorageItem(STORAGE_KEYS.THEME, userTheme);
        if (!setResult.success && setResult.error) {
          notifyStorageError(setResult.error, "theme preference");
        }
        document.documentElement.setAttribute("data-theme", userTheme);
      }
    }
  }, [userTheme]);

  return <>{children}</>;
}
