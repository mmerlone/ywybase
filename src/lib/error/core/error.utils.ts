/**
 * Error Utility Functions
 *
 * Type guards and utility functions for error handling.
 * Helps identify error types and context categories.
 *
 * @module error/core/error.utils
 */

import type { ErrorContext, AppError, AppErrorJSON } from '@/types/error.types'

/**
 * Type guard to check if an unknown value matches the AppErrorJSON structure.
 *
 * @param error - Value to check
 * @returns True if value is a valid AppErrorJSON object
 */
export function isAppErrorJSON(error: unknown): error is AppErrorJSON {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'errorType' in error &&
    'isOperational' in error
  )
}

/**
 * Check if error context contains authentication-related fields.
 *
 * @param context - Error context to check
 * @returns True if context has auth fields (provider, authMethod, authErrorType)
 *
 * @example
 * ```typescript
 * if (isAuthErrorContext(context)) {
 *   console.log('Auth provider:', context.provider)
 * }
 * ```
 */
export function isAuthErrorContext(context: ErrorContext): context is ErrorContext {
  return 'provider' in context || 'authMethod' in context || 'authErrorType' in context
}

/**
 * Check if error context contains network-related fields.
 *
 * @param context - Error context to check
 * @returns True if context has network fields (url, method)
 */
export function isNetworkErrorContext(context: ErrorContext): boolean {
  return 'url' in context || 'method' in context
}

/**
 * Check if error context contains validation-related fields.
 *
 * @param context - Error context to check
 * @returns True if context has validation fields (field, validationErrors)
 */
export function isValidationErrorContext(context: ErrorContext): boolean {
  return 'field' in context || 'validationErrors' in context
}

/**
 * Check if error context contains database-related fields.
 *
 * @param context - Error context to check
 * @returns True if context has database fields (table, constraint)
 */
export function isDatabaseErrorContext(context: ErrorContext): boolean {
  return 'table' in context || 'constraint' in context
}

/**
 * Check if error context contains server action fields.
 *
 * @param context - Error context to check
 * @returns True if context has server action fields (operationType, hook)
 */
export function isServerActionContext(context: ErrorContext): boolean {
  return 'operationType' in context || 'hook' in context
}

/**
 * Determine error type from context properties.
 * Uses type guards to categorize errors.
 *
 * @param context - Error context to analyze
 * @returns Error type string (AUTH_ERROR, NETWORK_ERROR, etc.)
 *
 * @example
 * ```typescript
 * const type = getErrorType({ url: '/api/data', method: 'GET' })
 * console.log(type) // "NETWORK_ERROR"
 * ```
 */
export function getErrorType(context: ErrorContext): string {
  if (isAuthErrorContext(context)) return 'AUTH_ERROR'
  if (isNetworkErrorContext(context)) return 'NETWORK_ERROR'
  if (isValidationErrorContext(context)) return 'VALIDATION_ERROR'
  if (isDatabaseErrorContext(context)) return 'DATABASE_ERROR'
  if (isServerActionContext(context)) return 'SERVER_ACTION_ERROR'
  return 'UNKNOWN_ERROR'
}

/**
 * Type guard to check if an unknown value is an AppError.
 * Verifies presence of required AppError properties.
 *
 * @param error - Value to check
 * @returns True if value is an AppError instance
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation()
 * } catch (err) {
 *   if (isAppError(err)) {
 *     console.log('Error code:', err.code)
 *     console.log('Context:', err.context)
 *   }
 * }
 * ```
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof Error && 'code' in error && 'context' in error && 'isOperational' in error
}

/**
 * Check if an error is a Next.js dynamic server usage error.
 *
 * These errors occur when code using dynamic APIs (cookies, headers)
 * runs during static generation. Next.js uses these as control flow
 * to automatically opt routes into dynamic rendering.
 *
 * **Important**: These errors should be re-thrown, not caught/wrapped.
 * Next.js needs to catch them to properly handle static/dynamic detection.
 *
 * @param error - Error to check
 * @returns True if this is a Next.js dynamic server usage error
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation()
 * } catch (error) {
 *   // Re-throw Next.js control flow errors
 *   if (isDynamicServerError(error)) {
 *     throw error
 *   }
 *   // Handle other errors
 *   handleClientError(error, { operation: 'someOperation' })
 * }
 * ```
 */
export function isDynamicServerError(error: unknown): boolean {
  // Next.js marks dynamic server usage errors with a specific digest property
  // This is the public contract - errors thrown during static generation
  // for dynamic API usage (cookies, headers) have digest: 'DYNAMIC_SERVER_USAGE'
  return (
    error instanceof Error &&
    'digest' in error &&
    (error as Error & { digest?: string }).digest === 'DYNAMIC_SERVER_USAGE'
  )
}
