import { describe, it, expect, vi, beforeEach } from "vitest";
import { notifyStorageError } from "./storage-notifications";
import type { StorageError } from "./storage";

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  toast: {
    error: vi.fn(),
  },
}));

import { toast } from "react-hot-toast";

describe("storage-notifications", () => {
  const originalEnv = import.meta.env.DEV;
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    // @ts-expect-error - Restore original value
    import.meta.env.DEV = originalEnv;
  });

  describe("notifyStorageError", () => {
    describe("error message mapping", () => {
      it("should show correct message for unavailable storage", () => {
        const error: StorageError = {
          type: "unavailable",
          message: "localStorage is not available",
        };

        notifyStorageError(error);

        expect(toast.error).toHaveBeenCalledWith(
          "Unable to save preferences (browser privacy mode may be enabled)"
        );
      });

      it("should show correct message for quota exceeded", () => {
        const error: StorageError = {
          type: "quota_exceeded",
          message: "QuotaExceededError",
        };

        notifyStorageError(error);

        expect(toast.error).toHaveBeenCalledWith(
          "Storage quota exceeded. Please clear browser data or disable unnecessary features."
        );
      });

      it("should show correct message for serialization error", () => {
        const error: StorageError = {
          type: "serialization_error",
          message: "Failed to serialize data",
        };

        notifyStorageError(error);

        expect(toast.error).toHaveBeenCalledWith("Failed to save settings due to data format error");
      });

      it("should show correct message for unknown error", () => {
        const error: StorageError = {
          type: "unknown",
          message: "Something went wrong",
        };

        notifyStorageError(error);

        expect(toast.error).toHaveBeenCalledWith("Failed to save preferences. Please try again.");
      });
    });

    describe("context parameter", () => {
      it("should append context to error message when provided", () => {
        const error: StorageError = {
          type: "unavailable",
          message: "localStorage is not available",
        };

        notifyStorageError(error, "theme preference");

        expect(toast.error).toHaveBeenCalledWith(
          "Unable to save preferences (browser privacy mode may be enabled) (theme preference)"
        );
      });

      it("should handle context with special characters", () => {
        const error: StorageError = {
          type: "quota_exceeded",
          message: "QuotaExceededError",
        };

        notifyStorageError(error, "invitation settings: user@example.com");

        expect(toast.error).toHaveBeenCalledWith(
          "Storage quota exceeded. Please clear browser data or disable unnecessary features. (invitation settings: user@example.com)"
        );
      });

      it("should not append context when undefined", () => {
        const error: StorageError = {
          type: "serialization_error",
          message: "Failed to serialize",
        };

        notifyStorageError(error);

        expect(toast.error).toHaveBeenCalledWith("Failed to save settings due to data format error");
      });

      it("should not append context when empty string", () => {
        const error: StorageError = {
          type: "unknown",
          message: "Error",
        };

        notifyStorageError(error, "");

        expect(toast.error).toHaveBeenCalledWith("Failed to save preferences. Please try again.");
      });
    });

    describe("development logging", () => {
      it("should log detailed error in development mode", () => {
        // @ts-expect-error - Mock DEV mode
        import.meta.env.DEV = true;

        const error: StorageError = {
          type: "unavailable",
          message: "localStorage is not available",
          originalError: new Error("Privacy mode enabled"),
        };

        notifyStorageError(error, "theme preference");

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "[Storage Error]",
          expect.objectContaining({
            type: "unavailable",
            message: "localStorage is not available",
            context: "theme preference",
            originalError: expect.any(Error),
          })
        );
      });

      it("should log error even without originalError", () => {
        // @ts-expect-error - Mock DEV mode
        import.meta.env.DEV = true;

        const error: StorageError = {
          type: "quota_exceeded",
          message: "QuotaExceededError",
        };

        notifyStorageError(error);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "[Storage Error]",
          expect.objectContaining({
            type: "quota_exceeded",
            message: "QuotaExceededError",
            context: undefined,
            originalError: undefined,
          })
        );
      });

      it("should not log in production mode", () => {
        // @ts-expect-error - Mock production mode
        import.meta.env.DEV = false;

        const error: StorageError = {
          type: "unknown",
          message: "Error",
          originalError: new Error("Details"),
        };

        notifyStorageError(error, "some context");

        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });
    });

    describe("error object variations", () => {
      it("should handle error with all fields", () => {
        const originalError = new Error("Original error");
        const error: StorageError = {
          type: "serialization_error",
          message: "Failed to serialize data",
          originalError,
        };

        notifyStorageError(error, "user data");

        expect(toast.error).toHaveBeenCalledWith(
          "Failed to save settings due to data format error (user data)"
        );
      });

      it("should handle error with minimal fields", () => {
        const error: StorageError = {
          type: "unknown",
          message: "Generic error",
        };

        notifyStorageError(error);

        expect(toast.error).toHaveBeenCalledWith("Failed to save preferences. Please try again.");
      });
    });

    describe("toast integration", () => {
      it("should call toast.error exactly once", () => {
        const error: StorageError = {
          type: "unavailable",
          message: "Error",
        };

        notifyStorageError(error);

        expect(toast.error).toHaveBeenCalledTimes(1);
      });

      it("should handle multiple sequential calls", () => {
        const error1: StorageError = { type: "unavailable", message: "Error 1" };
        const error2: StorageError = { type: "quota_exceeded", message: "Error 2" };

        notifyStorageError(error1);
        notifyStorageError(error2);

        expect(toast.error).toHaveBeenCalledTimes(2);
      });
    });
  });
});
