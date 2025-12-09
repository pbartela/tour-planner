/**
 * Browser storage keys for localStorage and sessionStorage.
 * Centralizes all storage keys to avoid magic strings and typos.
 */

/**
 * localStorage keys used throughout the application
 */
export const STORAGE_KEYS = {
  /** User's theme preference (DaisyUI theme name) */
  THEME: "theme",
  /** Skip invitation confirmation dialog preference */
  INVITATION_SKIP_CONFIRMATION: "invitation-skip-confirmation",
  /** Tour metadata cache with version (used in metadata-cache.ts) */
  TOUR_METADATA_V1: "tour_metadata_v1",
} as const;

/**
 * Type-safe access to storage keys
 */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
