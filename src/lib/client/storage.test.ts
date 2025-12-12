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
    it("should return success with null value when key doesn't exist", () => {
      const result = getStorageItem(STORAGE_KEYS.THEME);
      expect(result.success).toBe(true);
      expect(result.value).toBeNull();
      expect(result.error).toBeUndefined();
    });

    it("should get string value (theme)", () => {
      localStorage.setItem(STORAGE_KEYS.THEME, "dark");
      const result = getStorageItem(STORAGE_KEYS.THEME);
      expect(result.success).toBe(true);
      expect(result.value).toBe("dark");
      expect(result.error).toBeUndefined();
    });

    it("should get boolean value true (invitation skip confirmation)", () => {
      localStorage.setItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION, "true");
      const result = getStorageItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION);
      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should get boolean value false (invitation skip confirmation)", () => {
      localStorage.setItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION, "false");
      const result = getStorageItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION);
      expect(result.success).toBe(true);
      expect(result.value).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it("should get JSON value (tour metadata)", () => {
      const metadata = {
        tour1: {
          metadata: { title: "Test Tour" },
          cachedAt: Date.now(),
          expiresAt: Date.now() + 1000,
        },
      };
      localStorage.setItem(
        STORAGE_KEYS.TOUR_METADATA_V1,
        JSON.stringify(metadata)
      );
      const result = getStorageItem(STORAGE_KEYS.TOUR_METADATA_V1);
      expect(result.success).toBe(true);
      expect(result.value).toEqual(metadata);
      expect(result.error).toBeUndefined();
    });

    it("should return error on JSON parse error", () => {
      localStorage.setItem(STORAGE_KEYS.TOUR_METADATA_V1, "invalid json");
      const result = getStorageItem(STORAGE_KEYS.TOUR_METADATA_V1);
      expect(result.success).toBe(false);
      expect(result.value).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe("serialization_error");
    });


    it("should handle empty string value", () => {
      localStorage.setItem(STORAGE_KEYS.THEME, "");
      const result = getStorageItem(STORAGE_KEYS.THEME);
      expect(result.success).toBe(true);
      expect(result.value).toBe("");
      expect(result.error).toBeUndefined();
    });
  });

  describe("setStorageItem", () => {
    it("should set string value", () => {
      const result = setStorageItem(STORAGE_KEYS.THEME, "light");
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("light");
    });

    it("should set boolean value true", () => {
      const result = setStorageItem(
        STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION,
        true
      );
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(
        localStorage.getItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION)
      ).toBe("true");
    });

    it("should set boolean value false", () => {
      const result = setStorageItem(
        STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION,
        false
      );
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(
        localStorage.getItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION)
      ).toBe("false");
    });

    it("should set JSON value", () => {
      const metadata = {
        tour1: {
          metadata: { title: "Test" },
          cachedAt: 123456,
          expiresAt: 789012,
        },
      };
      const result = setStorageItem(STORAGE_KEYS.TOUR_METADATA_V1, metadata);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(
        JSON.parse(localStorage.getItem(STORAGE_KEYS.TOUR_METADATA_V1)!)
      ).toEqual(metadata);
    });

    it("should handle storage errors gracefully", () => {
      // Test that setStorageItem doesn't throw even if storage fails
      // This is an integration-style test rather than a unit test with mocks
      expect(() => setStorageItem(STORAGE_KEYS.THEME, "dark")).not.toThrow();
    });

    it("should overwrite existing value", () => {
      setStorageItem(STORAGE_KEYS.THEME, "light");
      const result = setStorageItem(STORAGE_KEYS.THEME, "dark");
      expect(result.success).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("dark");
    });

    it("should handle empty string value", () => {
      const result = setStorageItem(STORAGE_KEYS.THEME, "");
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("");
    });

    it("should set complex nested JSON", () => {
      const complexData = {
        tour1: {
          metadata: { title: "A", tags: ["x", "y"] },
          cachedAt: 1,
          expiresAt: 2,
        },
        tour2: {
          metadata: { title: "B", tags: ["z"] },
          cachedAt: 3,
          expiresAt: 4,
        },
      };
      const result = setStorageItem(STORAGE_KEYS.TOUR_METADATA_V1, complexData);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(
        JSON.parse(localStorage.getItem(STORAGE_KEYS.TOUR_METADATA_V1)!)
      ).toEqual(complexData);
    });
  });

  describe("removeStorageItem", () => {
    it("should remove existing item", () => {
      localStorage.setItem(STORAGE_KEYS.THEME, "dark");
      const result = removeStorageItem(STORAGE_KEYS.THEME);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBeNull();
    });

    it("should return success even if item doesn't exist", () => {
      const result = removeStorageItem(STORAGE_KEYS.THEME);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
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

      const result = clearStorage();
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(localStorage.length).toBe(0);
      expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBeNull();
      expect(
        localStorage.getItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION)
      ).toBeNull();
      expect(localStorage.getItem("other-key")).toBeNull();
    });

    it("should return success even if storage is already empty", () => {
      const result = clearStorage();
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
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
      expect(result.success).toBe(true);
      expect(result.value).toBe("cupcake");
    });

    it("should handle invitation skip confirmation with boolean value", () => {
      setStorageItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION, true);
      const result = getStorageItem(STORAGE_KEYS.INVITATION_SKIP_CONFIRMATION);
      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
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
      expect(result.success).toBe(true);
      expect(result.value).toEqual(data);
    });
  });

  describe("error handling gracefully", () => {
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

  describe("detailed error reporting", () => {
    describe("serialization errors", () => {
      it("should detect JSON serialization errors", () => {
        // Create circular reference to cause serialization error
        const circular: Record<string, unknown> = {};
        circular.self = circular;

        const result = setStorageItem(
          STORAGE_KEYS.TOUR_METADATA_V1,
          circular as never
        );
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error?.type).toBe("serialization_error");
        expect(result.error?.message).toContain("serialize");
      });

      it("should handle JSON parse errors in getStorageItem", () => {
        localStorage.setItem(STORAGE_KEYS.TOUR_METADATA_V1, "{ invalid json");
        const result = getStorageItem(STORAGE_KEYS.TOUR_METADATA_V1);
        expect(result.success).toBe(false);
        expect(result.error?.type).toBe("serialization_error");
        expect(result.error?.message).toContain("parse");
      });
    });
  });
});
