/**
 * Date formatting service
 * Handles locale-specific date formatting and format hints
 */
export class DateFormatterService {
  private locale: string;

  constructor(locale: string) {
    this.locale = locale;
  }

  /**
   * Format date with consistent slash separators
   * - en-US: MM/DD/YYYY (12/25/2025)
   * - All others: DD/MM/YYYY (25/12/2025)
   */
  format(date: Date | undefined): string {
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    // US locale uses MM/DD/YYYY format
    if (this.isUSLocale()) {
      return `${month}/${day}/${year}`;
    }

    // All other locales use DD/MM/YYYY format
    return `${day}/${month}/${year}`;
  }

  /**
   * Get the date format pattern for the current locale
   * Returns the format string that shows the expected date pattern
   */
  getFormatHint(): string {
    return this.isUSLocale() ? "MM/DD/YYYY" : "DD/MM/YYYY";
  }

  /**
   * Check if locale is US-based
   */
  private isUSLocale(): boolean {
    return this.locale.startsWith("en-US") || this.locale === "en";
  }
}

/**
 * Get the date format pattern for a given locale
 * Standalone function for backward compatibility
 */
export const getDateFormatHint = (locale: string): string => {
  const formatter = new DateFormatterService(locale);
  return formatter.getFormatHint();
};

/**
 * Format date by locale
 * Standalone function for backward compatibility
 */
export const formatDateByLocale = (date: Date | undefined, locale: string): string => {
  const formatter = new DateFormatterService(locale);
  return formatter.format(date);
};
