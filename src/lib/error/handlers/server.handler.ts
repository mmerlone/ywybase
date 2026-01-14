/**
 * Server-Side Error Handler
 *
 * Error handling for Node.js/server code.
 * Uses server logger (Pino with JSON output).
 *
 * @remarks
 * **Usage**:
 * - Import in Server Components
 * - Use in Server Actions
 * - Handle database errors
 *
 * @module error/handlers/server.handler
 *
 * @example
 * ```typescript
 * import { handleError } from '@/lib/error/handlers/server.handler'
 *
 * export async function updateProfile(data: ProfileUpdate) {
 *   try {
 *     await db.update(data)
 *   } catch (err) {
 *     const appError = handleError(err, {
 *       table: 'profiles',
 *       operation: 'update'
 *     })
 *     return { error: appError.toJSON() }
 *   }
 * }
 * ```
 */

import { logger as serverLogger } from '@/lib/logger/server'
import { createErrorHandler } from './base.handler'
import { getErrorType } from '../core/error.utils'

// Create server-specific error handler with explicit logger
const serverErrorHandler = createErrorHandler({
  logger: serverLogger,
})

export const handleError = serverErrorHandler.handleError
export { getErrorType }
