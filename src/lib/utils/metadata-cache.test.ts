import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getCachedMetadata,
  setCachedMetadata,
  setBulkCachedMetadata,
  clearMetadataCache,
  cleanupExpiredEntries,
  getCacheStats,
} from "./metadata-cache";
import type { TourMetadata } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants/storage";

describe("metadata-cache", () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};

    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    } as Storage;

    // Mock Date.now for TTL tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const createMockMetadata = (overrides?: Partial<TourMetadata>): TourMetadata => ({
    title: "Sample Tour",
    description: "A great destination",
    image: "https://example.com/image.jpg",
    canonicalUrl: "https://example.com/tour",
    ...overrides,
  });

  describe("getCachedMetadata", () => {
    it("should return null when no cache exists", () => {
      const result = getCachedMetadata("tour-123");

      expect(result).toBeNull();
      expect(localStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.TOUR_METADATA_V1);
    });

    it("should return cached metadata when valid and not expired", () => {
      const mockMetadata = createMockMetadata();
      const now = Date.now();
      const cache = {
        "tour-123": {
          metadata: mockMetadata,
          cachedAt: now,
          expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours from now
        },
      };

      localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1] = JSON.stringify(cache);

      const result = getCachedMetadata("tour-123");

      expect(result).toEqual(mockMetadata);
    });

    it("should return null and remove entry when expired", () => {
      const mockMetadata = createMockMetadata();
      const now = Date.now();
      const cache = {
        "tour-123": {
          metadata: mockMetadata,
          cachedAt: now - 25 * 60 * 60 * 1000, // 25 hours ago
          expiresAt: now - 1 * 60 * 60 * 1000, // Expired 1 hour ago
        },
      };

      localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1] = JSON.stringify(cache);

      const result = getCachedMetadata("tour-123");

      expect(result).toBeNull();
      // Should save cache without the expired entry
      expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.TOUR_METADATA_V1, "{}");
    });

    it("should not affect other cached entries when removing expired one", () => {
      const mockMetadata1 = createMockMetadata({ title: "Tour 1" });
      const mockMetadata2 = createMockMetadata({ title: "Tour 2" });
      const now = Date.now();

      const cache = {
        "tour-123": {
          metadata: mockMetadata1,
          cachedAt: now - 25 * 60 * 60 * 1000,
          expiresAt: now - 1 * 60 * 60 * 1000, // Expired
        },
        "tour-456": {
          metadata: mockMetadata2,
          cachedAt: now,
          expiresAt: now + 24 * 60 * 60 * 1000, // Valid
        },
      };

      localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1] = JSON.stringify(cache);

      // Try to get expired entry
      const result1 = getCachedMetadata("tour-123");
      expect(result1).toBeNull();

      // Valid entry should still be accessible
      const result2 = getCachedMetadata("tour-456");
      expect(result2).toEqual(mockMetadata2);
    });

    it("should handle corrupted cache data gracefully", () => {
      localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1] = "invalid json{";

      const result = getCachedMetadata("tour-123");

      expect(result).toBeNull();
    });

    it("should handle missing tourId in cache", () => {
      const cache = {
        "tour-456": {
          metadata: createMockMetadata(),
          cachedAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        },
      };

      localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1] = JSON.stringify(cache);

      const result = getCachedMetadata("tour-123");

      expect(result).toBeNull();
    });
  });

  describe("setCachedMetadata", () => {
    it("should cache metadata with correct TTL", () => {
      const mockMetadata = createMockMetadata();
      const now = 1000000;
      vi.setSystemTime(now);

      setCachedMetadata("tour-123", mockMetadata);

      expect(localStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1]);

      expect(savedData["tour-123"]).toBeDefined();
      expect(savedData["tour-123"].metadata).toEqual(mockMetadata);
      expect(savedData["tour-123"].cachedAt).toBe(now);
      expect(savedData["tour-123"].expiresAt).toBe(now + 24 * 60 * 60 * 1000);
    });

    it("should overwrite existing cache entry for same tourId", () => {
      const metadata1 = createMockMetadata({ title: "Old Title" });
      const metadata2 = createMockMetadata({ title: "New Title" });

      setCachedMetadata("tour-123", metadata1);
      setCachedMetadata("tour-123", metadata2);

      const result = getCachedMetadata("tour-123");

      expect(result).toEqual(metadata2);
    });

    it("should preserve other cache entries when adding new one", () => {
      const metadata1 = createMockMetadata({ title: "Tour 1" });
      const metadata2 = createMockMetadata({ title: "Tour 2" });

      setCachedMetadata("tour-123", metadata1);
      setCachedMetadata("tour-456", metadata2);

      expect(getCachedMetadata("tour-123")).toEqual(metadata1);
      expect(getCachedMetadata("tour-456")).toEqual(metadata2);
    });

    it("should handle localStorage quota exceeded gracefully", () => {
      const mockMetadata = createMockMetadata();

      let saveCallCount = 0;
      // Mock quota exceeded error on first save attempt, succeed on retry
      vi.mocked(localStorage.setItem).mockImplementation((key, value) => {
        // The first call is from isLocalStorageAvailable check (with __test__ key)
        // Then we have actual save attempts with the cache key
        if (key === STORAGE_KEYS.TOUR_METADATA_V1) {
          saveCallCount++;
          if (saveCallCount === 1) {
            throw new DOMException("QuotaExceededError");
          }
        }
        localStorageMock[key] = value;
      });

      setCachedMetadata("tour-123", mockMetadata);

      // Should have attempted to save the cache key twice (once failed, once succeeded after cleanup)
      expect(saveCallCount).toBe(2);
    });

    it("should continue without caching if localStorage is unavailable", () => {
      // Mock localStorage being completely unavailable
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error("localStorage not available");
      });

      // Should not throw
      expect(() => setCachedMetadata("tour-123", createMockMetadata())).not.toThrow();
    });
  });

  describe("setBulkCachedMetadata", () => {
    it("should cache multiple entries at once", () => {
      const entries = [
        { tourId: "tour-1", metadata: createMockMetadata({ title: "Tour 1" }) },
        { tourId: "tour-2", metadata: createMockMetadata({ title: "Tour 2" }) },
        { tourId: "tour-3", metadata: createMockMetadata({ title: "Tour 3" }) },
      ];

      setBulkCachedMetadata(entries);

      expect(getCachedMetadata("tour-1")?.title).toBe("Tour 1");
      expect(getCachedMetadata("tour-2")?.title).toBe("Tour 2");
      expect(getCachedMetadata("tour-3")?.title).toBe("Tour 3");
    });

    it("should cache all entries with same timestamp", () => {
      const now = 1000000;
      vi.setSystemTime(now);

      const entries = [
        { tourId: "tour-1", metadata: createMockMetadata() },
        { tourId: "tour-2", metadata: createMockMetadata() },
      ];

      setBulkCachedMetadata(entries);

      const savedData = JSON.parse(localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1]);

      expect(savedData["tour-1"].cachedAt).toBe(now);
      expect(savedData["tour-2"].cachedAt).toBe(now);
    });

    it("should preserve existing entries not in bulk update", () => {
      const existing = createMockMetadata({ title: "Existing" });
      setCachedMetadata("tour-existing", existing);

      const entries = [{ tourId: "tour-new", metadata: createMockMetadata({ title: "New" }) }];

      setBulkCachedMetadata(entries);

      expect(getCachedMetadata("tour-existing")).toEqual(existing);
      expect(getCachedMetadata("tour-new")?.title).toBe("New");
    });

    it("should handle empty array", () => {
      setBulkCachedMetadata([]);

      const savedData = localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1];
      expect(savedData).toBeDefined();
    });
  });

  describe("cleanupExpiredEntries", () => {
    it("should remove all expired entries", () => {
      const now = Date.now();

      const cache = {
        "tour-1": {
          metadata: createMockMetadata(),
          cachedAt: now - 25 * 60 * 60 * 1000,
          expiresAt: now - 1 * 60 * 60 * 1000, // Expired
        },
        "tour-2": {
          metadata: createMockMetadata(),
          cachedAt: now - 25 * 60 * 60 * 1000,
          expiresAt: now - 2 * 60 * 60 * 1000, // Expired
        },
        "tour-3": {
          metadata: createMockMetadata(),
          cachedAt: now,
          expiresAt: now + 24 * 60 * 60 * 1000, // Valid
        },
      };

      localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1] = JSON.stringify(cache);

      cleanupExpiredEntries();

      const savedData = JSON.parse(localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1]);

      expect(savedData["tour-1"]).toBeUndefined();
      expect(savedData["tour-2"]).toBeUndefined();
      expect(savedData["tour-3"]).toBeDefined();
    });

    it("should not save if no entries were removed", () => {
      const now = Date.now();

      const cache = {
        "tour-1": {
          metadata: createMockMetadata(),
          cachedAt: now,
          expiresAt: now + 24 * 60 * 60 * 1000,
        },
      };

      const cacheJson = JSON.stringify(cache);
      localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1] = cacheJson;

      cleanupExpiredEntries();

      // Check that localStorage content didn't change (setItem was not called with new data)
      const finalCache = localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1];
      expect(finalCache).toBe(cacheJson);

      // Verify the cache still contains the valid entry
      const savedData = JSON.parse(finalCache);
      expect(savedData["tour-1"]).toBeDefined();
    });

    it("should handle empty cache", () => {
      localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1] = "{}";

      expect(() => cleanupExpiredEntries()).not.toThrow();
    });

    it("should handle corrupted cache gracefully", () => {
      localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1] = "invalid json";

      expect(() => cleanupExpiredEntries()).not.toThrow();
    });
  });

  describe("clearMetadataCache", () => {
    it("should remove cache from localStorage", () => {
      const cache = {
        "tour-1": {
          metadata: createMockMetadata(),
          cachedAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        },
      };

      localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1] = JSON.stringify(cache);

      clearMetadataCache();

      expect(localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.TOUR_METADATA_V1);
      expect(localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1]).toBeUndefined();
    });

    it("should handle already cleared cache", () => {
      expect(() => clearMetadataCache()).not.toThrow();
    });

    it("should handle localStorage errors gracefully", () => {
      vi.mocked(localStorage.removeItem).mockImplementationOnce(() => {
        throw new Error("localStorage error");
      });

      expect(() => clearMetadataCache()).not.toThrow();
    });
  });

  describe("getCacheStats", () => {
    it("should return correct stats for empty cache", () => {
      const stats = getCacheStats();

      expect(stats.totalEntries).toBe(0);
      expect(stats.expiredEntries).toBe(0);
      expect(stats.cacheSize).toBeGreaterThanOrEqual(0);
    });

    it("should count total entries correctly", () => {
      const now = Date.now();

      const cache = {
        "tour-1": {
          metadata: createMockMetadata(),
          cachedAt: now,
          expiresAt: now + 24 * 60 * 60 * 1000,
        },
        "tour-2": {
          metadata: createMockMetadata(),
          cachedAt: now,
          expiresAt: now + 24 * 60 * 60 * 1000,
        },
        "tour-3": {
          metadata: createMockMetadata(),
          cachedAt: now,
          expiresAt: now + 24 * 60 * 60 * 1000,
        },
      };

      localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1] = JSON.stringify(cache);

      const stats = getCacheStats();

      expect(stats.totalEntries).toBe(3);
      expect(stats.expiredEntries).toBe(0);
    });

    it("should count expired entries correctly", () => {
      const now = Date.now();

      const cache = {
        "tour-1": {
          metadata: createMockMetadata(),
          cachedAt: now - 25 * 60 * 60 * 1000,
          expiresAt: now - 1 * 60 * 60 * 1000, // Expired
        },
        "tour-2": {
          metadata: createMockMetadata(),
          cachedAt: now - 25 * 60 * 60 * 1000,
          expiresAt: now - 2 * 60 * 60 * 1000, // Expired
        },
        "tour-3": {
          metadata: createMockMetadata(),
          cachedAt: now,
          expiresAt: now + 24 * 60 * 60 * 1000, // Valid
        },
      };

      localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1] = JSON.stringify(cache);

      const stats = getCacheStats();

      expect(stats.totalEntries).toBe(3);
      expect(stats.expiredEntries).toBe(2);
    });

    it("should calculate cache size", () => {
      const cache = {
        "tour-1": {
          metadata: createMockMetadata(),
          cachedAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        },
      };

      localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1] = JSON.stringify(cache);

      const stats = getCacheStats();

      expect(stats.cacheSize).toBeGreaterThan(0);
    });

    it("should handle corrupted cache", () => {
      localStorageMock[STORAGE_KEYS.TOUR_METADATA_V1] = "invalid json";

      const stats = getCacheStats();

      expect(stats.totalEntries).toBe(0);
      expect(stats.expiredEntries).toBe(0);
    });
  });

  describe("localStorage availability", () => {
    it("should handle localStorage being unavailable on setItem", () => {
      vi.mocked(localStorage.setItem).mockImplementationOnce(() => {
        throw new Error("localStorage not available");
      });

      expect(() => setCachedMetadata("tour-123", createMockMetadata())).not.toThrow();
    });

    it("should handle localStorage being unavailable on getItem", () => {
      vi.mocked(localStorage.getItem).mockImplementationOnce(() => {
        throw new Error("localStorage not available");
      });

      const result = getCachedMetadata("tour-123");

      expect(result).toBeNull();
    });

    it("should handle localStorage being unavailable on removeItem", () => {
      vi.mocked(localStorage.removeItem).mockImplementationOnce(() => {
        throw new Error("localStorage not available");
      });

      expect(() => clearMetadataCache()).not.toThrow();
    });
  });
});
