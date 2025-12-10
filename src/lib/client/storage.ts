import { STORAGE_KEYS, type StorageKey } from "@/lib/constants/storage";

/**
 * Type-safe localStorage wrapper with error handling.
 * Provides safe access to localStorage with SSR compatibility and graceful degradation.
 *
 * Features:
 * - Full TypeScript type safety for values
 * - SSR safety (typeof window check)
 * - Error handling with graceful fallbacks
 * - Automatic type conversion (boolean, JSON, string)
 * - Privacy mode / quota exceeded handling
 */

/**
 * Cached metadata structure for tour metadata cache
 * (re-exported from metadata-cache.ts types)
 */
export interface TourMetadataCache {
  [tourId: string]: {
    metadata: unknown; // TourMetadata type from @/types
    cachedAt: number;
    expiresAt: number;
  };
}

/**
 * Storage value types for each key.
 * Maps each STORAGE_KEYS constant to its expected value type.
 */
interface StorageValueTypes {
  [STORAGE_KEYS.THEME]: string;
  [STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION]: boolean;
  [STORAGE_KEYS.TOUR_METADATA_V1]: TourMetadataCache;
}

/**
 * Logs storage errors to console in development for debugging.
 * Silent in production to avoid exposing implementation details.
 */
const logStorageError = (operation: string, key: string, error: unknown): void => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(`[Storage] ${operation} failed for key "${key}":`, error);
  }
};

/**
 * Check if localStorage is available and usable.
 * Handles SSR, privacy mode, and disabled localStorage scenarios.
 *
 * @returns true if localStorage is available and usable
 */
export function isStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined") {
      return false; // SSR environment
    }

    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false; // Privacy mode or localStorage disabled
  }
}

/**
 * Get item from localStorage with type safety.
 *
 * @param key - Storage key from STORAGE_KEYS constant
 * @returns Typed value or null if not found or error occurred
 *
 * @example
 * const theme = getStorageItem(STORAGE_KEYS.THEME); // string | null
 * const skipConfirm = getStorageItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION); // boolean | null
 */
export function getStorageItem<K extends StorageKey>(
  key: K
): StorageValueTypes[K] | null {
  try {
    if (!isStorageAvailable()) {
      return null;
    }

    const item = localStorage.getItem(key);
    if (item === null) {
      return null;
    }

    // Handle boolean values (stored as "true" or "false" strings)
    if (key === STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION) {
      return (item === "true") as StorageValueTypes[K];
    }

    // Handle JSON values (tour metadata cache)
    if (key === STORAGE_KEYS.TOUR_METADATA_V1) {
      return JSON.parse(item) as StorageValueTypes[K];
    }

    // Handle string values (theme)
    return item as StorageValueTypes[K];
  } catch (error) {
    logStorageError("getItem", key, error);
    return null;
  }
}

/**
 * Set item in localStorage with type safety.
 *
 * @param key - Storage key from STORAGE_KEYS constant
 * @param value - Typed value to store
 * @returns true if successful, false if error occurred
 *
 * @example
 * setStorageItem(STORAGE_KEYS.THEME, "dark"); // OK
 * setStorageItem(STORAGE_KEYS.THEME, 123); // TypeScript error
 * setStorageItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION, true); // OK
 */
export function setStorageItem<K extends StorageKey>(
  key: K,
  value: StorageValueTypes[K]
): boolean {
  try {
    if (!isStorageAvailable()) {
      return false;
    }

    // Handle different value types
    if (typeof value === "boolean") {
      localStorage.setItem(key, String(value));
    } else if (typeof value === "string") {
      localStorage.setItem(key, value);
    } else {
      // Objects/arrays - JSON serialize
      localStorage.setItem(key, JSON.stringify(value));
    }

    return true;
  } catch (error) {
    logStorageError("setItem", key, error);
    return false;
  }
}

/**
 * Remove item from localStorage.
 *
 * @param key - Storage key to remove
 * @returns true if successful, false if error occurred
 *
 * @example
 * removeStorageItem(STORAGE_KEYS.THEME);
 */
export function removeStorageItem(key: StorageKey): boolean {
  try {
    if (!isStorageAvailable()) {
      return false;
    }

    localStorage.removeItem(key);
    return true;
  } catch (error) {
    logStorageError("removeItem", key, error);
    return false;
  }
}

/**
 * Clear all application storage.
 * WARNING: This removes ALL items from localStorage, not just app-specific keys.
 *
 * @returns true if successful, false if error occurred
 */
export function clearStorage(): boolean {
  try {
    if (!isStorageAvailable()) {
      return false;
    }

    localStorage.clear();
    return true;
  } catch (error) {
    logStorageError("clear", "all", error);
    return false;
  }
}
