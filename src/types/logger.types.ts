/**
 * Standard log levels for consistent logging across the application.
 * Maps to Pino's log levels. Only includes levels actually used.
 */
export const LogLevelEnum = {
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
} as const

/**
 * Type representing log level values.
 * Derived from LogLevelEnum for type safety.
 */
export type LogLevel = (typeof LogLevelEnum)[keyof typeof LogLevelEnum]

/**
 * Context object that can be passed to logger methods.
 * Provides structured metadata for log entries.
 *
 * @example
 * ```typescript
 * const context: LoggerContext = {
 *   userId: '123',
 *   operation: 'updateProfile',
 *   duration: 45,
 *   err: new Error('Something went wrong')
 * };
 * logger.error(context, 'Failed to update profile');
 * ```
 */
export interface LoggerContext {
  /** Additional context fields as key-value pairs */
  [key: string]: unknown
  /** Error object - accepts unknown for flexibility in error handling */
  err?: Error | unknown
  /** Request object - for HTTP request context */
  req?: unknown
  /** Response object - for HTTP response context */
  res?: unknown
  /** Duration in milliseconds - for performance tracking */
  duration?: number
}

/**
 * Logger interface providing structured logging capabilities.
 * Compatible with Pino logger and follows standard log level conventions.
 *
 * @example
 * ```typescript
 * const logger: Logger = createLogger();
 * logger.info({ userId: '123' }, 'User logged in');
 * logger.error({ err: error, operation: 'signup' }, 'Failed to create user');
 * ```
 */
export interface Logger {
  /** Log trace level messages - for detailed debugging */
  trace: (context: LoggerContext, message: string) => void
  /** Log debug level messages - for development debugging */
  debug: (context: LoggerContext, message: string) => void
  /** Log info level messages - for general information */
  info: (context: LoggerContext, message: string) => void
  /** Log warning level messages - for potentially harmful situations */
  warn: (context: LoggerContext, message: string) => void
  /** Log error level messages - for error events */
  error: (context: LoggerContext, message: string) => void
  /** Log fatal level messages - for critical errors */
  fatal: (context: LoggerContext, message: string) => void
  /** Create a child logger with inherited context */
  child: (context: LoggerContext) => Logger
  /** Current log level - for dynamic level changes */
  level?: string
}

/**
 * Helper to safely convert unknown errors to Error type for logging.
 * Always returns an Error, converting non-Error values appropriately.
 */
export function toError(err: unknown): Error {
  if (err instanceof Error) return err
  if (typeof err === 'string') return new Error(err)
  if (err !== null && typeof err === 'object' && 'message' in err) {
    return new Error(String(err.message))
  }
  return new Error(String(err))
}

/**
 * Helper to normalize query errors to Error | null for React Query hooks.
 * Returns null for falsy values (no error), Error for Error instances,
 * and converts other truthy values to Error.
 *
 * @example
 * // In React Query hooks:
 * return { error: toErrorOrNull(error) }
 */
export function toErrorOrNull(err: unknown): Error | null {
  if (err === null || err === undefined) return null
  return toError(err)
}
