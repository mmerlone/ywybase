/**
 * Logger Utilities
 *
 * Helper functions for common logging patterns.
 *
 * @module logger/utils
 */

import type { Logger } from '@/types/logger.types'

/**
 * Timed operation interface returned by timeOperation().
 * Provides methods to complete or fail the tracked operation.
 */
export interface TimedOperation {
  /**
   * Mark operation as completed successfully.
   * Logs info with duration and optional context.
   *
   * @param context - Additional context to log
   */
  end: (context?: Record<string, unknown>) => void

  /**
   * Mark operation as failed.
   * Logs error with duration, error details, and optional context.
   *
   * @param err - The error that caused the failure
   * @param context - Additional context to log
   */
  fail: (err: Error, context?: Record<string, unknown>) => void
}

/**
 * Track operation duration automatically.
 * Returns an object with end() and fail() methods to complete the timing.
 *
 * @param logger - Logger instance to use for output
 * @param operation - Human-readable operation name
 * @param baseContext - Base context included in all log calls
 * @returns TimedOperation with end() and fail() methods
 *
 * @remarks
 * Automatically captures start time and calculates duration on completion.
 * Use end() for successful operations, fail() for errors.
 *
 * @example
 * ```typescript
 * // Success case
 * const timer = timeOperation(logger, 'Database query', { table: 'users' })
 * try {
 *   const users = await db.query('SELECT * FROM users')
 *   timer.end({ count: users.length })
 *   // Logs: "Database query completed" {table: "users", count: 42, duration: 123}
 * } catch (err) {
 *   timer.fail(err as Error, { query: 'SELECT * FROM users' })
 *   // Logs: "Database query failed" {table: "users", err: {...}, duration: 89}
 * }
 * ```
 *
 * @example
 * ```typescript
 * // API request timing
 * const timer = timeOperation(logger, 'External API call', { endpoint: '/users' })
 * const response = await fetch('/api/users')
 * if (response.ok) {
 *   timer.end({ status: response.status })
 * } else {
 *   timer.fail(new Error('API request failed'), { status: response.status })
 * }
 * ```
 */
export function timeOperation(
  logger: Logger,
  operation: string,
  baseContext: Record<string, unknown> = {}
): TimedOperation {
  const start = Date.now()

  return {
    end: (context = {}): void => {
      const duration = Date.now() - start
      logger.info({ ...baseContext, ...context, duration }, `${operation} completed`)
    },
    fail: (err: Error, context = {}): void => {
      const duration = Date.now() - start
      logger.error({ ...baseContext, ...context, err, duration }, `${operation} failed`)
    },
  }
}

/**
 * Mask an email address for PII-compliant logging.
 *
 * Obscures the local part of the email while keeping enough visible
 * for debugging purposes. The domain is preserved for context.
 *
 * **Masking Rules**:
 * - 1-2 chars: all masked (e.g., `a@...` → `*@example.com`)
 * - 3-4 chars: first char visible (e.g., `john@...` → `j***@example.com`)
 * - 5+ chars: first and last char visible (e.g., `username@...` → `u******e@example.com`)
 *
 * @param email - Email address to mask
 * @returns Masked email safe for logging
 *
 * @example
 * ```typescript
 * maskEmail('user@example.com')      // 'u**r@example.com'
 * maskEmail('ab@example.com')        // '**@example.com'
 * maskEmail('john.doe@example.com')  // 'j******e@example.com'
 * ```
 */
export const maskEmail = (email: string): string => {
  if (!email || typeof email !== 'string' || !email.includes('@')) return email

  const parts = email.split('@')
  const localPart = parts[0]
  const domain = parts[1]

  if (!localPart || !domain) return '***'

  const len = localPart.length

  let masked: string
  if (len <= 2) {
    masked = '*'.repeat(len)
  } else if (len <= 4) {
    masked = localPart[0] + '*'.repeat(len - 1)
  } else {
    masked = localPart[0] + '*'.repeat(len - 2) + localPart[len - 1]
  }

  return `${masked}@${domain}`
}
