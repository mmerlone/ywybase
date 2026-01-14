/**
 * API Route Error Middleware
 *
 * Standardized error handling for Next.js API routes.
 * Provides consistent error responses and automatic logging.
 *
 * @remarks
 * **Features**:
 * - Standardized error response format
 * - Automatic status code mapping
 * - Request context extraction
 * - Success response helpers
 * - Validation error responses
 *
 * @module error/middlewares/api.middleware
 */

import { type NextRequest, NextResponse } from 'next/server'

import type { BaseErrorContext, ValidationErrorContext } from '@/types/error.types'

import { handleServerError as handleError } from '@/lib/error/server'
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('api-error-handler')

/**
 * Standardized API error response format.
 * All error responses follow this structure.
 */
export interface ApiErrorResponse {
  /** Always false for errors */
  success: false
  /** Error details object */
  error: {
    /** Structured error code (DOMAIN/TYPE) */
    code: string
    /** User-facing error message */
    message: string
    /** Optional error context for debugging */
    context?: BaseErrorContext
    /** HTTP status code */
    statusCode: number
  }
  /** ISO 8601 timestamp */
  timestamp?: string
}

/**
 * Handle errors in API routes with standardized responses.
 * Extracts request context and returns formatted error response.
 *
 * @param error - The error that occurred
 * @param request - Next.js request object (optional, for context)
 * @param context - Additional context for error logging
 * @returns NextResponse with standardized error format
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   try {
 *     const data = await fetchData()
 *     return NextResponse.json({ data })
 *   } catch (error) {
 *     return handleApiError(error, request, { endpoint: 'GET /api/data' })
 *   }
 * }
 * ```
 */
export function handleApiError(
  error: unknown,
  request?: NextRequest,
  context: Record<string, unknown> = {}
): NextResponse<ApiErrorResponse> {
  // Use the enhanced error handler to process the error
  const appError = handleError(error, {
    ...context,
    method: request?.method,
    url: request?.url,
    userAgent: request?.headers.get('user-agent') ?? undefined,
    clientIp: request?.headers.get('x-forwarded-for') ?? request?.headers.get('x-real-ip') ?? undefined,
  })

  // Log the error with context
  logger.error(
    {
      error: appError,
      statusCode: appError.statusCode,
      code: appError.code,
      method: request?.method,
      url: request?.url,
      ...context,
    },
    'API route error'
  )

  // Return standardized error response
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      context: appError.context,
      statusCode: appError.statusCode ?? 500,
    },
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(errorResponse, {
    status: appError.statusCode ?? 500,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * API route wrapper with automatic error handling.
 * Catches all errors and returns standardized responses.
 *
 * @param handler - The API route handler function
 * @returns Wrapped handler with error handling
 *
 * @example
 * ```typescript
 * export const GET = withApiErrorHandler(async (request: NextRequest) => {
 *   const data = await db.query('SELECT * FROM users')
 *   return NextResponse.json({ data })
 * })
 * // Errors are automatically caught and formatted
 * ```
 */
export function withApiErrorHandler(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request)
    } catch (error) {
      return handleApiError(error, request, {
        handlerName: handler.name || 'anonymous',
      })
    }
  }
}

/**
 * Create a successful API response with consistent format.
 * Provides standardized success structure.
 *
 * @param data - Response data payload
 * @param message - Optional success message
 * @param statusCode - HTTP status code (default: 200)
 * @returns Standardized success response
 *
 * @example
 * ```typescript
 * return createApiSuccessResponse(
 *   { user: userData },
 *   'User updated successfully',
 *   200
 * )
 * ```
 */
export function createApiSuccessResponse<T = unknown>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse<{
  success: true
  data: T
  message?: string
  timestamp: string
}> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

/**
 * Create a validation error response.
 * Used for request validation failures.
 *
 * @param validationError - Validation error (e.g., Zod error)
 * @param context - Additional validation context
 * @returns 400 validation error response
 *
 * @example
 * ```typescript
 * const result = schema.safeParse(data)
 * if (!result.success) {
 *   return createApiValidationErrorResponse(result.error)
 * }
 * ```
 */
export function createApiValidationErrorResponse(
  validationError: unknown,
  context: ValidationErrorContext = {}
): NextResponse<ApiErrorResponse> {
  const errorContext: ValidationErrorContext = {
    ...context,
    validationDetails: validationError,
  }

  const appError = handleError(validationError, errorContext)

  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: appError.code,
      message: 'Validation failed',
      context: appError.context,
      statusCode: 400,
    },
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(errorResponse, { status: 400 })
}

/**
 * Create an unauthorized error response.
 * Used for authentication failures.
 *
 * @param message - Error message (default: "Unauthorized access")
 * @param context - Additional context
 * @returns 401 unauthorized response
 *
 * @example
 * ```typescript
 * if (!session) {
 *   return createApiUnauthorizedResponse('Please log in')
 * }
 * ```
 */
export function createApiUnauthorizedResponse(
  message: string = 'Unauthorized access',
  context: Record<string, unknown> = {}
): NextResponse<ApiErrorResponse> {
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: 'AUTH/UNAUTHORIZED',
      message,
      context,
      statusCode: 401,
    },
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(errorResponse, { status: 401 })
}

/**
 * Create a not found error response.
 * Used when requested resource doesn't exist.
 *
 * @param resource - Resource name for error message
 * @param context - Additional context
 * @returns 404 not found response
 *
 * @example
 * ```typescript
 * const user = await db.findUser(id)
 * if (!user) {
 *   return createApiNotFoundResponse('User', { userId: id })
 * }
 * ```
 */
export function createApiNotFoundResponse(
  resource: string = 'Resource',
  context: Record<string, unknown> = {}
): NextResponse<ApiErrorResponse> {
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: 'DATABASE/NOT_FOUND',
      message: `${resource} not found`,
      context,
      statusCode: 404,
    },
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(errorResponse, { status: 404 })
}
