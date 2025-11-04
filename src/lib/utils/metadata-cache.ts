import type { TourMetadata } from "@/types";

/**
 * Metadata cache utilities for browser localStorage.
 * Caches tour metadata with TTL to prevent re-downloading on page refresh.
 * Fully compliant with privacy laws - only caches public metadata, no user data.
 */

/**
 * Logs cache errors to console in development for debugging.
 * Silent in production to avoid exposing implementation details.
 */
const logCacheError = (operation: string, error: unknown): void => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(`[MetadataCache] ${operation} failed:`, error);
  }
};

const CACHE_KEY = "tour_metadata_v1";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CachedMetadata {
  metadata: TourMetadata;
  cachedAt: number;
  expiresAt: number;
}

type MetadataCache = Record<string, CachedMetadata>;

/**
 * Checks if localStorage is available and usable
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = "__test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    logCacheError("localStorage availability check", error);
    return false;
  }
};

/**
 * Loads the metadata cache from localStorage
 */
const loadCache = (): MetadataCache => {
  if (!isLocalStorageAvailable()) {
    return {};
  }

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return {};
    }

    const cache: MetadataCache = JSON.parse(cached);
    return cache;
  } catch (error) {
    logCacheError("Cache loading", error);
    return {};
  }
};

/**
 * Saves the metadata cache to localStorage
 */
const saveCache = (cache: MetadataCache): void => {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    logCacheError("Cache saving (attempting cleanup)", error);
    // Handle quota exceeded or other errors
    // Try to clear old entries and retry
    cleanupExpiredEntries();
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (retryError) {
      logCacheError("Cache saving (after cleanup retry)", retryError);
      // If still fails, continue without caching
    }
  }
};

/**
 * Removes expired entries from the cache
 */
export const cleanupExpiredEntries = (): void => {
  const cache = loadCache();
  const now = Date.now();
  const validEntries: MetadataCache = {};

  for (const tourId in cache) {
    if (cache[tourId].expiresAt >= now) {
      validEntries[tourId] = cache[tourId];
    }
  }

  // Only save if we removed entries
  if (Object.keys(validEntries).length !== Object.keys(cache).length) {
    saveCache(validEntries);
  }
};

/**
 * Gets cached metadata for a tour if available and not expired
 */
export const getCachedMetadata = (tourId: string): TourMetadata | null => {
  const cache = loadCache();
  const entry = cache[tourId];

  if (!entry) {
    return null;
  }

  // Check if expired
  if (entry.expiresAt < Date.now()) {
    // Remove expired entry by creating a new object without it
    const { [tourId]: _removed, ...remaining } = cache;
    saveCache(remaining);
    return null;
  }

  return entry.metadata;
};

/**
 * Caches metadata for a tour with TTL
 */
export const setCachedMetadata = (tourId: string, metadata: TourMetadata): void => {
  const cache = loadCache();
  const now = Date.now();

  cache[tourId] = {
    metadata,
    cachedAt: now,
    expiresAt: now + CACHE_TTL,
  };

  saveCache(cache);
};

/**
 * Caches metadata for multiple tours at once
 */
export const setBulkCachedMetadata = (entries: { tourId: string; metadata: TourMetadata }[]): void => {
  const cache = loadCache();
  const now = Date.now();

  for (const { tourId, metadata } of entries) {
    cache[tourId] = {
      metadata,
      cachedAt: now,
      expiresAt: now + CACHE_TTL,
    };
  }

  saveCache(cache);
};

/**
 * Clears all cached metadata
 */
export const clearMetadataCache = (): void => {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    logCacheError("Cache clearing", error);
  }
};

/**
 * Gets cache statistics
 */
export const getCacheStats = (): { totalEntries: number; expiredEntries: number; cacheSize: number } => {
  const cache = loadCache();
  const now = Date.now();
  let expiredCount = 0;

  for (const tourId in cache) {
    if (cache[tourId].expiresAt < now) {
      expiredCount++;
    }
  }

  const cacheSize = isLocalStorageAvailable() ? new Blob([localStorage.getItem(CACHE_KEY) || ""]).size : 0;

  return {
    totalEntries: Object.keys(cache).length,
    expiredEntries: expiredCount,
    cacheSize,
  };
};
