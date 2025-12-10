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
 * Storage operation error types categorized by failure reason.
 */
export type StorageErrorType =
  | "unavailable" // SSR, privacy mode, localStorage disabled
  | "quota_exceeded" // Storage quota limit reached
  | "serialization_error" // JSON.stringify/parse failed
  | "unknown"; // Unexpected errors

/**
 * Detailed error information for storage operations.
 */
export interface StorageError {
  type: StorageErrorType;
  message: string;
  originalError?: unknown; // For debugging in dev mode
}

/**
 * Result object for storage write operations.
 * Follows codebase pattern similar to EmailParseResult.
 */
export interface StorageWriteResult {
  success: boolean;
  error?: StorageError;
}

/**
 * Result object for storage read operations.
 * Generic type ensures type safety for returned values.
 */
export interface StorageReadResult<T> {
  success: boolean;
  value: T | null;
  error?: StorageError;
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
 * Get item from localStorage with type safety and detailed error reporting.
 *
 * @param key - Storage key from STORAGE_KEYS constant
 * @returns Result object with success status, value, and optional error details
 *
 * @example
 * const result = getStorageItem(STORAGE_KEYS.THEME);
 * if (result.success && result.value !== null) {
 *   console.log('Theme:', result.value);
 * }
 */
export function getStorageItem<K extends StorageKey>(
  key: K
): StorageReadResult<StorageValueTypes[K]> {
  try {
    if (!isStorageAvailable()) {
      return {
        success: false,
        value: null,
        error: {
          type: "unavailable",
          message: "localStorage is not available",
        },
      };
    }

    const item = localStorage.getItem(key);
    if (item === null) {
      return { success: true, value: null }; // Not an error, just missing
    }

    // Parse based on key type
    let parsed: StorageValueTypes[K];
    try {
      // Handle boolean values (stored as "true" or "false" strings)
      if (key === STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION) {
        parsed = (item === "true") as StorageValueTypes[K];
      }
      // Handle JSON values (tour metadata cache)
      else if (key === STORAGE_KEYS.TOUR_METADATA_V1) {
        parsed = JSON.parse(item) as StorageValueTypes[K];
      }
      // Handle string values (theme)
      else {
        parsed = item as StorageValueTypes[K];
      }
    } catch (parseError) {
      logStorageError("getItem (parsing)", key, parseError);
      return {
        success: false,
        value: null,
        error: {
          type: "serialization_error",
          message: "Failed to parse stored value",
          originalError: import.meta.env.DEV ? parseError : undefined,
        },
      };
    }

    return { success: true, value: parsed };
  } catch (error) {
    logStorageError("getItem", key, error);
    return {
      success: false,
      value: null,
      error: {
        type: "unknown",
        message: "Failed to read from localStorage",
        originalError: import.meta.env.DEV ? error : undefined,
      },
    };
  }
}

/**
 * Set item in localStorage with type safety and detailed error reporting.
 *
 * @param key - Storage key from STORAGE_KEYS constant
 * @param value - Typed value to store
 * @returns Result object with success status and optional error details
 *
 * @example
 * const result = setStorageItem(STORAGE_KEYS.THEME, "dark");
 * if (!result.success) {
 *   console.error('Storage failed:', result.error?.type);
 * }
 */
export function setStorageItem<K extends StorageKey>(
  key: K,
  value: StorageValueTypes[K]
): StorageWriteResult {
  try {
    // Check storage availability first
    if (!isStorageAvailable()) {
      return {
        success: false,
        error: {
          type: "unavailable",
          message: "localStorage is not available (SSR or privacy mode)",
        },
      };
    }

    // Serialize value based on type
    let serialized: string;
    try {
      if (typeof value === "boolean") {
        serialized = String(value);
      } else if (typeof value === "string") {
        serialized = value;
      } else {
        // Objects/arrays - JSON serialize
        serialized = JSON.stringify(value);
      }
    } catch (serializationError) {
      logStorageError("setItem (serialization)", key, serializationError);
      return {
        success: false,
        error: {
          type: "serialization_error",
          message: "Failed to serialize value for storage",
          originalError: import.meta.env.DEV ? serializationError : undefined,
        },
      };
    }

    // Attempt to set item
    localStorage.setItem(key, serialized);
    return { success: true };
  } catch (error) {
    // Detect quota exceeded error (DOMException with specific name/code)
    const isQuotaError =
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" || error.code === 22);

    if (isQuotaError) {
      logStorageError("setItem (quota exceeded)", key, error);
      return {
        success: false,
        error: {
          type: "quota_exceeded",
          message: "Storage quota exceeded. Try clearing old data.",
          originalError: import.meta.env.DEV ? error : undefined,
        },
      };
    }

    // Generic error fallback
    logStorageError("setItem", key, error);
    return {
      success: false,
      error: {
        type: "unknown",
        message: "Failed to save to localStorage",
        originalError: import.meta.env.DEV ? error : undefined,
      },
    };
  }
}

/**
 * Remove item from localStorage with detailed error reporting.
 *
 * @param key - Storage key to remove
 * @returns Result object with success status and optional error details
 *
 * @example
 * const result = removeStorageItem(STORAGE_KEYS.THEME);
 * if (!result.success) {
 *   console.error('Failed to remove:', result.error?.type);
 * }
 */
export function removeStorageItem(key: StorageKey): StorageWriteResult {
  try {
    if (!isStorageAvailable()) {
      return {
        success: false,
        error: {
          type: "unavailable",
          message: "localStorage is not available",
        },
      };
    }

    localStorage.removeItem(key);
    return { success: true };
  } catch (error) {
    logStorageError("removeItem", key, error);
    return {
      success: false,
      error: {
        type: "unknown",
        message: "Failed to remove from localStorage",
        originalError: import.meta.env.DEV ? error : undefined,
      },
    };
  }
}

/**
 * Clear all application storage with detailed error reporting.
 * WARNING: This removes ALL items from localStorage, not just app-specific keys.
 *
 * @returns Result object with success status and optional error details
 *
 * @example
 * const result = clearStorage();
 * if (!result.success) {
 *   console.error('Failed to clear storage:', result.error?.type);
 * }
 */
export function clearStorage(): StorageWriteResult {
  try {
    if (!isStorageAvailable()) {
      return {
        success: false,
        error: {
          type: "unavailable",
          message: "localStorage is not available",
        },
      };
    }

    localStorage.clear();
    return { success: true };
  } catch (error) {
    logStorageError("clear", "all", error);
    return {
      success: false,
      error: {
        type: "unknown",
        message: "Failed to clear localStorage",
        originalError: import.meta.env.DEV ? error : undefined,
      },
    };
  }
}
