/**
 * Server-Side Logger
 *
 * Production-grade Pino logger for Node.js environments.
 * Provides structured logging with serialization, redaction, and formatting.
 *
 * @remarks
 * **Environment Behavior**:
 * - Production: JSON output to stdout, info level, PII redaction enabled
 * - Development: Pretty-printed output with colors, trace level
 *
 * **Features**:
 * - Structured JSON logging
 * - Error/request/response serialization
 * - PII redaction for sensitive fields
 * - Context inheritance via child loggers
 * - Pretty formatting in development
 * - Global app metadata
 *
 * **Security**:
 * - Automatically redacts passwords, tokens, API keys
 * - Strips authorization headers
 * - Removes sensitive form data
 *
 * @module logger/server
 */

import pino, { LoggerOptions } from 'pino'
import type { Logger } from '@/types/logger.types'

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Pino logger configuration with serializers and redaction.
 * @internal
 */
const options: LoggerOptions = {
  level: isProduction ? 'info' : 'trace',

  // Global context - appears in every log
  base: {
    app: 'ywybase',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    env: process.env.NODE_ENV,
  },

  // Error/request serializers - better formatting
  serializers: {
    err: pino.stdSerializers.err, // Stack traces, error details
    req: pino.stdSerializers.req, // Clean request data
    res: pino.stdSerializers.res, // Clean response data
  },

  // PII redaction - security & compliance
  redact: {
    paths: [
      // Direct fields
      'password',
      'token',
      'authorization',
      'cookie',
      'ssn',
      'creditCard',
      'apiKey',
      'secret',

      // Nested fields (wildcard)
      '*.password',
      '*.token',
      '*.ssn',
      '*.creditCard',

      // Request headers
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',

      // Form data
      'body.password',
      'body.token',
      'data.password',
      'data.token',
    ],
    remove: true,
  },
}

// Configure transports based on environment
if (isProduction) {
  console.log('✅ Production logging: JSON to stdout with serializers and redaction')
} else {
  // Development: Pretty console output
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
      singleLine: false,
    },
  }
}

/**
 * Default server-side Pino logger instance.
 * Includes serializers, redaction, and environment-specific formatting.
 *
 * @example
 * ```typescript
 * import { logger } from '@/lib/logger/server'
 *
 * logger.info({ userId: '123', duration: 245 }, 'Request completed')
 * logger.error({ err, req, res }, 'Request failed')
 * ```
 */
export const logger: Logger = pino(options)

/**
 * Create a child logger with module context.
 * All log calls from this logger will include the module name.
 *
 * @param moduleName - Name of the module for contextual logging
 * @returns Logger instance with module context
 *
 * @example
 * ```typescript
 * import { buildLogger } from '@/lib/logger/server'
 *
 * const logger = buildLogger('auth-service')
 * logger.debug({ action: 'validate-token' }, 'Token validation started')
 * // Output includes: {"module":"auth-service",...}
 * ```
 */
export const buildLogger = (moduleName: string): Logger => {
  return logger.child({ module: moduleName })
}
