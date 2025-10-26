/**
 * Rate limiting service to prevent abuse of API endpoints.
 * Uses an in-memory store with automatic cleanup of expired entries.
 */

import { minutes } from "@/lib/constants/time";
import { isDevelopment as isDev } from "@/lib/server/env-validation.service";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * WARNING: This in-memory store is not suitable for multi-instance deployments.
 * For production use with multiple instances, implement a Redis-based store.
 */
class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, minutes(1));
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt <= now) {
        this.store.delete(key);
      }
    }
  }

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key);
    if (entry && entry.resetAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

const rateLimitStore = new RateLimitStore();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Checks if a request should be rate limited.
 *
 * @param identifier - Unique identifier for the rate limit (e.g., IP address, email)
 * @param config - Rate limit configuration (max requests and time window)
 * @returns Rate limit result with allowed status and metadata
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    // First request in the window
    const resetAt = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Resets the rate limit for a specific identifier.
 * Useful for testing or manual override.
 *
 * @param identifier - Unique identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Common rate limit configurations
 *
 * DEVELOPMENT vs TEST vs PRODUCTION:
 *
 * Development Mode (default in dev):
 *   - Relaxed limits (7-10x higher than production)
 *   - Fast iteration and testing without hitting limits
 *   - May hide rate limit issues that appear in production
 *
 * Test Mode (enable with TEST_MODE=true):
 *   - Production-like limits for realistic testing
 *   - Use in CI/CD pipelines and integration tests
 *   - Catches rate limit issues before deployment
 *   - Can be enabled in development for testing edge cases
 *
 * Production Mode (automatic in production builds):
 *   - Strict limits to prevent abuse
 *   - Protects against DoS and brute force attacks
 *
 * USAGE:
 *   - Development: No configuration needed (default)
 *   - Test Mode: Set TEST_MODE=true in .env or environment
 *   - Production: Automatic (import.meta.env.PROD === true)
 *
 * EXAMPLES:
 *   # Run tests with production-like limits
 *   TEST_MODE=true npm run test
 *
 *   # Test rate limiting behavior in development
 *   TEST_MODE=true npm run dev
 */

// Test mode can be enabled to use production-like limits during testing
const testMode = import.meta.env.TEST_MODE === "true";

// Development mode: relaxed limits unless test mode is enabled
const isDevelopment = !testMode && isDev();

/**
 * Gets the current rate limiting mode for debugging purposes.
 *
 * @returns Object with mode information
 */
export function getRateLimitMode(): { mode: "production" | "test" | "development"; testModeEnabled: boolean; isDevelopment: boolean } {
  return {
    mode: testMode ? "test" : isDevelopment ? "development" : "production",
    testModeEnabled: testMode,
    isDevelopment,
  };
}

export const RATE_LIMIT_CONFIGS = {
  /**
   * Magic link rate limits
   * - Production/Test: 3 requests per 15 minutes
   * - Development: 20 requests per 15 minutes
   */
  MAGIC_LINK: {
    maxRequests: isDevelopment ? 20 : 3,
    windowMs: minutes(15),
  },

  /**
   * General authentication rate limits
   * - Production/Test: 5 requests per minute
   * - Development: 50 requests per minute
   */
  AUTH: {
    maxRequests: isDevelopment ? 50 : 5,
    windowMs: minutes(1),
  },

  /**
   * General API rate limits
   * - Production/Test: 100 requests per minute
   * - Development: 1000 requests per minute
   */
  API: {
    maxRequests: isDevelopment ? 1000 : 100,
    windowMs: minutes(1),
  },
} as const;

/**
 * Extracts a client identifier from the request for rate limiting.
 * Uses a combination of IP address and User-Agent for better accuracy.
 *
 * SECURITY CONSIDERATIONS:
 * This implementation provides basic rate limiting but has known limitations:
 *
 * 1. User-Agent Spoofing: User-Agent headers can be easily spoofed by attackers,
 *    allowing them to bypass rate limits by changing their User-Agent string.
 *
 * 2. Shared IP Addresses: Users behind NAT/proxy may share the same IP address,
 *    potentially affecting legitimate users when one user hits the rate limit.
 *
 * 3. IP Header Spoofing: While we check multiple headers (X-Forwarded-For, X-Real-IP,
 *    CF-Connecting-IP), these can be spoofed if not properly validated by a trusted
 *    reverse proxy/CDN.
 *
 * RECOMMENDED IMPROVEMENTS FOR PRODUCTION:
 *
 * - Browser Fingerprinting: Use techniques like canvas fingerprinting, WebGL
 *   fingerprinting, or libraries like FingerprintJS for more accurate client
 *   identification.
 *
 * - CAPTCHA Integration: Implement CAPTCHA (reCAPTCHA, hCaptcha, Turnstile) after
 *   repeated failures or when suspicious behavior is detected.
 *
 * - Session-Based Limiting: For authenticated users, use session IDs or user IDs
 *   for more accurate and reliable rate limiting.
 *
 * - Device Fingerprinting: Consider using device-specific identifiers (with user
 *   consent and privacy compliance).
 *
 * - Progressive Penalties: Implement escalating penalties (e.g., temporary bans,
 *   longer cooldown periods) for repeated violations.
 *
 * - Distributed Store: Replace in-memory store with Redis/Memcached for multi-
 *   instance deployments and persistent rate limit tracking.
 *
 * @param request - The incoming request
 * @returns A unique identifier for the client (IP:UserAgent combination)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get the real IP from common proxy headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare

  const ip = forwardedFor?.split(",")[0].trim() || realIp || cfConnectingIp || "unknown";

  // Include User-Agent for additional uniqueness (helps with shared IPs)
  // Note: User-Agent can be spoofed - see security considerations above
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Create a simple hash of the combination
  return `${ip}:${userAgent.substring(0, 50)}`;
}

/**
 * Destroys the rate limit store and cleans up resources.
 * Should be called on application shutdown.
 */
export function destroyRateLimitStore(): void {
  rateLimitStore.destroy();
}
