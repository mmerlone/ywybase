/**
 * Base Error Handler
 *
 * Unified error handler with logger injection.
 * Works in both client and server environments.
 *
 * @remarks
 * **Features**:
 * - Logger dependency injection
 * - Context-based error routing
 * - Automatic status code-based log levels
 * - Error serialization
 *
 * **Usage Pattern**:
 * - Create handler with specific logger
 * - Use for consistent error handling
 * - Automatically logs errors with context
 *
 * @module error/handlers/base.handler
 */

import type { Logger, LogLevel } from '@/types/logger.types'
import { coreHandleError, isAppError } from '../core/error.factory'
import type { AppError, ErrorContext } from '@/types/error.types'

/**
 * Configuration options for error handler.
 */
export interface ErrorHandlerOptions {
  /** Logger instance (required) */
  logger: Logger
  /** Optional log level override */
  logLevel?: LogLevel
}

/**
 * Error handler instance with injected logger.
 */
export interface ErrorHandler {
  /**
   * Handle an error and convert to AppError.
   *
   * @param error - Error to handle
   * @param context - Optional error context
   * @returns Structured AppError
   */
  handleError: (error: unknown, context?: ErrorContext) => AppError
  /** Logger instance used by handler */
  logger: Logger
}

/**
 * Create an error handler with injected logger.
 * Provides consistent error handling with customizable logging.
 *
 * @param options - Handler configuration with logger
 * @returns Error handler instance
 *
 * @remarks
 * **Log Level Strategy**:
 * - 5xx errors → error level
 * - 4xx errors → warn level
 * - Others → info level
 *
 * @example
 * ```typescript
 * import { buildLogger } from '@/lib/logger/server'
 * import { createErrorHandler } from '@/lib/error/handlers/base.handler'
 *
 * const logger = buildLogger('auth-service')
 * const errorHandler = createErrorHandler({ logger })
 *
 * try {
 *   await riskyOperation()
 * } catch (err) {
 *   const appError = errorHandler.handleError(err, { userId: '123' })
 *   return { error: appError.toJSON() }
 * }
 * ```
 */
export function createErrorHandler(options: ErrorHandlerOptions): ErrorHandler {
  const { logger } = options // Logger must be provided

  // Log errors with appropriate levels using context-first pattern
  function logError(error: AppError): void {
    const { message, code, context, stack } = error
    const logContext = {
      code,
      ...context,
      stack: stack !== null || (context.originalError as Error)?.stack,
      timestamp: new Date().toISOString(),
      errorName: error.constructor.name,
    }
    const statusCode = error.statusCode ?? 500

    if (statusCode >= 500) {
      logger.error(logContext, message)
    } else if (statusCode >= 400) {
      logger.warn(logContext, message)
    } else {
      logger.info(logContext, message)
    }
  }

  return {
    handleError: (error: unknown, context: ErrorContext = {}): AppError => {
      // Use core logic but add logging
      const appError = coreHandleError(error, context)

      // Only log if it's a new error (not already handled)
      if (!isAppError(error)) {
        logError(appError)
      }

      return appError
    },
    logger,
  }
}

// Note: Do not create a default handler here as it would be evaluated at module load time
// and cause issues with client/server environment detection.
// Instead, client.handler.ts and server.handler.ts create their own instances.

// Re-export getErrorType from core for convenience
export { getErrorType } from '../core/error.utils'

// Re-export types and enums for convenience
export type { AppError, ErrorContext } from '@/types/error.types'
export { AuthErrorTypeEnum } from '@/types/error.types'
