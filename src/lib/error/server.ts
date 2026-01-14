/**
 * Server-Only Error Handling
 *
 * Server-side error handling exports.
 * Should only be imported by server-side code (Server Components, Actions, API Routes).
 *
 * @remarks
 * **Server-Only Features**:
 * - withServerActionErrorHandling: Wrapper for Server Actions
 * - handleApiError: API route error handler
 * - handleServerError: Server-side error handler with Pino logger
 * - batchServerActions: Batch operation helper
 *
 * @module error/server
 */

// Server action middleware
export {
  withServerActionErrorHandling,
  createServerActionSuccess,
  createServerActionError,
  handleServerActionValidation,
  batchServerActions,
  type ServerActionOptions,
} from './middlewares/server-actions'

// API middleware
export { handleApiError, withApiErrorHandler, type ApiErrorResponse } from './middlewares/api.middleware'

// Server error handler
export { handleError as handleServerError } from './handlers/server.handler'
