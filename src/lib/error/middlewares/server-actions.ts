/**
 * Server Actions Error Middleware
 *
 * Standardized error handling and utilities for Next.js Server Actions.
 * Provides wrappers, response helpers, and batch operation support.
 *
 * @remarks
 * **Features**:
 * - Server Action wrapper with logging and timing
 * - Standardized success/error responses
 * - Validation helper for Zod schemas
 * - Batch operation support
 * - Automatic path revalidation
 *
 * @module error/middlewares/server-actions
 */

import { type z } from 'zod'

import type { BaseErrorContext, ServerActionContext, AuthResponse } from '@/types/error.types'

import { handleServerError as handleError } from '@/lib/error/server'
import { isDynamicServerError } from '@/lib/error/core/error.utils'
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('server-actions-middleware')

/**
 * Zod validation error structure.
 * @internal
 */
interface ZodValidationError {
  /** Array of validation issues from Zod */
  issues: z.core.$ZodIssue[]
}

/**
 * Configuration options for Server Action error handling.
 */
export interface ServerActionOptions {
  /** Operation name for logging and error context */
  operation: string
  /** Additional context to include with errors */
  context?: BaseErrorContext
  /** Paths to revalidate on success */
  revalidatePaths?: string[]
  /** Custom success message */
  successMessage?: string
}

/**
 * Server Action wrapper with standardized error handling.
 * Provides logging, timing, error handling, and revalidation.
 *
 * @template Args - Server Action argument types
 * @template T - Response data type
 * @param handler - The Server Action function to wrap
 * @param options - Configuration options
 * @returns Wrapped Server Action with error handling
 *
 * @remarks
 * **Features**:
 * - Automatic error handling and logging
 * - Operation timing
 * - Path revalidation on success
 * - Custom success messages
 * - Auth operation detection
 *
 * @example
 * ```typescript
 * export const updateProfile = withServerActionErrorHandling(
 *   async (userId: string, data: ProfileUpdate) => {
 *     const profile = await db.updateProfile(userId, data)
 *     return createServerActionSuccess(profile)
 *   },
 *   {
 *     operation: 'update-profile',
 *     revalidatePaths: ['/profile'],
 *     successMessage: 'Profile updated successfully'
 *   }
 * )
 * ```
 */
export function withServerActionErrorHandling<Args extends readonly unknown[], T = unknown>(
  handler: (...args: Args) => Promise<AuthResponse<T>>,
  options: ServerActionOptions
) {
  return async (...args: Args): Promise<AuthResponse<T>> => {
    const startTime = Date.now()
    const { operation, context = {}, revalidatePaths, successMessage } = options

    try {
      logger.debug({ operation, argsCount: args.length }, `Starting server action: ${operation}`)

      const result = await handler(...args)

      // Log successful completion
      const duration = Date.now() - startTime
      logger.debug(
        {
          operation,
          duration,
          success: result.success,
          hasData: result.data ?? false,
          hasError: result.error ?? false,
        },
        `Server action completed: ${operation}`
      )

      // Handle revalidation if specified
      if (result.success && revalidatePaths && revalidatePaths.length > 0) {
        const { revalidatePath } = await import('next/cache')
        revalidatePaths.forEach((path) => revalidatePath(path))
        logger.debug({ operation, revalidatePaths }, 'Paths revalidated')
      }

      // Add success message if provided and operation was successful
      if (result.success && successMessage !== null) {
        return {
          ...result,
          message: successMessage,
        }
      }

      return result
    } catch (error) {
      // Re-throw Next.js dynamic server errors - they're control flow for static/dynamic detection
      // Next.js catches these to automatically opt routes into dynamic rendering
      if (isDynamicServerError(error)) {
        throw error
      }

      // Handle unexpected errors with structured error handling
      const duration = Date.now() - startTime

      // Mark operation as auth-related if it's an auth operation
      const isAuthOperation = [
        'login',
        'sign-up',
        'signup',
        'forgot-password',
        'set-password',
        'update-password',
        'sign-out',
        'signout',
      ].includes(operation.toLowerCase())

      const appError = handleError(error, {
        operation,
        duration,
        unexpected: true,
        argsCount: args.length,
        ...(isAuthOperation && { authMethod: 'email' }), // Add auth context marker
        ...context,
      })

      logger.error(
        {
          operation,
          duration,
          error: appError,
          argsCount: args.length,
        },
        `Server action failed: ${operation}`
      )

      // Serialize AppError to plain object for client
      return {
        success: false,
        error: appError.toJSON(),
        data: undefined,
      }
    }
  }
}

/**
 * Create a standardized success response for Server Actions.
 * Use to return successful operation results.
 *
 * @template T - Response data type
 * @param data - The successful response data
 * @param message - Optional success message
 * @returns Standardized success response
 *
 * @example
 * ```typescript
 * export async function createUser(data: UserData) {
 *   const user = await db.insert(data)
 *   return createServerActionSuccess(user, 'User created successfully')
 * }
 * ```
 */
export function createServerActionSuccess<T = unknown>(data: T, message?: string): AuthResponse<T> {
  return {
    success: true,
    data,
    message,
  }
}

/**
 * Create a standardized error response for Server Actions.
 * Converts any error to serializable AppError JSON.
 *
 * @param error - The error to convert
 * @param context - Additional error context
 * @returns Standardized error response
 *
 * @example
 * ```typescript
 * export async function deleteUser(userId: string) {
 *   try {
 *     await db.delete(userId)
 *     return createServerActionSuccess({ deleted: true })
 *   } catch (err) {
 *     return createServerActionError(err, { userId, operation: 'delete' })
 *   }
 * }
 * ```
 */
export function createServerActionError(
  error: unknown,
  context: ServerActionContext & { duration?: number; batchIndex?: number } = {}
): AuthResponse<never> {
  const appError = handleError(error, context)

  // Serialize AppError to plain object for client
  return {
    success: false,
    error: appError.toJSON(),
    data: undefined,
  }
}

/**
 * Validate Server Action arguments with Zod.
 * Returns error response if validation fails, null if successful.
 *
 * @template T - Response data type
 * @param validation - Zod validation result
 * @param context - Additional context for validation errors
 * @returns Error response if validation fails, null if passes
 *
 * @example
 * ```typescript
 * export async function updateProfile(data: unknown) {
 *   const validation = profileSchema.safeParse(data)
 *   const validationError = handleServerActionValidation(validation)
 *   if (validationError) return validationError
 *
 *   // Validation passed, data is now typed
 *   const profile = await db.update(validation.data)
 *   return createServerActionSuccess(profile)
 * }
 * ```
 */
export function handleServerActionValidation<T>(
  validation: { success: boolean; error?: ZodValidationError },
  context: BaseErrorContext = {}
): AuthResponse<T> | null {
  if (!validation.success) {
    const validationError = handleError(validation.error, {
      ...context,
      // Validation details are handled by ValidationErrorContext
      validationErrors: validation.error?.issues ?? [],
    })

    // Serialize AppError to plain object for client
    return {
      success: false,
      error: validationError.toJSON(),
      data: undefined,
    }
  }

  return null
}

/**
 * Execute multiple Server Actions in batch.
 * Provides aggregated results with success/error counts.
 *
 * @template T - Response data type
 * @param operations - Array of Server Action functions to execute
 * @param options - Batch operation configuration
 * @returns Batch operation results with counts
 *
 * @remarks
 * **Options**:
 * - stopOnFirstError: Stop batch on first failure (default: false)
 * - operation: Operation name for logging
 *
 * @example
 * ```typescript
 * const result = await batchServerActions(
 *   [
 *     () => updateUser(userId1, data1),
 *     () => updateUser(userId2, data2),
 *     () => updateUser(userId3, data3)
 *   ],
 *   {
 *     operation: 'batch-update-users',
 *     stopOnFirstError: false
 *   }
 * )
 *
 * console.log(`Success: ${result.successCount}, Errors: ${result.errorCount}`)
 * ```
 */
export async function batchServerActions<T = unknown>(
  operations: Array<() => Promise<AuthResponse<T>>>,
  options: {
    stopOnFirstError?: boolean
    operation?: string
  } = {}
): Promise<{
  results: AuthResponse<T>[]
  successCount: number
  errorCount: number
  hasErrors: boolean
}> {
  const { stopOnFirstError = false, operation = 'batch-operation' } = options
  const results: AuthResponse<T>[] = []
  let successCount = 0
  let errorCount = 0

  logger.debug({ operation, operationsCount: operations.length }, `Starting batch operation: ${operation}`)

  for (const serverAction of operations) {
    try {
      const result = await serverAction()
      results.push(result)

      if (result.success) {
        successCount++
      } else {
        errorCount++

        if (stopOnFirstError) {
          logger.warn({ operation, errorCount: 1 }, 'Batch operation stopped due to first error')
          break
        }
      }
    } catch (error) {
      const errorResult = createServerActionError(error, { operation, batchIndex: results.length })
      results.push(errorResult)
      errorCount++

      if (stopOnFirstError) {
        logger.warn({ operation, errorCount: 1 }, 'Batch operation stopped due to first unexpected error')
        break
      }
    }
  }

  const hasErrors = errorCount > 0
  const duration = Date.now()

  logger.debug(
    {
      operation,
      totalOperations: operations.length,
      successCount,
      errorCount,
      hasErrors,
      duration,
    },
    `Batch operation completed: ${operation}`
  )

  return {
    results,
    successCount,
    errorCount,
    hasErrors,
  }
}
