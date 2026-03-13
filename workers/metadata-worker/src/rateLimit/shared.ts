/**
 * Shared rate-limit types for worker and server implementations.
 * These are intentionally minimal interfaces so the worker can
 * implement compatible stores (in-memory or Upstash-backed).
 */
export type RateLimitEntry = {
  /** Number of requests seen in the current window */
  count: number
  /** Unix ms timestamp when the window resets */
  resetTime: number
}

/**
 * Storage backend interface for rate limiting counters.
 */
export interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>
  set(key: string, value: RateLimitEntry, ttl: number): Promise<void>
  increment(key: string, windowMs?: number): Promise<RateLimitEntry>
  delete(key: string): Promise<void>
}

/**
 * Result returned by a rate limiter check.
 */
export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

/**
 * Configuration for a rate limiter.
 */
export type RateLimiterConfig = {
  max: number
  windowMs: number
  standardHeaders?: boolean
  legacyHeaders?: boolean
  message?: string
  keyGenerator?: (req: Request) => string
}

export const DEFAULT_RATE_LIMIT_CONFIG: Partial<RateLimiterConfig> = {
  standardHeaders: true,
  legacyHeaders: true,
}
