/**
 * Worker rate limit adapter
 *
 * Provides a worker-friendly `applyRateLimitForWorker` that operates on
 * the Fetch `Request` object and returns a plain result. The adapter
 * prefers an Upstash-backed store when env vars are present, otherwise
 * it falls back to a local in-memory store (ephemeral).
 */
import type { RateLimiterConfig, RateLimitResult, RateLimitStore } from './shared'
import { MemoryRateLimitStore } from './memory'
import { UpstashRedisRateLimitStore } from './upstash'
import { isRateLimitEntry } from '../typeGuards'

// Simple singleton store for worker/dev; prefer Upstash when configured.
let store: MemoryRateLimitStore | UpstashRedisRateLimitStore | null = null
function getStore(): MemoryRateLimitStore | UpstashRedisRateLimitStore {
  if (store) return store

  // Use type-safe access for env vars
  const url =
    (globalThis as { KV_REST_API_URL?: string } | typeof process.env).KV_REST_API_URL ??
    (typeof process !== 'undefined' ? process.env.KV_REST_API_URL : undefined)
  const token =
    (globalThis as { KV_REST_API_TOKEN?: string } | typeof process.env).KV_REST_API_TOKEN ??
    (typeof process !== 'undefined' ? process.env.KV_REST_API_TOKEN : undefined)

  if (url && token) {
    try {
      store = new UpstashRedisRateLimitStore()
      return store
    } catch (err) {
      // Fall back to memory store on failure
      // eslint-disable-next-line no-console
      console.warn('Failed to initialize Upstash store, falling back to memory store', err)
    }
  }

  store = new MemoryRateLimitStore()
  return store
}

function getClientIp(request: Request): string {
  // Prefer Cloudflare provided client IP
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp

  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() ?? 'unknown'

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  return 'unknown'
}

function generateRateLimitKey(
  request: Request,
  prefix = 'rate-limit',
  keyGenerator?: (req: Request) => string
): string {
  if (keyGenerator) return `${prefix}:${keyGenerator(request)}`
  const ip = getClientIp(request)
  return `${prefix}:${ip}`
}

/**
 * Apply rate limiting for a worker Request.
 * @param request Incoming Fetch Request
 * @param config Rate limiter configuration
 * @param keyPrefix Optional key prefix
 */
export async function applyRateLimitForWorker(
  request: Request,
  config: RateLimiterConfig,
  keyPrefix = 'rate-limit'
): Promise<RateLimitResult> {
  try {
    const key = generateRateLimitKey(request, keyPrefix, config.keyGenerator)
    const s: RateLimitStore = getStore()
    const entry: unknown = await s.increment(key, config.windowMs)
    if (isRateLimitEntry(entry)) {
      const { count, resetTime } = entry
      const result: RateLimitResult = {
        success: count <= config.max,
        limit: config.max,
        remaining: Math.max(0, config.max - count),
        resetTime,
        retryAfter: count > config.max ? Math.max(1, Math.ceil((resetTime - Date.now()) / 1000)) : undefined,
      }
      return result
    } else {
      // Fail open if entry is invalid
      return {
        success: true,
        limit: config.max,
        remaining: config.max,
        resetTime: Date.now() + config.windowMs,
      }
    }
  } catch {
    // Fail open on errors to avoid blocking legitimate traffic
    return {
      success: true,
      limit: config.max,
      remaining: config.max,
      resetTime: Date.now() + config.windowMs,
    }
  }
}

export function addRateLimitHeadersToResponse(
  response: Response,
  result: RateLimitResult,
  config: RateLimiterConfig
): Response {
  const headers = new Headers(response.headers)

  if (config.standardHeaders) {
    headers.set('RateLimit-Limit', String(result.limit))
    headers.set('RateLimit-Remaining', String(result.remaining))
    headers.set('RateLimit-Reset', new Date(result.resetTime).toISOString())
  }

  if (config.legacyHeaders) {
    headers.set('X-RateLimit-Limit', String(result.limit))
    headers.set('X-RateLimit-Remaining', String(result.remaining))
    headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)))
  }

  if (result.retryAfter !== undefined) headers.set('Retry-After', String(result.retryAfter))

  return new Response(response.body, { status: response.status, headers })
}

export function createRateLimitErrorResponse(result: RateLimitResult, config: RateLimiterConfig): Response {
  const payload = JSON.stringify({
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: config.message ?? 'Too many requests',
      limit: result.limit,
      remaining: result.remaining,
      resetTime: result.resetTime,
      retryAfter: result.retryAfter,
    },
  })

  const res = new Response(payload, { status: 429, headers: { 'content-type': 'application/json' } })
  return addRateLimitHeadersToResponse(res, result, config)
}
