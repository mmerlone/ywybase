import { Redis } from '@upstash/redis'
import logger from '../log'
import { isRateLimitEntry } from '../typeGuards'
import { type RateLimitStore, type RateLimitEntry } from '@/types/security.types'

// Augment globalThis with expected Cloudflare KV bindings so TypeScript
// accepts property access without unsafe casts.
declare global {
  interface GlobalThis {
    KV_REST_API_URL?: string
    KV_REST_API_TOKEN?: string
  }
}

export class UpstashRedisRateLimitStore implements RateLimitStore {
  private redis: Redis
  constructor() {
    // Use explicit type-safe access for env vars
    const getEnvUrl = (): string | undefined => {
      const maybe: unknown = Reflect.get(globalThis, 'KV_REST_API_URL')
      if (typeof maybe === 'string') return maybe
      if (typeof process !== 'undefined' && typeof process.env?.KV_REST_API_URL === 'string') {
        return String(process.env.KV_REST_API_URL)
      }
      return undefined
    }
    const getEnvToken = (): string | undefined => {
      const maybe: unknown = Reflect.get(globalThis, 'KV_REST_API_TOKEN')
      if (typeof maybe === 'string') return maybe
      if (typeof process !== 'undefined' && typeof process.env?.KV_REST_API_TOKEN === 'string') {
        return String(process.env.KV_REST_API_TOKEN)
      }
      return undefined
    }
    const url: string | undefined = getEnvUrl()
    const token: string | undefined = getEnvToken()
    if (!url || !token) {
      throw new Error('Upstash KV_REST_API_URL or KV_REST_API_TOKEN not defined')
    }
    this.redis = new Redis({ url, token })
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    try {
      const entry: unknown = await this.redis.get<RateLimitEntry>(key)
      if (!entry || typeof entry !== 'object' || entry === null) return null
      if (!isRateLimitEntry(entry)) {
        logger.warn({ key, entry }, 'Invalid rate limit entry format in Upstash Redis')
        return null
      }
      const { count, resetTime } = entry
      if (Date.now() > resetTime) {
        await this.redis.del(key)
        return null
      }
      return { count, resetTime }
    } catch (err: unknown) {
      logger.error({ err, key }, 'Error getting rate limit entry from Upstash Redis')
      return null
    }
  }

  async set(key: string, value: RateLimitEntry, ttl: number): Promise<void> {
    try {
      const ttlSeconds = Math.ceil(ttl / 1000)
      await this.redis.set(key, value, { ex: ttlSeconds })
    } catch (err: unknown) {
      logger.error({ err, key, ttl }, 'Error setting rate limit entry in Upstash Redis')
    }
  }

  async increment(key: string, windowMs: number = 60_000): Promise<RateLimitEntry> {
    try {
      const count = await this.redis.incr(key)
      if (count === 1) {
        const ttlSeconds = Math.ceil(windowMs / 1000)
        await this.redis.expire(key, ttlSeconds)
      }
      const ttl = await this.redis.ttl(key)
      const resetTime = Date.now() + (ttl && ttl > 0 ? ttl * 1000 : windowMs)
      return { count, resetTime }
    } catch (err: unknown) {
      logger.error({ err, key }, 'Error incrementing rate limit in Upstash Redis')
      return { count: 1, resetTime: Date.now() + windowMs }
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (err: unknown) {
      logger.error({ err, key }, 'Error deleting rate limit entry from Upstash Redis')
    }
  }
}
