// Standardized error types for the application

/**
 * Error domains for structured error codes.
 * Defines the high-level categories of errors.
 */
export enum ErrorDomainEnum {
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  SERVER = 'SERVER',
  PERMISSION = 'PERMISSION',
  CONFIGURATION = 'CONFIGURATION',
  BUSINESS = 'BUSINESS',
}

/**
 * Error types for structured error handling.
 * Defines the different categories of errors that can occur in the application.
 */
export enum ErrorTypeEnum {
  APP_ERROR = 'AppError',
  AUTH_ERROR = 'AuthError',
  VALIDATION_ERROR = 'ValidationError',
  DATABASE_ERROR = 'DatabaseError',
  NETWORK_ERROR = 'NetworkError',
  PERMISSION_ERROR = 'PermissionError',
  CONFIGURATION_ERROR = 'ConfigurationError',
  BUSINESS_ERROR = 'BusinessError',
  SERVER_ERROR = 'ServerError',
}

/**
 * Authentication error codes.
 * Format: AUTH/SPECIFIC_ERROR
 */
export enum AuthErrorCodeEnum {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED = 'EMAIL_NOT_CONFIRMED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  EMAIL_ALREADY_IN_USE = 'EMAIL_ALREADY_IN_USE',
  INVALID_TOKEN = 'INVALID_TOKEN',
  UNKNOWN_SUPABASE_ERROR = 'UNKNOWN_SUPABASE_ERROR',
}

/**
 * Authentication error types for categorizing different auth issues.
 */
export enum AuthErrorTypeEnum {
  REFRESH_TOKEN = 'refresh_token',
  ACCESS_TOKEN = 'access_token',
  SESSION = 'session',
  CREDENTIALS = 'credentials',
  VERIFICATION = 'verification',
}

/**
 * Validation error codes.
 * Format: VALIDATION/SPECIFIC_ERROR
 */
export enum ValidationErrorCodeEnum {
  INVALID_INPUT = 'INVALID_INPUT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  NOT_NULL_VIOLATION = 'NOT_NULL_VIOLATION',
  SAME_PASSWORD = 'SAME_PASSWORD',
}

/**
 * Database error codes.
 * Format: DATABASE/SPECIFIC_ERROR
 */
export enum DatabaseErrorCodeEnum {
  NOT_FOUND = 'NOT_FOUND',
  RELATION_NOT_FOUND = 'RELATION_NOT_FOUND',
  NO_CONTENT = 'NO_CONTENT',
  UNKNOWN_POSTGREST_ERROR = 'UNKNOWN_POSTGREST_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Network error codes.
 * Format: NETWORK/SPECIFIC_ERROR
 */
export enum NetworkErrorCodeEnum {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

/**
 * Server error codes.
 * Format: SERVER/SPECIFIC_ERROR
 */
export enum ServerErrorCodeEnum {
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Configuration error codes.
 * Format: CONFIGURATION/SPECIFIC_ERROR
 */
export enum ConfigurationErrorCodeEnum {
  MISSING_ENV_VAR = 'MISSING_ENV_VAR',
}

/**
 * Error codes supported by the error page
 */
export enum ErrorPageCodeEnum {
  VERIFICATION_FAILED = 'verification_failed',
  INVALID_VERIFICATION_LINK = 'invalid_verification_link',
  AUTH_CODE_INVALID = 'auth_code_invalid',
  AUTH_LINK_EXPIRED = 'auth_link_expired',
  ACCESS_DENIED = 'access_denied',
  CONFIGURATION_ERROR = 'configuration_error',
}

export type ErrorPageCode = `${ErrorPageCodeEnum}`

/**
 * Standardized response type for authentication operations
 * @template T - Type of the data payload in successful responses
 */
export type AuthResponse<T = unknown> = {
  /** Whether the operation was successful */
  success: boolean
  /** Response data for successful operations */
  data?: T
  /** Structured error object for failed operations */
  error?: AppErrorJSON | string
  /** Optional success message */
  message?: string
  /** Whether the operation is currently pending (for form actions) */
  pending?: boolean
}

export type ErrorType = `${ErrorTypeEnum}`

/**
 * Base context interface for errors
 */
export interface BaseErrorContext {
  // Core identification
  userId?: string
  email?: string
  operation?: string
  requestId?: string
  service?: string

  // Error metadata
  code?: string
  statusCode?: number
  isOperational?: boolean
  originalError?: unknown // Raw error object
}

/**
 * Authentication error context
 */
export interface AuthErrorContext extends BaseErrorContext {
  provider?: string
  authMethod?: string
  sessionExpired?: boolean
  supabaseCode?: string
  status?: number
  authErrorType?: AuthErrorTypeEnum
  shouldSwitchToLogin?: boolean
}

/**
 * Network error context
 */
export interface NetworkErrorContext extends BaseErrorContext {
  url?: string
  method?: string
  clientIp?: string
  userAgent?: string
  timeout?: number
  retryCount?: number
  statusCode?: number
}

/**
 * Server action error context
 */
export interface ServerActionContext extends BaseErrorContext {
  operationType?: string
  duration?: number
  unexpected?: boolean
  argsCount?: number
  hook?: string
}

/**
 * Database error context
 */
export interface DatabaseErrorContext extends BaseErrorContext {
  table?: string
  query?: string
  constraint?: string
  details?: Record<string, unknown>
  hint?: string
  supabaseCode?: string
}

/**
 * Validation error context
 */
export interface ValidationErrorContext extends BaseErrorContext {
  field?: string
  validationErrors?: unknown[]
  validationDetails?: unknown
}

/**
 * Union of all possible error contexts
 */
export type ErrorContext =
  | AuthErrorContext
  | DatabaseErrorContext
  | ValidationErrorContext
  | NetworkErrorContext
  | ServerActionContext
  | BaseErrorContext

/**
 * Base options for creating structured errors
 */
export interface AppErrorOptions<TContext extends ErrorContext = BaseErrorContext> {
  code: string
  message: string
  context?: TContext
  cause?: Error | AppError | null
  isOperational?: boolean
  statusCode?: number
}

/**
 * Standardized error interface without timestamp (database-managed)
 */
export interface AppError<TContext extends ErrorContext = BaseErrorContext> extends Error {
  readonly code: string
  readonly context: TContext
  readonly isOperational: boolean
  readonly statusCode?: number
  readonly cause?: Error | AppError | null
  readonly errorType: ErrorType

  toJSON(): AppErrorJSON<TContext>
}

/**
 * JSON representation of AppError
 */
export interface AppErrorJSON<TContext extends ErrorContext = BaseErrorContext> {
  code: string
  message: string
  context?: TContext
  isOperational: boolean
  statusCode?: number
  errorType: ErrorType
  stack?: string
}
