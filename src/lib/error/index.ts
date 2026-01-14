/**
 * Error Handling Module - Main Entry Point
 *
 * Central export point for error handling functionality.
 * Provides error classes, utilities, handlers, and codes.
 *
 * @remarks
 * **Import Guidelines**:
 * - Use specific error classes (AuthError, ValidationError, etc.)
 * - Import handleClientError for client-side code
 * - Import from './server' for server-side utilities
 * - Use ErrorCodes helpers for consistent error codes
 *
 * @module error
 */

import type { Logger } from '@/types/logger.types'
import { createErrorHandler } from './handlers/base.handler'

// Error types and interfaces
export type {
  AppError,
  AppErrorJSON,
  AppErrorOptions,
  AuthErrorContext,
  BaseErrorContext,
  DatabaseErrorContext,
  ErrorContext,
  ErrorType,
  NetworkErrorContext,
  ServerActionContext,
  ValidationErrorContext,
} from '@/types/error.types'

// Error enums
export {
  AuthErrorCodeEnum,
  AuthErrorTypeEnum,
  DatabaseErrorCodeEnum,
  ErrorDomainEnum,
  ErrorTypeEnum,
  NetworkErrorCodeEnum,
  ServerErrorCodeEnum,
  ValidationErrorCodeEnum,
} from '@/types/error.types'

// Error classes
export {
  AuthError,
  BaseAppError,
  BusinessError,
  ConfigurationError,
  DatabaseError,
  NetworkError,
  PermissionError,
  ValidationError,
} from './errors'

// Error handling utilities
export { createErrorHandler } from './handlers/base.handler'
export { isAppError, getErrorType } from './core/error.utils'

// Export client error handler
export { handleError as handleClientError } from './handlers/client.handler'

/**
 * Create a custom error handler with injected logger.
 * Use when you need a specialized handler with custom logging.
 *
 * @param logger - Logger instance to use for error logging
 * @returns Error handler with specified logger
 *
 * @example
 * ```typescript
 * import { buildLogger } from '@/lib/logger/server'
 * import { createCustomErrorHandler } from '@/lib/error'
 *
 * const logger = buildLogger('custom-module')
 * const errorHandler = createCustomErrorHandler(logger)
 *
 * const appError = errorHandler.handleError(error, { userId: '123' })
 * ```
 */
export function createCustomErrorHandler(logger: Logger): ReturnType<typeof createErrorHandler> {
  return createErrorHandler({ logger })
}

// Error codes and utilities (shared between client and server)
export {
  AUTH_ERROR_MESSAGES,
  DATABASE_ERROR_MESSAGES,
  ERROR_MESSAGES,
  ErrorCodeBuilder,
  ErrorCodes,
  NETWORK_ERROR_MESSAGES,
  SERVER_ERROR_MESSAGES,
  VALIDATION_ERROR_MESSAGES,
  type ErrorCodeStructure,
  type ErrorMessageMap,
} from './codes'
