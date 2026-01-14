/**
 * Client-Side Error Handler
 *
 * Error handling for browser/client code.
 * Uses client logger (console-based in dev, no-op in prod).
 *
 * @remarks
 * **Usage**:
 * - Import in Client Components
 * - Use for form validation errors
 * - Handle API call failures
 *
 * @module error/handlers/client.handler
 *
 * @example
 * ```typescript
 * import { handleError } from '@/lib/error/handlers/client.handler'
 *
 * try {
 *   await fetch('/api/data')
 * } catch (err) {
 *   const appError = handleError(err, {
 *     url: '/api/data',
 *     method: 'GET'
 *   })
 *   console.error(appError.message)
 * }
 * ```
 */

import { createErrorHandler } from './base.handler'
import { getErrorType } from '../core/error.utils'
import { AuthErrorTypeEnum } from '@/types/error.types'
import { logger as clientLogger } from '@/lib/logger/client'

// Create client-specific error handler with explicit client logger
const clientErrorHandler = createErrorHandler({
  logger: clientLogger,
})

export const handleError = clientErrorHandler.handleError
export { getErrorType }

// Re-export AuthErrorTypeEnum for client-side usage
export { AuthErrorTypeEnum }
