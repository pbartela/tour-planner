/**
 * Time duration constants to avoid magic numbers throughout the codebase.
 * All values are in their respective units as indicated.
 */

// Milliseconds
export const MILLISECONDS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

// Seconds
export const SECONDS = {
  MINUTE: 60,
  HOUR: 60 * 60,
  DAY: 24 * 60 * 60,
  WEEK: 7 * 24 * 60 * 60,
  YEAR: 365 * 24 * 60 * 60,
} as const;

// Convenience functions for common durations
export const minutes = (n: number): number => n * MILLISECONDS.MINUTE;
export const hours = (n: number): number => n * MILLISECONDS.HOUR;
export const days = (n: number): number => n * MILLISECONDS.DAY;
export const weeks = (n: number): number => n * MILLISECONDS.WEEK;

export const minutesInSeconds = (n: number): number => n * SECONDS.MINUTE;
export const hoursInSeconds = (n: number): number => n * SECONDS.HOUR;
export const daysInSeconds = (n: number): number => n * SECONDS.DAY;
export const weeksInSeconds = (n: number): number => n * SECONDS.WEEK;
export const yearsInSeconds = (n: number): number => n * SECONDS.YEAR;
