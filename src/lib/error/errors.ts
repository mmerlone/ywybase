/**
 * Application Error Classes
 *
 * Structured error classes for different error categories.
 * All extend BaseAppError with domain-specific context.
 *
 * @remarks
 * **Error Hierarchy**:
 * - BaseAppError: Foundation for all application errors
 * - AuthError: Authentication and authorization failures
 * - ValidationError: User input validation failures
 * - DatabaseError: Database operation failures
 * - NetworkError: HTTP and network failures
 * - PermissionError: Access control violations
 * - ConfigurationError: Environment/config issues
 * - BusinessError: Business logic violations
 *
 * @module error/errors
 */

import { ErrorCodes } from './codes'
import { ErrorTypeEnum } from '@/types/error.types'
import type {
  AppError,
  AppErrorOptions,
  AuthErrorContext,
  DatabaseErrorContext,
  ValidationErrorContext,
  NetworkErrorContext,
  BaseErrorContext,
  AppErrorJSON,
  ErrorType,
} from '@/types/error.types'

/**
 * Base application error class.
 * Foundation for all structured application errors.
 *
 * @template TContext - Context type extending BaseErrorContext
 *
 * @remarks
 * **Features**:
 * - Strongly-typed error codes
 * - Structured context for debugging
 * - Operational vs Programming error classification
 * - HTTP status code mapping
 * - Error chaining via cause
 * - JSON serialization
 *
 * **Operational vs Programming Errors**:
 * - Operational: Expected errors (invalid input, network failure)
 * - Programming: Bugs and unexpected conditions
 *
 * @example
 * ```typescript
 * const error = new BaseAppError({
 *   code: 'DATABASE/NOT_FOUND',
 *   message: 'User not found',
 *   context: { userId: '123' },
 *   statusCode: 404,
 *   isOperational: true
 * });
 * ```
 */
export class BaseAppError<TContext extends BaseErrorContext = BaseErrorContext>
  extends Error
  implements AppError<TContext>
{
  public readonly code: string
  public readonly context: TContext
  public readonly isOperational!: boolean
  public readonly statusCode?: number
  public override readonly cause?: Error | AppError | null
  public readonly errorType: ErrorType

  constructor(options: AppErrorOptions<TContext>) {
    super(options.message)
    this.errorType = ErrorTypeEnum.APP_ERROR as ErrorType
    this.code = options.code
    this.context = (options.context || {}) as TContext
    this.isOperational = options.isOperational ?? true
    this.statusCode = options.statusCode
    this.cause = options.cause

    Error.captureStackTrace?.(this, this.constructor)
  }

  toJSON(): AppErrorJSON<TContext> {
    return {
      code: this.code,
      message: this.message,
      ...(Object.keys(this.context).length > 0 && { context: this.context }),
      ...(this.statusCode !== null && { statusCode: this.statusCode }),
      isOperational: this.isOperational,
      errorType: this.errorType,
      ...(this.stack !== null && { stack: this.stack }),
    }
  }
}

/**
 * Authentication and authorization error.
 * Used for login failures, session issues, and permission problems.
 *
 * @remarks
 * Always operational (expected errors).
 * Includes context for auth provider, method, and error type.
 *
 * @example
 * ```typescript
 * const error = new AuthError({
 *   code: 'AUTH/INVALID_CREDENTIALS',
 *   message: 'Invalid email or password',
 *   context: {
 *     provider: 'supabase',
 *     authMethod: 'email'
 *   },
 *   statusCode: 401
 * });
 * ```
 */
export class AuthError extends BaseAppError<AuthErrorContext> {
  constructor(options: Omit<AppErrorOptions<AuthErrorContext>, 'isOperational'>) {
    super({ ...options, isOperational: true })
    Object.defineProperty(this, 'errorType', {
      value: ErrorTypeEnum.AUTH_ERROR as ErrorType,
      writable: false,
      enumerable: true,
      configurable: false,
    })
  }
}

/**
 * Validation error for user input.
 * Used when data doesn't meet required constraints or formats.
 *
 * @remarks
 * Always operational with 400 status code.
 * Automatically uses VALIDATION/INVALID_INPUT code.
 *
 * @example
 * ```typescript
 * const error = new ValidationError(
 *   'Email format is invalid',
 *   { field: 'email', validationErrors: [zodError] }
 * );
 * ```
 */
export class ValidationError extends BaseAppError<ValidationErrorContext> {
  constructor(message: string, context?: ValidationErrorContext) {
    super({
      code: ErrorCodes.validation.invalidInput(),
      message,
      context: context || {},
      isOperational: true,
      statusCode: 400,
    })
    Object.defineProperty(this, 'errorType', {
      value: ErrorTypeEnum.VALIDATION_ERROR as ErrorType,
      writable: false,
      enumerable: true,
      configurable: false,
    })
  }
}

/**
 * Database operation error.
 * Used for query failures, connection issues, and data integrity problems.
 *
 * @remarks
 * Not operational (indicates system issues).
 * Includes context for table, constraint, and Supabase error codes.
 *
 * @example
 * ```typescript
 * const error = new DatabaseError({
 *   code: 'DATABASE/NOT_FOUND',
 *   message: 'Record not found',
 *   context: {
 *     table: 'users',
 *     query: 'SELECT * FROM users WHERE id = $1'
 *   },
 *   statusCode: 404
 * });
 * ```
 */
export class DatabaseError extends BaseAppError<DatabaseErrorContext> {
  constructor(options: Omit<AppErrorOptions<DatabaseErrorContext>, 'isOperational'>) {
    super({ ...options, isOperational: false })
    Object.defineProperty(this, 'errorType', {
      value: ErrorTypeEnum.DATABASE_ERROR as ErrorType,
      writable: false,
      enumerable: true,
      configurable: false,
    })
  }
}

/**
 * Network and API communication error.
 * Used for HTTP failures, timeouts, and external service problems.
 *
 * @remarks
 * Operational error (retryable).
 * Includes context for URL, method, timeout, and retry count.
 *
 * @example
 * ```typescript
 * const error = new NetworkError({
 *   code: 'NETWORK/CONNECTION_ERROR',
 *   message: 'Failed to connect to API',
 *   context: {
 *     url: 'https://api.example.com/data',
 *     method: 'GET',
 *     timeout: 5000,
 *     retryCount: 3
 *   },
 *   statusCode: 503
 * });
 * ```
 */
export class NetworkError extends BaseAppError<NetworkErrorContext> {
  constructor(options: Omit<AppErrorOptions<NetworkErrorContext>, 'isOperational'>) {
    super({ ...options, isOperational: true })
    Object.defineProperty(this, 'errorType', {
      value: ErrorTypeEnum.NETWORK_ERROR as ErrorType,
      writable: false,
      enumerable: true,
      configurable: false,
    })
  }
}

/**
 * Permission and authorization error.
 * Used when user lacks required access rights or roles.
 *
 * @remarks
 * Operational error (expected in access control).
 * Use for role-based or resource-level permission failures.
 *
 * @example
 * ```typescript
 * const error = new PermissionError({
 *   code: 'AUTH/FORBIDDEN',
 *   message: 'Insufficient permissions',
 *   context: {
 *     userId: '123',
 *     requiredRole: 'admin',
 *     action: 'delete_user'
 *   },
 *   statusCode: 403
 * });
 * ```
 */
export class PermissionError extends BaseAppError<BaseErrorContext> {
  constructor(options: Omit<AppErrorOptions<BaseErrorContext>, 'isOperational'>) {
    super({ ...options, isOperational: true })
    Object.defineProperty(this, 'errorType', {
      value: ErrorTypeEnum.PERMISSION_ERROR as ErrorType,
      writable: false,
      enumerable: true,
      configurable: false,
    })
  }
}

/**
 * Configuration error.
 * Used for missing or invalid environment variables and config.
 *
 * @remarks
 * Not operational (requires developer action).
 * Typically causes app initialization to fail.
 *
 * @example
 * ```typescript
 * const error = new ConfigurationError({
 *   code: 'CONFIGURATION/MISSING_ENV_VAR',
 *   message: 'Required environment variable not set',
 *   context: {
 *     variable: 'DATABASE_URL',
 *     file: '.env.local'
 *   },
 *   statusCode: 500
 * });
 * ```
 */
export class ConfigurationError extends BaseAppError<BaseErrorContext> {
  constructor(options: Omit<AppErrorOptions<BaseErrorContext>, 'isOperational'>) {
    super({ ...options, isOperational: false })
    Object.defineProperty(this, 'errorType', {
      value: ErrorTypeEnum.CONFIGURATION_ERROR as ErrorType,
      writable: false,
      enumerable: true,
      configurable: false,
    })
  }
}

/**
 * Business logic error.
 * Used for application-specific business rule violations.
 *
 * @remarks
 * Operational error (expected in business workflows).
 * Use for domain-specific validation and rules.
 *
 * @example
 * ```typescript
 * const error = new BusinessError({
 *   code: 'BUSINESS/INSUFFICIENT_FUNDS',
 *   message: 'Account balance too low',
 *   context: {
 *     balance: 50,
 *     required: 100,
 *     userId: '123'
 *   },
 *   statusCode: 400
 * });
 * ```
 */
export class BusinessError extends BaseAppError<BaseErrorContext> {
  constructor(options: Omit<AppErrorOptions<BaseErrorContext>, 'isOperational'>) {
    super({ ...options, isOperational: true })
    Object.defineProperty(this, 'errorType', {
      value: ErrorTypeEnum.BUSINESS_ERROR as ErrorType,
      writable: false,
      enumerable: true,
      configurable: false,
    })
  }
}
