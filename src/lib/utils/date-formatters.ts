import { formatDateByLocale } from "@/lib/services/date-formatter.service";

/**
 * Format a date string to locale-aware date format
 * @param dateString - ISO date string
 * @param locale - Optional locale (defaults to browser locale)
 * @returns Formatted date string
 */
export const formatDate = (dateString: string, locale?: string): string => {
  const effectiveLocale = locale || (typeof navigator !== "undefined" ? navigator.language : "en-US");
  return formatDateByLocale(new Date(dateString), effectiveLocale);
};

/**
 * Calculate days until a date
 * @param dateString - ISO date string
 * @returns Number of days (can be negative if date is in the past)
 */
export const getDaysUntil = (dateString: string): number => {
  const now = new Date();
  const targetDate = new Date(dateString);
  const diffTime = targetDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calculate days until expiration
 * Alias for getDaysUntil with more specific naming
 */
export const getDaysUntilExpiration = (expiresAt: string): number => {
  return getDaysUntil(expiresAt);
};

/**
 * Check if a date is in the past
 * @param dateString - ISO date string
 * @returns True if date is in the past
 */
export const isPastDate = (dateString: string): boolean => {
  return new Date(dateString) < new Date();
};

/**
 * Format expiration message based on days remaining
 * @param expiresAt - ISO date string
 * @param t - Translation function
 * @returns Localized expiration message
 */
export const formatExpirationMessage = (
  expiresAt: string,
  t: (key: string, options?: Record<string, unknown>) => string
): string => {
  const days = getDaysUntilExpiration(expiresAt);

  if (days <= 0) {
    return t("invitations.expiresToday");
  } else if (days === 1) {
    return t("invitations.expiresInOneDay");
  } else {
    return t("invitations.expiresIn", { days });
  }
};
