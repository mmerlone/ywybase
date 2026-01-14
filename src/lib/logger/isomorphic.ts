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
    if (!loggerPromise) {
      loggerPromise = getLogger()
    }
    return loggerPromise
  }

  return {
    trace: (context, message): void => {
      void ensureLogger().then((logger) => logger.trace(context, message))
    },
    debug: (context, message): void => {
      void ensureLogger().then((logger) => logger.debug(context, message))
    },
    info: (context, message): void => {
      void ensureLogger().then((logger) => logger.info(context, message))
    },
    warn: (context, message): void => {
      void ensureLogger().then((logger) => logger.warn(context, message))
    },
    error: (context, message): void => {
      void ensureLogger().then((logger) => logger.error(context, message))
    },
    fatal: (context, message): void => {
      void ensureLogger().then((logger) => logger.fatal(context, message))
    },
    child: (context): Logger => {
      // For child loggers, we need to wait for initialization
      const childLogger = buildIsomorphicLogger(moduleName)
      void ensureLogger().then((logger) => {
        cachedLogger = logger.child(context)
      })
      return childLogger
    },
  }
}
