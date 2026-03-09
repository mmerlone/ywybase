/* eslint-disable no-console */
/**
 * Isomorphic logger for utilities that run in both client and server environments
 *
 * This logger dynamically selects the appropriate logger implementation based on
 * the runtime environment. It's designed for shared utilities like timezone and
 * location detection that may be called from either context.
 *
 * Note: For code that's exclusively client or server-side, prefer importing
 * the specific logger directly for better tree-shaking and type safety.
 */

import type { Logger } from '@/types/logger.types'

/**
 * Creates an isomorphic logger that works in both client and server environments
 *
 * The logger is lazily initialized to avoid importing heavy dependencies during
 * module evaluation. On first use, it detects the environment and loads the
 * appropriate logger implementation.
 *
 * @param moduleName - The name of the module for contextual logging
 * @returns Logger instance that works in both environments
 *
 * @example
 * ```typescript
 * import { buildIsomorphicLogger } from '@/lib/logger/isomorphic'
 *
 * const logger = buildIsomorphicLogger('my-utility')
 * logger.warn({ error }, 'Fallback to default value')
 * ```
 */
export function buildIsomorphicLogger(moduleName: string): Logger {
  let cachedLogger: Logger | undefined

  const getLogger = async (): Promise<Logger> => {
    if (cachedLogger) {
      return cachedLogger
    }

    // Detect environment and load appropriate logger
    if (typeof window === 'undefined') {
      // Server environment - use server logger with pino
      const { buildLogger } = await import('@/lib/logger/server')
      cachedLogger = buildLogger(moduleName)
    } else {
      // Client environment - use client logger with console
      const { buildLogger } = await import('@/lib/logger/client')
      cachedLogger = buildLogger(moduleName)
    }

    return cachedLogger
  }

  // Return a proxy that lazily initializes the logger on first method call
  // Use synchronous wrapper to maintain Logger interface
  let loggerPromise: Promise<Logger> | undefined

  const ensureLogger = (): Promise<Logger> => {
    loggerPromise ??= getLogger()
    return loggerPromise
  }

  /**
   * Handles logger initialization errors with environment-specific reporting
   */
  const handleLoggerError = (error: unknown, logLevel: string): void => {
    if (typeof window === 'undefined') {
      // Server environment - log the error with context
      console.error(`[${moduleName}] Logger initialization failed for ${logLevel}:`, error)
    }
    // Client environment - silent fail to avoid breaking UI
  }

  return {
    trace: (context, message): void => {
      void ensureLogger()
        .then((logger) => logger.trace(context, message))
        .catch((error) => handleLoggerError(error, 'trace'))
    },
    debug: (context, message): void => {
      void ensureLogger()
        .then((logger) => logger.debug(context, message))
        .catch((error) => handleLoggerError(error, 'debug'))
    },
    info: (context, message): void => {
      void ensureLogger()
        .then((logger) => logger.info(context, message))
        .catch((error) => handleLoggerError(error, 'info'))
    },
    warn: (context, message): void => {
      void ensureLogger()
        .then((logger) => logger.warn(context, message))
        .catch((error) => handleLoggerError(error, 'warn'))
    },
    error: (context, message): void => {
      void ensureLogger()
        .then((logger) => logger.error(context, message))
        .catch((error) => handleLoggerError(error, 'error'))
    },
    fatal: (context, message): void => {
      void ensureLogger()
        .then((logger) => logger.fatal(context, message))
        .catch((error) => handleLoggerError(error, 'fatal'))
    },
    child: (context): Logger => {
      const childLogger = buildIsomorphicLogger(moduleName)
      void ensureLogger()
        .then((logger) => {
          cachedLogger = logger.child(context)
        })
        .catch((error) => handleLoggerError(error, 'child'))
      return childLogger
    },
  }
}
