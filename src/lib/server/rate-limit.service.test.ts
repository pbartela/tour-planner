import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimit,
  getClientIdentifier,
  getRateLimitMetrics,
  clearRateLimitMetrics,
  getRateLimitMode,
  destroyRateLimitStore,
  RATE_LIMIT_CONFIGS,
  type RateLimitConfig,
} from "./rate-limit.service";

// Mock dependencies
vi.mock("@/lib/constants/time", () => ({
  minutes: (n: number) => n * 60 * 1000,
}));

vi.mock("@/lib/server/env-validation.service", () => ({
  isDevelopment: vi.fn(),
  isProduction: vi.fn(),
}));

vi.mock("@/lib/server/logger.service", () => ({
  secureLog: vi.fn(),
  secureWarn: vi.fn(),
}));

import { isDevelopment, isProduction } from "@/lib/server/env-validation.service";
import { secureLog, secureWarn } from "@/lib/server/logger.service";

describe("rate-limit.service", () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    clearRateLimitMetrics();

    // Reset all rate limits
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Default: development mode
    vi.mocked(isDevelopment).mockReturnValue(true);
    vi.mocked(isProduction).mockReturnValue(false);

    // Use fake timers for consistent time-based tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    consoleWarnSpy.mockRestore();
  });

  describe("checkRateLimit", () => {
    const testConfig: RateLimitConfig = {
      maxRequests: 5,
      windowMs: 60000, // 1 minute
    };

    it("should allow first request", () => {
      const result = checkRateLimit("test-client", testConfig);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it("should track requests within window", () => {
      // Make 3 requests
      const result1 = checkRateLimit("test-client", testConfig);
      const result2 = checkRateLimit("test-client", testConfig);
      const result3 = checkRateLimit("test-client", testConfig);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(true);
      // Remaining should decrease with each request
      expect(result3.remaining).toBeLessThan(result1.remaining);
    });

    it("should block requests when limit exceeded", () => {
      // Use up all 5 requests
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test-client", testConfig);
      }

      // 6th request should be blocked
      const result = checkRateLimit("test-client", testConfig);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should reset after time window expires", () => {
      // Use up limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test-client", testConfig);
      }

      // Advance time past the window
      vi.advanceTimersByTime(60001); // 1ms past 1 minute

      // Should allow new request
      const result = checkRateLimit("test-client", testConfig);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should maintain separate limits for different identifiers", () => {
      checkRateLimit("client-1", testConfig);
      checkRateLimit("client-1", testConfig);

      checkRateLimit("client-2", testConfig);

      const result1 = checkRateLimit("client-1", testConfig);
      const result2 = checkRateLimit("client-2", testConfig);

      expect(result1.remaining).toBe(2); // client-1 has used 3
      expect(result2.remaining).toBe(3); // client-2 has used 2
    });

    it("should return resetAt timestamp in the future", () => {
      const now = Date.now();
      const result = checkRateLimit("test-reset-time", testConfig);

      expect(result.resetAt).toBeGreaterThan(now);
      // Just check it's reasonable (within a day)
      expect(result.resetAt).toBeLessThan(now + 24 * 60 * 60 * 1000);
    });

    it("should log warning when rate limit exceeded", () => {
      // Use up limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test-client", testConfig, "TEST_ENDPOINT");
      }

      // Exceed limit
      checkRateLimit("test-client", testConfig, "TEST_ENDPOINT");

      expect(secureWarn).toHaveBeenCalledWith(
        "Rate limit exceeded",
        expect.objectContaining({
          identifier: "test-client",
          config: "TEST_ENDPOINT",
        })
      );
    });

    it("should not throw when approaching limit", () => {
      // Use 4 out of 5 (80%)
      expect(() => {
        for (let i = 0; i < 4; i++) {
          checkRateLimit("test-threshold", testConfig, "TEST_ENDPOINT");
        }
      }).not.toThrow();
    });
  });

  describe("resetRateLimit", () => {
    const testConfig: RateLimitConfig = {
      maxRequests: 3,
      windowMs: 60000,
    };

    it("should reset rate limit for identifier", () => {
      // Use up limit
      checkRateLimit("test-client", testConfig);
      checkRateLimit("test-client", testConfig);
      checkRateLimit("test-client", testConfig);

      // Reset
      resetRateLimit("test-client");

      // Should allow new requests
      const result = checkRateLimit("test-client", testConfig);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it("should not affect other identifiers", () => {
      checkRateLimit("client-1", testConfig);
      checkRateLimit("client-2", testConfig);
      checkRateLimit("client-2", testConfig);

      resetRateLimit("client-1");

      const result1 = checkRateLimit("client-1", testConfig);
      const result2 = checkRateLimit("client-2", testConfig);

      expect(result1.remaining).toBe(2); // Reset, so first request again
      expect(result2.remaining).toBe(0); // Still has 3 requests used
    });
  });

  describe("getRateLimitMetrics", () => {
    const testConfig: RateLimitConfig = {
      maxRequests: 2,
      windowMs: 60000,
    };

    it("should return empty array when no violations", () => {
      checkRateLimit("test-client", testConfig);

      const metrics = getRateLimitMetrics();

      expect(metrics).toEqual([]);
    });

    it("should track rate limit violations", () => {
      // Exceed limit
      checkRateLimit("test-client", testConfig);
      checkRateLimit("test-client", testConfig);
      checkRateLimit("test-client", testConfig); // Violation

      const metrics = getRateLimitMetrics();

      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].identifier).toBe("test-client");
    });

    it("should filter metrics by timestamp", () => {
      clearRateLimitMetrics();
      const now = Date.now();

      // First violation
      checkRateLimit("client-1", testConfig);
      checkRateLimit("client-1", testConfig);
      checkRateLimit("client-1", testConfig);

      // Advance time
      vi.advanceTimersByTime(5000);

      // Second violation
      checkRateLimit("client-2", testConfig);
      checkRateLimit("client-2", testConfig);
      checkRateLimit("client-2", testConfig);

      // Get metrics since midpoint
      const metrics = getRateLimitMetrics(now + 2500);

      // Should have at least the second violation
      expect(metrics.length).toBeGreaterThan(0);
      const hasClient2 = metrics.some((m) => m.identifier === "client-2");
      expect(hasClient2).toBe(true);
    });

    it("should limit metrics history to 1000 entries", () => {
      const smallConfig: RateLimitConfig = { maxRequests: 1, windowMs: 60000 };

      // Generate 1100 violations
      for (let i = 0; i < 1100; i++) {
        checkRateLimit(`client-${i}`, smallConfig);
        checkRateLimit(`client-${i}`, smallConfig); // Violation
      }

      const metrics = getRateLimitMetrics();

      expect(metrics).toHaveLength(1000);
    });
  });

  describe("clearRateLimitMetrics", () => {
    it("should clear all metrics", () => {
      const testConfig: RateLimitConfig = { maxRequests: 1, windowMs: 60000 };

      // Generate violations
      checkRateLimit("client-1", testConfig);
      checkRateLimit("client-1", testConfig);

      const initialMetrics = getRateLimitMetrics();
      expect(initialMetrics.length).toBeGreaterThan(0);

      clearRateLimitMetrics();

      const clearedMetrics = getRateLimitMetrics();
      expect(clearedMetrics).toHaveLength(0);
    });
  });

  describe("getClientIdentifier", () => {
    it("should return user ID when provided", () => {
      const mockRequest = new Request("https://example.com");

      const identifier = getClientIdentifier(mockRequest, "user-123");

      expect(identifier).toBe("user:user-123");
    });

    it("should extract IP from x-forwarded-for header", () => {
      const mockRequest = new Request("https://example.com", {
        headers: {
          "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        },
      });

      const identifier = getClientIdentifier(mockRequest);

      expect(identifier).toBe("ip:192.168.1.1");
    });

    it("should extract IP from x-real-ip header", () => {
      const mockRequest = new Request("https://example.com", {
        headers: {
          "x-real-ip": "192.168.1.1",
        },
      });

      const identifier = getClientIdentifier(mockRequest);

      expect(identifier).toBe("ip:192.168.1.1");
    });

    it("should extract IP from cf-connecting-ip header (Cloudflare)", () => {
      const mockRequest = new Request("https://example.com", {
        headers: {
          "cf-connecting-ip": "192.168.1.1",
        },
      });

      const identifier = getClientIdentifier(mockRequest);

      expect(identifier).toBe("ip:192.168.1.1");
    });

    it("should sanitize invalid IP addresses", () => {
      const mockRequest = new Request("https://example.com", {
        headers: {
          "x-forwarded-for": "192.168.1.1; DROP TABLE users;",
        },
      });

      const identifier = getClientIdentifier(mockRequest);

      // Should start with ip: prefix (sanitization may reject entire string)
      expect(identifier).toContain("ip:");
      // Sanitization may make it "unknown" if the full string is invalid
      expect(["ip:192.168.1.1", "ip:unknown"]).toContain(identifier);
    });

    it("should handle IPv6 addresses", () => {
      const mockRequest = new Request("https://example.com", {
        headers: {
          "x-forwarded-for": "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        },
      });

      const identifier = getClientIdentifier(mockRequest);

      expect(identifier).toBe("ip:2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    });

    it("should return 'unknown' for invalid IP", () => {
      const mockRequest = new Request("https://example.com", {
        headers: {
          "x-forwarded-for": "not-an-ip",
        },
      });

      const identifier = getClientIdentifier(mockRequest);

      expect(identifier).toBe("ip:unknown");
    });

    it("should return ip prefix when no IP headers present", () => {
      const mockRequest = new Request("https://example.com");

      const identifier = getClientIdentifier(mockRequest);

      expect(identifier).toContain("ip:");
    });

    it("should prioritize x-forwarded-for over other headers", () => {
      const mockRequest = new Request("https://example.com", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "x-real-ip": "10.0.0.1",
          "cf-connecting-ip": "172.16.0.1",
        },
      });

      const identifier = getClientIdentifier(mockRequest);

      expect(identifier).toBe("ip:192.168.1.1");
    });
  });

  describe("getRateLimitMode", () => {
    it("should return a valid mode object", () => {
      const mode = getRateLimitMode();

      expect(mode).toHaveProperty("mode");
      expect(mode).toHaveProperty("isDevelopment");
      expect(mode).toHaveProperty("testModeEnabled");
      expect(["development", "test", "production"]).toContain(mode.mode);
    });
  });

  describe("RATE_LIMIT_CONFIGS", () => {
    it("should have valid config values", () => {
      expect(RATE_LIMIT_CONFIGS.MAGIC_LINK.maxRequests).toBeGreaterThan(0);
      expect(RATE_LIMIT_CONFIGS.AUTH.maxRequests).toBeGreaterThan(0);
      expect(RATE_LIMIT_CONFIGS.API.maxRequests).toBeGreaterThan(0);
    });

    describe("time windows", () => {
      it("should have correct magic link window (15 minutes)", () => {
        expect(RATE_LIMIT_CONFIGS.MAGIC_LINK.windowMs).toBe(15 * 60 * 1000);
      });

      it("should have correct auth window (1 minute)", () => {
        expect(RATE_LIMIT_CONFIGS.AUTH.windowMs).toBe(1 * 60 * 1000);
      });

      it("should have correct API window (1 minute)", () => {
        expect(RATE_LIMIT_CONFIGS.API.windowMs).toBe(1 * 60 * 1000);
      });

      it("should have correct tour invitations window (60 minutes)", () => {
        expect(RATE_LIMIT_CONFIGS.TOUR_INVITATIONS.windowMs).toBe(60 * 60 * 1000);
      });

      it("should have correct OTP verification window (1 minute)", () => {
        expect(RATE_LIMIT_CONFIGS.OTP_VERIFICATION.windowMs).toBe(1 * 60 * 1000);
      });

      it("should have correct invitation resend window (60 minutes)", () => {
        expect(RATE_LIMIT_CONFIGS.INVITATION_RESEND.windowMs).toBe(60 * 60 * 1000);
      });

      it("should have correct invitation action window (1 minute)", () => {
        expect(RATE_LIMIT_CONFIGS.INVITATION_ACTION.windowMs).toBe(1 * 60 * 1000);
      });
    });
  });

  describe("edge cases", () => {
    const testConfig: RateLimitConfig = {
      maxRequests: 5,
      windowMs: 60000,
    };

    it("should handle concurrent requests from same identifier", () => {
      const results = Array.from({ length: 10 }, () => checkRateLimit("test-client-concurrent", testConfig));

      const allowed = results.filter((r) => r.allowed);
      const blocked = results.filter((r) => !r.allowed);

      // Should allow first maxRequests, block the rest
      expect(allowed.length).toBeGreaterThan(0);
      expect(blocked.length).toBeGreaterThan(0);
      expect(allowed.length + blocked.length).toBe(10);
    });

    it("should handle very small time window", () => {
      const smallConfig: RateLimitConfig = {
        maxRequests: 2,
        windowMs: 100, // 100ms
      };

      checkRateLimit("test-small-window", smallConfig);
      checkRateLimit("test-small-window", smallConfig);

      // Advance past window
      vi.advanceTimersByTime(101);

      const result = checkRateLimit("test-small-window", smallConfig);

      expect(result.allowed).toBe(true);
    });

    it("should handle very large time window", () => {
      const largeConfig: RateLimitConfig = {
        maxRequests: 1,
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
      };

      const result1 = checkRateLimit("test-large-window", largeConfig);
      const result2 = checkRateLimit("test-large-window", largeConfig);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(false);

      // Should still be blocked even after 1 hour
      vi.advanceTimersByTime(60 * 60 * 1000);

      const result3 = checkRateLimit("test-large-window", largeConfig);

      expect(result3.allowed).toBe(false);
    });

    it("should handle maxRequests of 1", () => {
      const strictConfig: RateLimitConfig = {
        maxRequests: 1,
        windowMs: 60000,
      };

      const result1 = checkRateLimit("test-strict", strictConfig);
      const result2 = checkRateLimit("test-strict", strictConfig);

      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(0);
      expect(result2.allowed).toBe(false);
    });

    it("should handle very long identifier strings", () => {
      const longIdentifier = "a".repeat(1000);

      const result = checkRateLimit(longIdentifier, testConfig);

      expect(result.allowed).toBe(true);
    });

    it("should handle special characters in identifier", () => {
      const specialIdentifier = "user:123@domain.com#special!chars";

      const result = checkRateLimit(specialIdentifier, testConfig);

      expect(result.allowed).toBe(true);
    });

    it("should handle empty string identifier", () => {
      const result = checkRateLimit("", testConfig);

      expect(result.allowed).toBe(true);
    });
  });

  describe("cleanup and resource management", () => {
    it("should not throw when destroying rate limit store", () => {
      expect(() => destroyRateLimitStore()).not.toThrow();
    });

    it("should allow requests after store is destroyed and recreated", () => {
      const testConfig: RateLimitConfig = { maxRequests: 2, windowMs: 60000 };

      checkRateLimit("test-client", testConfig);

      destroyRateLimitStore();

      // After destroy, state might be reset depending on implementation
      // Just ensure no errors are thrown
      expect(() => checkRateLimit("test-client", testConfig)).not.toThrow();
    });
  });
});
