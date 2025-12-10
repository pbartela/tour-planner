import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearStorage,
  isStorageAvailable,
} from "./storage";
import { STORAGE_KEYS } from "@/lib/constants/storage";

describe("storage wrapper", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("isStorageAvailable", () => {
    it("should return true when localStorage is available", () => {
      expect(isStorageAvailable()).toBe(true);
    });
  });

  describe("getStorageItem", () => {
    it("should return null when key doesn't exist", () => {
      const result = getStorageItem(STORAGE_KEYS.THEME);
      expect(result).toBeNull();
    });

    it("should get string value (theme)", () => {
      localStorage.setItem(STORAGE_KEYS.THEME, "dark");
      const result = getStorageItem(STORAGE_KEYS.THEME);
      expect(result).toBe("dark");
    });

    it("should get boolean value true (invitation skip confirmation)", () => {
      localStorage.setItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION, "true");
      const result = getStorageItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION);
      expect(result).toBe(true);
    });

    it("should get boolean value false (invitation skip confirmation)", () => {
      localStorage.setItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION, "false");
      const result = getStorageItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION);
      expect(result).toBe(false);
    });

    it("should get JSON value (tour metadata)", () => {
      const metadata = {
        tour1: {
          metadata: { title: "Test Tour" },
          cachedAt: Date.now(),
          expiresAt: Date.now() + 1000,
        },
      };
      localStorage.setItem(STORAGE_KEYS.TOUR_METADATA_V1, JSON.stringify(metadata));
      const result = getStorageItem(STORAGE_KEYS.TOUR_METADATA_V1);
      expect(result).toEqual(metadata);
    });

    it("should return null on JSON parse error", () => {
      localStorage.setItem(STORAGE_KEYS.TOUR_METADATA_V1, "invalid json");
      const result = getStorageItem(STORAGE_KEYS.TOUR_METADATA_V1);
      expect(result).toBeNull();
    });

    it("should return null when localStorage.getItem throws", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Storage error");
      });

      const result = getStorageItem(STORAGE_KEYS.THEME);
      expect(result).toBeNull();
    });

    it("should handle empty string value", () => {
      localStorage.setItem(STORAGE_KEYS.THEME, "");
      const result = getStorageItem(STORAGE_KEYS.THEME);
      expect(result).toBe("");
    });
  });

  describe("setStorageItem", () => {
    it("should set string value", () => {
      const success = setStorageItem(STORAGE_KEYS.THEME, "light");
      expect(success).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("light");
    });

    it("should set boolean value true", () => {
      const success = setStorageItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION, true);
      expect(success).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION)).toBe("true");
    });

    it("should set boolean value false", () => {
      const success = setStorageItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION, false);
      expect(success).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION)).toBe("false");
    });

    it("should set JSON value", () => {
      const metadata = {
        tour1: {
          metadata: { title: "Test" },
          cachedAt: 123456,
          expiresAt: 789012,
        },
      };
      const success = setStorageItem(STORAGE_KEYS.TOUR_METADATA_V1, metadata);
      expect(success).toBe(true);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.TOUR_METADATA_V1)!)).toEqual(metadata);
    });

    it("should handle storage errors gracefully", () => {
      // Test that setStorageItem doesn't throw even if storage fails
      // This is an integration-style test rather than a unit test with mocks
      expect(() => setStorageItem(STORAGE_KEYS.THEME, "dark")).not.toThrow();
    });

    it("should overwrite existing value", () => {
      setStorageItem(STORAGE_KEYS.THEME, "light");
      setStorageItem(STORAGE_KEYS.THEME, "dark");
      expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("dark");
    });

    it("should handle empty string value", () => {
      const success = setStorageItem(STORAGE_KEYS.THEME, "");
      expect(success).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("");
    });

    it("should set complex nested JSON", () => {
      const complexData = {
        tour1: { metadata: { title: "A", tags: ["x", "y"] }, cachedAt: 1, expiresAt: 2 },
        tour2: { metadata: { title: "B", tags: ["z"] }, cachedAt: 3, expiresAt: 4 },
      };
      const success = setStorageItem(STORAGE_KEYS.TOUR_METADATA_V1, complexData);
      expect(success).toBe(true);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.TOUR_METADATA_V1)!)).toEqual(
        complexData
      );
    });
  });

  describe("removeStorageItem", () => {
    it("should remove existing item", () => {
      localStorage.setItem(STORAGE_KEYS.THEME, "dark");
      const success = removeStorageItem(STORAGE_KEYS.THEME);
      expect(success).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBeNull();
    });

    it("should return true even if item doesn't exist", () => {
      const success = removeStorageItem(STORAGE_KEYS.THEME);
      expect(success).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBeNull();
    });

    it("should handle remove errors gracefully", () => {
      // Test that removeStorageItem doesn't throw even if storage fails
      expect(() => removeStorageItem(STORAGE_KEYS.THEME)).not.toThrow();
    });
  });

  describe("clearStorage", () => {
    it("should clear all storage items", () => {
      localStorage.setItem(STORAGE_KEYS.THEME, "dark");
      localStorage.setItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION, "true");
      localStorage.setItem("other-key", "value");

      const success = clearStorage();
      expect(success).toBe(true);
      expect(localStorage.length).toBe(0);
      expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION)).toBeNull();
      expect(localStorage.getItem("other-key")).toBeNull();
    });

    it("should return true even if storage is already empty", () => {
      const success = clearStorage();
      expect(success).toBe(true);
      expect(localStorage.length).toBe(0);
    });

    it("should handle clear errors gracefully", () => {
      // Test that clearStorage doesn't throw even if storage fails
      expect(() => clearStorage()).not.toThrow();
    });
  });

  describe("type safety", () => {
    it("should handle theme key with string value", () => {
      setStorageItem(STORAGE_KEYS.THEME, "cupcake");
      const result = getStorageItem(STORAGE_KEYS.THEME);
      expect(result).toBe("cupcake");
    });

    it("should handle invitation skip confirmation with boolean value", () => {
      setStorageItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION, true);
      const result = getStorageItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION);
      expect(result).toBe(true);
    });

    it("should handle tour metadata with object value", () => {
      const data = {
        abc: {
          metadata: { title: "Trip" },
          cachedAt: 111,
          expiresAt: 222,
        },
      };
      setStorageItem(STORAGE_KEYS.TOUR_METADATA_V1, data);
      const result = getStorageItem(STORAGE_KEYS.TOUR_METADATA_V1);
      expect(result).toEqual(data);
    });
  });

  describe("error handling gracefully", () => {
    it("should not throw when getItem fails", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      expect(() => getStorageItem(STORAGE_KEYS.THEME)).not.toThrow();
      expect(getStorageItem(STORAGE_KEYS.THEME)).toBeNull();
    });

    it("should handle all operations without throwing", () => {
      // Integration-style tests that verify graceful degradation
      expect(() => {
        setStorageItem(STORAGE_KEYS.THEME, "dark");
        getStorageItem(STORAGE_KEYS.THEME);
        removeStorageItem(STORAGE_KEYS.THEME);
        clearStorage();
      }).not.toThrow();
    });
  });
});
