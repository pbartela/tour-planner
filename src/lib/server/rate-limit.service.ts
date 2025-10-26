/**
 * Rate limiting service to prevent abuse of API endpoints.
 * Uses an in-memory store with automatic cleanup of expired entries.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
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
 */
const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;

export const RATE_LIMIT_CONFIGS = {
  // 3 requests per 15 minutes for magic link (production)
  // 20 requests per 15 minutes for magic link (development)
  MAGIC_LINK: {
    maxRequests: isDevelopment ? 20 : 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // 5 requests per minute for general authentication (production)
  // 50 requests per minute for general authentication (development)
  AUTH: {
    maxRequests: isDevelopment ? 50 : 5,
    windowMs: 60 * 1000, // 1 minute
  },
  // 100 requests per minute for general API (production)
  // 1000 requests per minute for general API (development)
  API: {
    maxRequests: isDevelopment ? 1000 : 100,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

/**
 * Extracts a client identifier from the request for rate limiting.
 * Uses a combination of IP address and User-Agent for better accuracy.
 *
 * @param request - The incoming request
 * @returns A unique identifier for the client
 */
export function getClientIdentifier(request: Request): string {
  // Try to get the real IP from common proxy headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare

  const ip = forwardedFor?.split(",")[0].trim() || realIp || cfConnectingIp || "unknown";

  // Include User-Agent for additional uniqueness (helps with shared IPs)
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
