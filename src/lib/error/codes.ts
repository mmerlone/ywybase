/**
 * Error Code Management
 *
 * Central registry for error codes and user-facing messages.
 * Uses DOMAIN/TYPE_DESCRIPTION format for structured error handling.
 *
 * @remarks
 * **Error Code Structure**: `DOMAIN/TYPE_DESCRIPTION`
 * - DOMAIN: AUTH, VALIDATION, DATABASE, NETWORK, SERVER, CONFIGURATION
 * - TYPE_DESCRIPTION: Specific error type (e.g., INVALID_CREDENTIALS)
 *
 * **Features**:
 * - Strongly-typed error codes and messages
 * - Centralized message management
 * - Domain-based categorization
 * - Code parsing and validation utilities
 *
 * @module error/codes
 */

import {
  ErrorDomainEnum,
  AuthErrorCodeEnum,
  ValidationErrorCodeEnum,
  DatabaseErrorCodeEnum,
  NetworkErrorCodeEnum,
  ServerErrorCodeEnum,
  ConfigurationErrorCodeEnum,
} from '@/types/error.types'

/**
 * Parsed error code structure.
 * Represents a deconstructed error code with domain and description.
 */
export interface ErrorCodeStructure {
  /** Error domain (AUTH, VALIDATION, DATABASE, etc.) */
  domain: ErrorDomainEnum
  /** Error type (same as domain for legacy compatibility) */
  type: string
  /** Specific error description */
  description: string
}

/**
 * Read-only mapping of error codes to user-facing messages.
 */
export interface ErrorMessageMap {
  readonly [key: string]: string
}

/**
 * Authentication error messages.
 * Maps auth error codes to user-friendly messages.
 */
export const AUTH_ERROR_MESSAGES: ErrorMessageMap = {
  [`${ErrorDomainEnum.AUTH}/${AuthErrorCodeEnum.INVALID_CREDENTIALS}`]: 'Invalid email or password',
  [`${ErrorDomainEnum.AUTH}/${AuthErrorCodeEnum.EMAIL_NOT_CONFIRMED}`]: 'Please verify your email before logging in',
  [`${ErrorDomainEnum.AUTH}/${AuthErrorCodeEnum.SESSION_EXPIRED}`]: 'Your session has expired. Please log in again',
  [`${ErrorDomainEnum.AUTH}/${AuthErrorCodeEnum.USER_NOT_FOUND}`]: 'User account not found',
  [`${ErrorDomainEnum.AUTH}/${AuthErrorCodeEnum.WEAK_PASSWORD}`]: 'Password does not meet security requirements',
  [`${ErrorDomainEnum.AUTH}/${AuthErrorCodeEnum.EMAIL_ALREADY_IN_USE}`]: 'This email is already in use',
  [`${ErrorDomainEnum.AUTH}/${AuthErrorCodeEnum.INVALID_TOKEN}`]: 'Invalid or expired authentication token',
  [`${ErrorDomainEnum.AUTH}/${AuthErrorCodeEnum.UNKNOWN_SUPABASE_ERROR}`]: 'Authentication service error',
}

/**
 * Validation error messages
 */
export const VALIDATION_ERROR_MESSAGES: ErrorMessageMap = {
  [`${ErrorDomainEnum.VALIDATION}/${ValidationErrorCodeEnum.INVALID_INPUT}`]: 'Invalid input provided',
  [`${ErrorDomainEnum.VALIDATION}/${ValidationErrorCodeEnum.DUPLICATE_ENTRY}`]: 'This record already exists',
  [`${ErrorDomainEnum.VALIDATION}/${ValidationErrorCodeEnum.CONSTRAINT_VIOLATION}`]: 'Data validation failed',
  [`${ErrorDomainEnum.VALIDATION}/${ValidationErrorCodeEnum.FOREIGN_KEY_VIOLATION}`]:
    'Referenced record does not exist',
  [`${ErrorDomainEnum.VALIDATION}/${ValidationErrorCodeEnum.NOT_NULL_VIOLATION}`]: 'Required field is missing',
  [`${ErrorDomainEnum.VALIDATION}/${ValidationErrorCodeEnum.SAME_PASSWORD}`]:
    'New password must be different from your current password',
}

/**
 * Database error messages
 */
export const DATABASE_ERROR_MESSAGES: ErrorMessageMap = {
  [`${ErrorDomainEnum.DATABASE}/${DatabaseErrorCodeEnum.NOT_FOUND}`]: 'Record not found',
  [`${ErrorDomainEnum.DATABASE}/${DatabaseErrorCodeEnum.RELATION_NOT_FOUND}`]: 'Data table not found',
  [`${ErrorDomainEnum.DATABASE}/${DatabaseErrorCodeEnum.NO_CONTENT}`]: 'No data available',
  [`${ErrorDomainEnum.DATABASE}/${DatabaseErrorCodeEnum.UNKNOWN_POSTGREST_ERROR}`]: 'Database operation failed',
  [`${ErrorDomainEnum.DATABASE}/${DatabaseErrorCodeEnum.UNKNOWN_ERROR}`]: 'Database operation failed',
}

/**
 * Network error messages
 */
export const NETWORK_ERROR_MESSAGES: ErrorMessageMap = {
  [`${ErrorDomainEnum.NETWORK}/${NetworkErrorCodeEnum.CONNECTION_ERROR}`]: 'Network connection failed',
  [`${ErrorDomainEnum.NETWORK}/${NetworkErrorCodeEnum.TIMEOUT}`]: 'Request timed out',
  [`${ErrorDomainEnum.NETWORK}/${NetworkErrorCodeEnum.RATE_LIMIT_EXCEEDED}`]:
    'Too many requests. Please try again later',
}

/**
 * Server error messages
 */
export const SERVER_ERROR_MESSAGES: ErrorMessageMap = {
  [`${ErrorDomainEnum.SERVER}/${ServerErrorCodeEnum.UNKNOWN_ERROR}`]: 'An unexpected error occurred',
  [`${ErrorDomainEnum.SERVER}/${ServerErrorCodeEnum.INTERNAL_ERROR}`]: 'Internal server error',
}

/**
 * Configuration error messages
 */
export const CONFIGURATION_ERROR_MESSAGES: ErrorMessageMap = {
  [`${ErrorDomainEnum.CONFIGURATION}/${ConfigurationErrorCodeEnum.MISSING_ENV_VAR}`]:
    'Required environment variable is missing',
}

/**
 * Combined error message map
 */
export const ERROR_MESSAGES: ErrorMessageMap = {
  ...AUTH_ERROR_MESSAGES,
  ...VALIDATION_ERROR_MESSAGES,
  ...DATABASE_ERROR_MESSAGES,
  ...NETWORK_ERROR_MESSAGES,
  ...SERVER_ERROR_MESSAGES,
  ...CONFIGURATION_ERROR_MESSAGES,
}

/**
 * Utility class for creating and managing structured error codes.
 * Provides methods for code creation, parsing, and message retrieval.
 *
 * @remarks
 * All methods are static - no instantiation needed.
 *
 * @example
 * ```typescript
 * // Create error code
 * const code = ErrorCodeBuilder.create(ErrorDomainEnum.AUTH, 'INVALID_CREDENTIALS')
 * // Result: "AUTH/INVALID_CREDENTIALS"
 *
 * // Get message
 * const message = ErrorCodeBuilder.getMessage(code)
 * // Result: "Invalid email or password"
 *
 * // Parse code
 * const parsed = ErrorCodeBuilder.parse(code)
 * // Result: { domain: 'AUTH', type: 'AUTH', description: 'INVALID_CREDENTIALS' }
 * ```
 */
export class ErrorCodeBuilder {
  /**
   * Create an error code in DOMAIN/TYPE_DESCRIPTION format.
   *
   * @param domain - Error domain from ErrorDomainEnum
   * @param type - Specific error type
   * @returns Formatted error code string
   *
   * @example
   * ```typescript
   * const code = ErrorCodeBuilder.create(ErrorDomainEnum.DATABASE, 'NOT_FOUND')
   * console.log(code) // "DATABASE/NOT_FOUND"
   * ```
   */
  static create(domain: ErrorDomainEnum, type: string): string {
    return `${domain}/${type}`
  }

  /**
   * Parse an error code into its domain, type, and description components.
   *
   * @param errorCode - Error code string to parse
   * @returns Parsed structure or null if invalid format
   *
   * @example
   * ```typescript
   * const parsed = ErrorCodeBuilder.parse('AUTH/INVALID_CREDENTIALS')
   * // { domain: 'AUTH', type: 'AUTH', description: 'INVALID_CREDENTIALS' }
   *
   * const invalid = ErrorCodeBuilder.parse('INVALID_FORMAT')
   * // null
   * ```
   */
  static parse(errorCode: string): ErrorCodeStructure | null {
    const parts = errorCode.split('/')
    if (parts.length !== 2) return null

    const [domain, description] = parts

    // Validate domain
    if (!Object.values(ErrorDomainEnum).includes(domain as ErrorDomainEnum)) {
      return null
    }

    return {
      domain: domain as ErrorDomainEnum,
      type: domain ?? '',
      description: description ?? '',
    }
  }

  /**
   * Get the user-facing error message for an error code.
   *
   * @param errorCode - Error code to get message for
   * @returns User-friendly error message or generic fallback
   *
   * @example
   * ```typescript
   * const message = ErrorCodeBuilder.getMessage('AUTH/INVALID_CREDENTIALS')
   * console.log(message) // "Invalid email or password"
   *
   * const unknown = ErrorCodeBuilder.getMessage('UNKNOWN/CODE')
   * console.log(unknown) // "An error occurred"
   * ```
   */
  static getMessage(errorCode: string): string {
    return ERROR_MESSAGES[errorCode] ?? 'An error occurred'
  }

  /**
   * Check if an error code belongs to a specific domain.
   *
   * @param errorCode - Error code to check
   * @param domain - Domain to test against
   * @returns True if code belongs to domain
   *
   * @example
   * ```typescript
   * const isAuth = ErrorCodeBuilder.isDomain('AUTH/INVALID_CREDENTIALS', ErrorDomainEnum.AUTH)
   * console.log(isAuth) // true
   *
   * const isDb = ErrorCodeBuilder.isDomain('AUTH/INVALID_CREDENTIALS', ErrorDomainEnum.DATABASE)
   * console.log(isDb) // false
   * ```
   */
  static isDomain(errorCode: string, domain: ErrorDomainEnum): boolean {
    return errorCode.startsWith(`${domain}/`)
  }
}

/**
 * Convenience functions for creating domain-specific error codes.
 * Organized by error domain with methods for each error type.
 *
 * @remarks
 * Use these helpers instead of manually constructing error codes.
 * Ensures consistency and prevents typos.
 *
 * @example
 * ```typescript
 * // Authentication errors
 * const code = ErrorCodes.auth.invalidCredentials()
 * // "AUTH/INVALID_CREDENTIALS"
 *
 * // Validation errors
 * const code = ErrorCodes.validation.invalidInput()
 * // "VALIDATION/INVALID_INPUT"
 *
 * // Database errors
 * const code = ErrorCodes.database.notFound()
 * // "DATABASE/NOT_FOUND"
 * ```
 */
export const ErrorCodes = {
  auth: {
    invalidCredentials: (): string =>
      ErrorCodeBuilder.create(ErrorDomainEnum.AUTH, AuthErrorCodeEnum.INVALID_CREDENTIALS),
    emailNotConfirmed: (): string =>
      ErrorCodeBuilder.create(ErrorDomainEnum.AUTH, AuthErrorCodeEnum.EMAIL_NOT_CONFIRMED),
    sessionExpired: (): string => ErrorCodeBuilder.create(ErrorDomainEnum.AUTH, AuthErrorCodeEnum.SESSION_EXPIRED),
    userNotFound: (): string => ErrorCodeBuilder.create(ErrorDomainEnum.AUTH, AuthErrorCodeEnum.USER_NOT_FOUND),
    weakPassword: (): string => ErrorCodeBuilder.create(ErrorDomainEnum.AUTH, AuthErrorCodeEnum.WEAK_PASSWORD),
    emailAlreadyInUse: (): string =>
      ErrorCodeBuilder.create(ErrorDomainEnum.AUTH, AuthErrorCodeEnum.EMAIL_ALREADY_IN_USE),
    invalidToken: (): string => ErrorCodeBuilder.create(ErrorDomainEnum.AUTH, AuthErrorCodeEnum.INVALID_TOKEN),
    unknownError: (): string => ErrorCodeBuilder.create(ErrorDomainEnum.AUTH, AuthErrorCodeEnum.UNKNOWN_SUPABASE_ERROR),
  },
  validation: {
    invalidInput: (): string =>
      ErrorCodeBuilder.create(ErrorDomainEnum.VALIDATION, ValidationErrorCodeEnum.INVALID_INPUT),
    duplicateEntry: (): string =>
      ErrorCodeBuilder.create(ErrorDomainEnum.VALIDATION, ValidationErrorCodeEnum.DUPLICATE_ENTRY),
    constraintViolation: (): string =>
      ErrorCodeBuilder.create(ErrorDomainEnum.VALIDATION, ValidationErrorCodeEnum.CONSTRAINT_VIOLATION),
    foreignKeyViolation: (): string =>
      ErrorCodeBuilder.create(ErrorDomainEnum.VALIDATION, ValidationErrorCodeEnum.FOREIGN_KEY_VIOLATION),
    notNullViolation: (): string =>
      ErrorCodeBuilder.create(ErrorDomainEnum.VALIDATION, ValidationErrorCodeEnum.NOT_NULL_VIOLATION),
    samePassword: (): string =>
      ErrorCodeBuilder.create(ErrorDomainEnum.VALIDATION, ValidationErrorCodeEnum.SAME_PASSWORD),
  },
  database: {
    notFound: (): string => ErrorCodeBuilder.create(ErrorDomainEnum.DATABASE, DatabaseErrorCodeEnum.NOT_FOUND),
    relationNotFound: (): string =>
      ErrorCodeBuilder.create(ErrorDomainEnum.DATABASE, DatabaseErrorCodeEnum.RELATION_NOT_FOUND),
    noContent: (): string => ErrorCodeBuilder.create(ErrorDomainEnum.DATABASE, DatabaseErrorCodeEnum.NO_CONTENT),
    unknownPostgrestError: (): string =>
      ErrorCodeBuilder.create(ErrorDomainEnum.DATABASE, DatabaseErrorCodeEnum.UNKNOWN_POSTGREST_ERROR),
    unknownError: (): string => ErrorCodeBuilder.create(ErrorDomainEnum.DATABASE, DatabaseErrorCodeEnum.UNKNOWN_ERROR),
  },
  network: {
    connectionError: (): string =>
      ErrorCodeBuilder.create(ErrorDomainEnum.NETWORK, NetworkErrorCodeEnum.CONNECTION_ERROR),
    timeout: (): string => ErrorCodeBuilder.create(ErrorDomainEnum.NETWORK, NetworkErrorCodeEnum.TIMEOUT),
    rateLimitExceeded: (): string =>
      ErrorCodeBuilder.create(ErrorDomainEnum.NETWORK, NetworkErrorCodeEnum.RATE_LIMIT_EXCEEDED),
  },
  server: {
    unknownError: (): string => ErrorCodeBuilder.create(ErrorDomainEnum.SERVER, ServerErrorCodeEnum.UNKNOWN_ERROR),
    internalError: (): string => ErrorCodeBuilder.create(ErrorDomainEnum.SERVER, ServerErrorCodeEnum.INTERNAL_ERROR),
  },
  config: {
    missingEnvVar: (): string =>
      ErrorCodeBuilder.create(ErrorDomainEnum.CONFIGURATION, ConfigurationErrorCodeEnum.MISSING_ENV_VAR),
  },
}
