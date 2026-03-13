import type { RateLimitEntry, RateLimitStore } from './shared'

/**
 * In-memory rate limit store for worker/dev environments.
 *
 * Notes:
 * - This implementation is ephemeral and not suitable for multi-node
 *   production deployments. For production, use Upstash or Durable Objects.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>()
  private timers = new Map<string, number>()

  /**
   * Retrieve the entry for a key, or `null` if missing/expired.
   */
  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key)
    if (!entry) return null

    if (Date.now() > entry.resetTime) {
      this.store.delete(key)
      const t = this.timers.get(key)
      if (t !== undefined) globalThis.clearTimeout(t)
      this.timers.delete(key)
      return null
    }

    return entry
  }

  /**
   * Set an entry with TTL (ms).
   */
  async set(key: string, value: RateLimitEntry, ttl: number): Promise<void> {
    const existingTimer = this.timers.get(key)
    if (existingTimer !== undefined) globalThis.clearTimeout(existingTimer)

    this.store.set(key, value)

    const timer = globalThis.setTimeout(() => {
      this.store.delete(key)
      this.timers.delete(key)
    }, ttl)

    // Node and Workers return different timer types; use Number(timer) for consistency
    this.timers.set(key, Number(timer))
  }

  /**
   * Increment the counter for a key within the given window.
   */
  async increment(key: string, windowMs: number = 60_000): Promise<RateLimitEntry> {
    const existing = await this.get(key)

    if (existing) {
      existing.count++
      this.store.set(key, existing)
      return existing
    }

    const resetTime = Date.now() + windowMs
    const newEntry: RateLimitEntry = { count: 1, resetTime }
    await this.set(key, newEntry, windowMs)
    return newEntry
  }

  /**
   * Delete a rate limit key (administrative).
   */
  async delete(key: string): Promise<void> {
    const t = this.timers.get(key)
    if (t !== undefined) globalThis.clearTimeout(t)
    this.timers.delete(key)
    this.store.delete(key)
  }
}
