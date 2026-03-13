/**
 * Type guard for RateLimitEntry
 */
import type { RateLimitEntry } from './rateLimit/shared'

export function isRateLimitEntry(obj: unknown): obj is RateLimitEntry {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as { count?: unknown }).count === 'number' &&
    typeof (obj as { resetTime?: unknown }).resetTime === 'number'
  )
}
