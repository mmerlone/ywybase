/**
 * Client-Side Logger
 *
 * Browser-compatible logger that mirrors the Pino API but uses console methods.
 * Automatically disables logging in production for performance and security.
 *
 * @remarks
 * **Environment Behavior**:
 * - Development: Full console logging with formatted output
 * - Production: No-op logger (all methods are empty)
 *
 * **Features**:
 * - Pino-compatible API (trace, debug, info, warn, error, fatal)
 * - Structured logging with context objects
 * - Error serialization
 * - Child loggers with inherited context
 * - ISO 8601 timestamps
 *
 * @module logger/client
 */

import { LogLevelEnum } from '@/types/logger.types'
import type { Logger, LoggerContext, LogLevel } from '@/types/logger.types'

const isDevelopment = process.env.NODE_ENV !== 'production'

/**
 * Create a no-op logger for production environments.
 * All logging methods are empty functions to minimize overhead.
 *
 * @returns Logger instance with no-op methods
 * @internal
 */
const createNoOpLogger = (): Logger => ({
  trace: (): void => {},
  debug: (): void => {},
  info: (): void => {},
  warn: (): void => {},
  error: (): void => {},
  fatal: (): void => {},
  child: (): Logger => createNoOpLogger(),
})

/**
 * Create a console-based logger for development environments.
 * Formats logs similar to pino-pretty with timestamps and context.
 *
 * @param baseContext - Base context inherited by all log calls
 * @returns Logger instance using console methods
 * @internal
 *
 * @example
 * ```typescript
 * const logger = createConsoleLogger({ module: 'auth' })
 * logger.info({ userId: '123' }, 'User logged in')
 * // Output: [2026-01-13T10:30:00.000Z] info User logged in module="auth" userId="123"
 * ```
 */
const createConsoleLogger = (baseContext: LoggerContext = {}): Logger => {
  /**
   * Internal log function that handles formatting and console output.
   *
   * @param level - Log level (trace, debug, info, warn, error, fatal)
   * @param context - Additional context for this log entry
   * @param message - Human-readable log message
   * @internal
   */
  const log = (level: LogLevel, context: LoggerContext, message: string): void => {
    if (!isDevelopment) return

    const mergedContext = { ...baseContext, ...context }
    const timestamp = new Date().toISOString()

    // Format error if present
    if (mergedContext.err instanceof Error) {
      mergedContext.err = {
        message: mergedContext.err.message,
        stack: mergedContext.err.stack,
        name: mergedContext.err.name,
      } as unknown as Error
    }

    // Format the output similar to pino-pretty
    const formattedContext = Object.keys(mergedContext)
      .sort()
      .map((key) => `${key}=${JSON.stringify(mergedContext[key])}`)
      .join(' ')

    const logMessage = `[${timestamp}] ${level} ${message} ${formattedContext}`

    switch (level) {
      case LogLevelEnum.TRACE:
      case LogLevelEnum.DEBUG:
        console.debug(logMessage)
        break
      case LogLevelEnum.INFO:
        console.info(logMessage)
        break
      case LogLevelEnum.WARN:
        console.warn(logMessage)
        break
      case LogLevelEnum.ERROR:
      case LogLevelEnum.FATAL:
        console.error(logMessage)
        break
    }
  }

  return {
    trace: (context: LoggerContext, message: string) => log(LogLevelEnum.TRACE, context, message),
    debug: (context: LoggerContext, message: string) => log(LogLevelEnum.DEBUG, context, message),
    info: (context: LoggerContext, message: string) => log(LogLevelEnum.INFO, context, message),
    warn: (context: LoggerContext, message: string) => log(LogLevelEnum.WARN, context, message),
    error: (context: LoggerContext, message: string) => log(LogLevelEnum.ERROR, context, message),
    fatal: (context: LoggerContext, message: string) => log(LogLevelEnum.FATAL, context, message),
    child: (context: LoggerContext) => createConsoleLogger({ ...baseContext, ...context }),
  }
}

/**
 * Default client-side logger instance.
 * Automatically switches between console (dev) and no-op (prod).
 *
 * @example
 * ```typescript
 * import { logger } from '@/lib/logger/client'
 *
 * logger.info({ userId: '123' }, 'User action completed')
 * logger.error({ err }, 'Operation failed')
 * ```
 */
export const logger: Logger = isDevelopment ? createConsoleLogger() : createNoOpLogger()

/**
 * Create a child logger with module context.
 * All log calls from this logger will include the module name.
 *
 * @param moduleName - Name of the module for contextual logging
 * @returns Logger instance with module context
 *
 * @example
 * ```typescript
 * import { buildLogger } from '@/lib/logger/client'
 *
 * const logger = buildLogger('profile-component')
 * logger.debug({ action: 'render' }, 'Component rendered')
 * // Output includes: module="profile-component"
 * ```
 */
export const buildLogger = (moduleName: string): Logger => {
  return logger.child({ module: moduleName })
}
