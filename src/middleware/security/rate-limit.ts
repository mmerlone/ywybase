/**
 * Rate Limiting Utilities
 *
 * Configurable rate limiting middleware using centralized configuration
 * from src/config/security.ts. Provides protection against brute force
 * attacks and API abuse.
 *
 * Supports multiple storage backends:
 * - Memory (development/single instance)
 * - Vercel KV (Vercel deployments)
 */

import { SECURITY_CONFIG } from '@/config/security'
import { buildLogger } from '@/lib/logger/client'
import { safeJsonParse } from '@/lib/utils/json'
import type {
  RateLimitStore,
  RateLimitEntry,
  RateLimitResult,
  RateLimiterConfig,
  RateLimitStats,
  ValidationResult,
} from '@/types/security.types'
import { type NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const logger = buildLogger('security-rate-limit')

/**
 * Type guard for RateLimitEntry
 */
function isRateLimitEntry(obj: unknown): obj is RateLimitEntry {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'count' in obj &&
    typeof (obj as Record<string, unknown>).count === 'number' &&
    'resetTime' in obj &&
    typeof (obj as Record<string, unknown>).resetTime === 'number'
  )
}

/**
 * In-memory rate limit store (for development/single instance)
 *
 * **Algorithm**: Fixed window counter with automatic cleanup
 * - Stores rate limit entries in a Map keyed by rate limit key
 * - Uses timers to automatically remove expired entries
 * - On increment: Creates new entry if missing, or increments existing counter
 * - Window resets after configured windowMs duration
 *
 * **Limitations**:
 * - Not suitable for production with multiple instances (no shared state)
 * - Memory usage grows with number of unique keys
 * - State is lost on server restart
 *
 * @example
 * ```typescript
 * const store = new MemoryRateLimitStore()
 *
 * // Increment counter for IP address
 * const entry = await store.increment('rate-limit-api:192.168.1.1', 60000)
 * console.log(entry.count) // 1
 *
 * // Check if limit exceeded
 * if (entry.count > 100) {
 *   console.log('Rate limit exceeded')
 * }
 * ```
 */
class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>()
  private timers = new Map<string, NodeJS.Timeout>()

  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key)
    if (!entry) return null

    // Clean up expired entries
    if (Date.now() > entry.resetTime) {
      this.store.delete(key)
      this.timers.delete(key)
      return null
    }

    return entry
  }

  async set(key: string, value: RateLimitEntry, ttl: number): Promise<void> {
    // Clear existing timer for this key
    const existingTimer = this.timers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    this.store.set(key, value)

    // Clean up after TTL
    const timer = setTimeout(() => {
      this.store.delete(key)
      this.timers.delete(key)
    }, ttl)
    this.timers.set(key, timer)
  }

  async increment(key: string, windowMs: number = 15 * 60 * 1000): Promise<RateLimitEntry> {
    const existing = await this.get(key)

    if (existing) {
      existing.count++
      this.store.set(key, existing)
      return existing
    } else {
      const resetTime = Date.now() + windowMs
      const newEntry: RateLimitEntry = { count: 1, resetTime }

      await this.set(key, newEntry, windowMs)
      return newEntry
    }
  }

  async delete(key: string): Promise<void> {
    const existingTimer = this.timers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }
    this.timers.delete(key)
    this.store.delete(key)
  }
}

/**
 * Upstash Redis rate limit store (for production deployments)
 *
 * Uses atomic Redis operations for rate limiting, compatible with Upstash Redis REST API.
 */
class UpstashRedisRateLimitStore implements RateLimitStore {
  private redis: Redis

  constructor(redisClient: Redis) {
    this.redis = redisClient
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    try {
      const data = await this.redis.get<string>(key)
      if (data === null) return null
      const parsed = typeof data === 'string' ? safeJsonParse<RateLimitEntry>(data, isRateLimitEntry) : data
      if (!isRateLimitEntry(parsed)) {
        logger.warn({ key, data }, 'Invalid rate limit entry format in Redis')
        return null
      }
      const entry = parsed
      if (Date.now() > entry.resetTime) {
        await this.redis.del(key)
        return null
      }
      return entry
    } catch (err) {
      logger.error({ err, key }, 'Error getting rate limit entry from Upstash Redis')
      return null
    }
  }

  async set(key: string, value: RateLimitEntry, ttl: number): Promise<void> {
    try {
      const ttlSeconds = Math.ceil(ttl / 1000)
      await this.redis.set(key, JSON.stringify(value), { ex: ttlSeconds })
    } catch (err) {
      logger.error({ err, key, ttl }, 'Error setting rate limit entry in Upstash Redis')
    }
  }

  async increment(key: string, windowMs: number = 15 * 60 * 1000): Promise<RateLimitEntry> {
    try {
      const currentCount = await this.redis.incr(key)
      if (currentCount === 1) {
        const ttlSeconds = Math.ceil(windowMs / 1000)
        await this.redis.expire(key, ttlSeconds)
      }
      const ttl = await this.redis.ttl(key)
      const resetTime = Date.now() + (ttl > 0 ? ttl * 1000 : windowMs)
      return {
        count: currentCount,
        resetTime,
      }
    } catch (err) {
      logger.error({ err, key }, 'Error incrementing rate limit in Upstash Redis')
      return { count: 1, resetTime: Date.now() + windowMs }
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (err) {
      logger.error({ err, key }, 'Error deleting rate limit entry from Upstash Redis')
    }
  }
}

/**
 * Initialize rate limit store based on environment
 */
async function initializeRateLimitStore(): Promise<RateLimitStore> {
  // Check for Upstash Redis
  if (process.env.UPSTASH_REDIS_REST_URL !== undefined && process.env.UPSTASH_REDIS_REST_TOKEN !== undefined) {
    try {
      const redis = Redis.fromEnv()
      logger.info({ store: 'upstash-redis' }, 'Using Upstash Redis for rate limiting')
      return new UpstashRedisRateLimitStore(redis)
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err : new Error(String(err)), store: 'upstash-redis' },
        'Failed to initialize Upstash Redis, falling back to in-memory rate limiting'
      )
    }
  }

  // Fallback to memory store
  if (process.env.NODE_ENV === 'production') {
    logger.warn(
      { store: 'memory', environment: 'production' },
      'Using in-memory rate limiting in production. This is not recommended for multi-instance deployments. Consider using Upstash Redis.'
    )
  } else {
    logger.info({ store: 'memory', environment: process.env.NODE_ENV }, 'Using in-memory rate limiting for development')
  }

  return new MemoryRateLimitStore()
}

/**
 * Global rate limit store instance
 */
let rateLimitStore: RateLimitStore | null = null
let initPromise: Promise<RateLimitStore> | null = null

/**
 * Get or initialize the rate limit store
 */
async function getRateLimitStore(): Promise<RateLimitStore> {
  if (rateLimitStore) {
    return rateLimitStore
  }

  initPromise ??= initializeRateLimitStore().then((store) => {
    rateLimitStore = store
    return store
  })

  return initPromise
}

/**
 * Set custom rate limit store (e.g., for testing or custom implementations)
 */
export function setRateLimitStore(store: RateLimitStore): void {
  rateLimitStore = store
  initPromise = null // Clear any pending initialization
  logger.info({ store: store.constructor.name }, 'Custom rate limit store configured')
}

/**
 * Generate rate limit key from request
 */
function generateRateLimitKey(
  request: NextRequest,
  prefix: string,
  customKeyGenerator?: (request: NextRequest) => string
): string {
  if (customKeyGenerator) {
    return `${prefix}:${customKeyGenerator(request)}`
  }

  // Use IP address as default key
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    request.headers.get('x-vercel-forwarded-for') ??
    'unknown'

  return `${prefix}:${ip}`
}

/**
 * Apply rate limiting to a request
 *
 * **Algorithm**: Fixed window rate limiting
 * 1. Check if request should be skipped (optional skip function)
 * 2. Generate rate limit key (IP-based by default, or custom)
 * 3. Increment counter for the key
 * 4. Compare count against configured maximum
 * 5. Calculate remaining requests and reset time
 * 6. Log and trigger callbacks if limit exceeded
 *
 * **Error Handling**: Fails open (allows request) if rate limiting fails
 * to prevent legitimate traffic from being blocked due to infrastructure issues.
 *
 * @param request - The Next.js request to rate limit
 * @param config - Rate limiter configuration (max, windowMs, etc.)
 * @param keyPrefix - Prefix for rate limit key (default: 'rate-limit')
 * @returns Rate limit result with success status and metadata
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = await applyRateLimit(request, {
 *   max: 100,
 *   windowMs: 60000,
 *   message: 'Too many requests',
 * })
 *
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: 'Rate limit exceeded' },
 *     { status: 429 }
 *   )
 * }
 *
 * // With custom key generator (user-based instead of IP-based)
 * const result = await applyRateLimit(
 *   request,
 *   {
 *     max: 50,
 *     windowMs: 900000, // 15 minutes
 *     keyGenerator: (req) => req.headers.get('user-id') || 'anonymous',
 *   },
 *   'rate-limit-user'
 * )
 * ```
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimiterConfig,
  keyPrefix: string = 'rate-limit'
): Promise<RateLimitResult> {
  try {
    // Check if request should be skipped
    if (config.skip?.(request) === true) {
      return {
        success: true,
        limit: config.max,
        remaining: config.max,
        resetTime: Date.now() + config.windowMs,
      }
    }

    // Generate rate limit key
    const key = generateRateLimitKey(request, keyPrefix, config.keyGenerator)

    // Get rate limit store and increment
    const store = await getRateLimitStore()
    const entry = await store.increment(key, config.windowMs)

    const result: RateLimitResult = {
      success: entry.count <= config.max,
      limit: config.max,
      remaining: Math.max(0, config.max - entry.count),
      resetTime: entry.resetTime,
    }

    if (!result.success) {
      result.retryAfter = Math.ceil((entry.resetTime - Date.now()) / 1000)

      // Log rate limit exceeded
      logger.warn(
        {
          key,
          count: entry.count,
          limit: config.max,
          resetTime: entry.resetTime,
          ip: request.headers.get('x-forwarded-for') ?? 'unknown',
          userAgent: request.headers.get('user-agent') ?? 'unknown',
          path: request.nextUrl.pathname,
        },
        'Rate limit exceeded'
      )

      // Call onLimitReached callback if provided
      if (config.onLimitReached) {
        config.onLimitReached(request, result)
      }
    }

    return result
  } catch (err) {
    logger.error({ err, keyPrefix }, 'Error applying rate limit')

    // Fail open - allow request if rate limiting fails
    return {
      success: true,
      limit: config.max,
      remaining: config.max,
      resetTime: Date.now() + config.windowMs,
    }
  }
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
  config: RateLimiterConfig
): NextResponse {
  if (config.standardHeaders) {
    response.headers.set('RateLimit-Limit', result.limit.toString())
    response.headers.set('RateLimit-Remaining', result.remaining.toString())
    response.headers.set('RateLimit-Reset', new Date(result.resetTime).toISOString())
  }

  if (config.legacyHeaders) {
    response.headers.set('X-RateLimit-Limit', result.limit.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString())
  }

  if (result.retryAfter !== undefined) {
    response.headers.set('Retry-After', result.retryAfter.toString())
  }

  return response
}

/**
 * Create rate limit error response
 */
export function createRateLimitErrorResponse(result: RateLimitResult, config: RateLimiterConfig): NextResponse {
  const response = NextResponse.json(
    {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: config.message,
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.resetTime,
        retryAfter: result.retryAfter,
      },
    },
    { status: 429 }
  )

  return addRateLimitHeaders(response, result, config)
}

/**
 * Rate limiter middleware factory
 *
 * Creates a rate limiter middleware for a specific rate limit type.
 * Uses centralized configuration from SECURITY_CONFIG with optional overrides.
 *
 * **Workflow**:
 * 1. Merges base config from SECURITY_CONFIG with custom overrides
 * 2. Returns async middleware function
 * 3. Middleware applies rate limit, returns 429 if exceeded
 * 4. Adds rate limit headers to all responses
 *
 * @param type - Rate limit type from SECURITY_CONFIG (e.g., 'auth', 'api')
 * @param customConfig - Optional config overrides (max, windowMs, etc.)
 * @returns Middleware function that applies rate limiting
 *
 * @example
 * ```typescript
 * // Use predefined configuration
 * const authLimiter = createRateLimiter('auth')
 *
 * // Override max requests for specific endpoint
 * const strictLimiter = createRateLimiter('api', { max: 10 })
 *
 * // Custom key generator for user-specific limiting
 * const userLimiter = createRateLimiter('api', {
 *   keyGenerator: (req) => {
 *     const userId = req.headers.get('x-user-id')
 *     return userId || req.headers.get('x-forwarded-for') || 'unknown'
 *   }
 * })
 * ```
 */
export function createRateLimiter(
  type: keyof typeof SECURITY_CONFIG.rateLimit,
  customConfig?: Partial<RateLimiterConfig>
) {
  return async (request: NextRequest, response?: NextResponse): Promise<NextResponse> => {
    const config: RateLimiterConfig = {
      ...SECURITY_CONFIG.rateLimit[type],
      ...customConfig,
    }

    const result = await applyRateLimit(request, config, `rate-limit-${type}`)

    if (!result.success) {
      return createRateLimitErrorResponse(result, config)
    }

    // Add rate limit headers to successful response
    const finalResponse = response ?? NextResponse.next()
    return addRateLimitHeaders(finalResponse, result, config)
  }
}

/**
 * Pre-configured rate limiters
 */
export const rateLimiters = {
  auth: createRateLimiter('auth'),
  api: createRateLimiter('api'),
  upload: createRateLimiter('upload'),
  passwordReset: createRateLimiter('passwordReset'),
  emailVerification: createRateLimiter('emailVerification'),
}

/**
 * General rate limiter middleware
 */
export async function rateLimiter(
  request: NextRequest,
  response: NextResponse,
  type: keyof typeof SECURITY_CONFIG.rateLimit = 'api'
): Promise<NextResponse> {
  try {
    const limiter = rateLimiters[type]
    return await limiter(request, response)
  } catch (err) {
    logger.error({ err, type, path: request.nextUrl.pathname }, 'Rate limiter error')
    return response
  }
}

/**
 * Rate limit middleware for API routes and server actions
 *
 * Wraps a Next.js route handler with rate limiting protection.
 * Returns 429 error if rate limit exceeded, otherwise executes handler
 * and adds rate limit headers to the response.
 *
 * **Error Handling**: If rate limiting fails, returns 500 error
 * (does not fail open to prevent masking infrastructure issues in route handlers).
 *
 * @param type - Rate limit type from SECURITY_CONFIG
 * @param handler - The route handler function to protect
 * @returns Wrapped handler with rate limiting
 *
 * @example
 * ```typescript
 * // Protect API route with authentication rate limits
 * export const POST = withRateLimit('auth', async (request: NextRequest) => {
 *   const body = await request.json()
 *   // ... authentication logic
 *   return NextResponse.json({ success: true })
 * })
 *
 * // Protect file upload endpoint with stricter limits
 * export const POST = withRateLimit('upload', async (request: NextRequest) => {
 *   const formData = await request.formData()
 *   // ... upload logic
 *   return NextResponse.json({ success: true })
 * })
 *
 * // Chain with other middleware
 * export const POST = withAuth(
 *   withRateLimit('api', async (request: NextRequest) => {
 *     // ... protected API logic
 *     return NextResponse.json({ data })
 *   })
 * )
 * ```
 */
export function withRateLimit(
  type: keyof typeof SECURITY_CONFIG.rateLimit,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const config = SECURITY_CONFIG.rateLimit[type]
      const result = await applyRateLimit(request, config, `rate-limit-${type}`)

      if (!result.success) {
        return createRateLimitErrorResponse(result, config)
      }

      // Execute handler
      const response = await handler(request)

      // Add rate limit headers to response
      // Use result from the check to calculate remaining (could be slightly stale but consistent with decision)
      return addRateLimitHeaders(response, result, config)
    } catch (err) {
      logger.error({ err, type }, 'Error in rate limit wrapper')

      // Return error response with rate limit headers
      const errorResponse = NextResponse.json({ error: 'Internal server error' }, { status: 500 })

      return errorResponse
    }
  }
}

/**
 * Get current rate limit status for a request
 */
export async function getRateLimitStatus(
  request: NextRequest,
  type: keyof typeof SECURITY_CONFIG.rateLimit
): Promise<RateLimitResult | null> {
  try {
    const config = SECURITY_CONFIG.rateLimit[type]
    const key = generateRateLimitKey(request, `rate-limit-${type}`)
    const store = await getRateLimitStore()
    const entry = await store.get(key)

    if (!entry) {
      return {
        success: true,
        limit: config.max,
        remaining: config.max,
        resetTime: Date.now() + config.windowMs,
      }
    }

    return {
      success: entry.count <= config.max,
      limit: config.max,
      remaining: Math.max(0, config.max - entry.count),
      resetTime: entry.resetTime,
      retryAfter: entry.count > config.max ? Math.ceil((entry.resetTime - Date.now()) / 1000) : undefined,
    }
  } catch (err) {
    logger.error({ err, type }, 'Error getting rate limit status')
    return null
  }
}

/**
 * Clear rate limit for a request (admin function)
 */
export async function clearRateLimit(
  request: NextRequest,
  type: keyof typeof SECURITY_CONFIG.rateLimit
): Promise<void> {
  try {
    const key = generateRateLimitKey(request, `rate-limit-${type}`)
    const store = await getRateLimitStore()
    await store.delete(key)

    logger.info({ key, type }, 'Rate limit cleared')
  } catch (err) {
    logger.error({ err, type }, 'Error clearing rate limit')
  }
}

/**
 * Get rate limiting statistics (requires custom store implementation)
 */
export async function getRateLimitStats(): Promise<RateLimitStats> {
  // This would require a more sophisticated store implementation
  // For now, return empty stats
  return {
    totalRequests: 0,
    blockedRequests: 0,
    blockRate: 0,
    topBlockedIPs: [],
  }
}

/**
 * Validate rate limit configuration
 */
export function validateRateLimitConfig(): ValidationResult {
  const issues: string[] = []

  try {
    const rateLimitConfig = SECURITY_CONFIG.rateLimit

    Object.entries(rateLimitConfig).forEach(([type, config]) => {
      if (config.max <= 0) {
        issues.push(`${type}: max must be greater than 0`)
      }

      if (config.windowMs <= 0) {
        issues.push(`${type}: windowMs must be greater than 0`)
      }

      if (!config.message || config.message.trim() === '') {
        issues.push(`${type}: message cannot be empty`)
      }
    })

    // Check production rate limiting setup
    if (process.env.NODE_ENV === 'production') {
      const hasVercelKV = process.env.KV_REST_API_URL !== undefined && process.env.KV_REST_API_TOKEN !== undefined

      if (hasVercelKV === false) {
        issues.push(
          'Production deployment detected but no persistent rate limit store configured. ' +
            'Consider setting up Vercel KV (KV_REST_API_URL, KV_REST_API_TOKEN) ' +
            'for multi-instance deployments.'
        )
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    }
  } catch (error) {
    issues.push(`Error validating rate limit config: ${error}`)
    return {
      isValid: false,
      issues,
    }
  }
}
