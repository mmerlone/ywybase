'use client'

import { useCallback } from 'react'

import type { SerializableError } from '@/types/auth.types'
import type { AuthErrorContext } from '@/types/error.types'

/**
 * Authentication error utilities hook.
 *
 * Provides utility functions for working with authentication errors.
 * Includes error type checking, display formatting, and error management.
 *
 * **Responsibilities**:
 * - Format errors for display
 * - Check error types (auth, validation, network)
 * - Extract error codes
 * - Clear error state
 *
 * @internal This hook is used internally by `useAuth` in `src/hooks/useAuth.ts`.
 * For authentication in components, use `useAuthContext` from `@/components/providers`.
 *
 * @param params - Configuration object
 * @param params.error - Current error state
 * @param params.setErrorAction - Function to set error state
 *
 * @returns Error utility functions:
 * - `clearError`: Clear current error state
 * - `getErrorForDisplay`: Get user-friendly error information
 * - `getErrorCode`: Get current error code
 * - `isAuthError`: Check if error is auth-related
 * - `isValidationError`: Check if error is validation-related
 * - `isNetworkError`: Check if error is network-related
 *
 * @example
 * ```tsx
 * function ErrorDisplay() {
 *   const [error, setErrorAction] = useState<SerializableError | null>(null)
 *   const {
 *     getErrorForDisplay,
 *     isAuthError,
 *     clearError
 *   } = useAuthError({ error, setErrorAction: setErrorAction })
 *
 *   const displayError = getErrorForDisplay()
 *   if (!displayError) return null
 *
 *   return (
 *     <div className={isAuthError() ? 'auth-error' : 'general-error'}>
 *       <p>{displayError.message}</p>
 *       <button onClick={clearError}>Dismiss</button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @internal This hook is used internally by useAuth. Use useAuth for normal authentication needs.
 */
export const useAuthError = ({
  error,
  setErrorAction,
}: {
  error: SerializableError | null
  setErrorAction: (error: SerializableError | null) => void
}): {
  clearError: () => void
  getErrorForDisplay: () => {
    message: string
    code: string
    context?: AuthErrorContext
    isOperational: boolean
    statusCode: number | undefined
  } | null
  getErrorCode: () => string | null
  isAuthError: () => boolean
  isValidationError: () => boolean
  isNetworkError: () => boolean
} => {
  // Clear error state
  const clearError = useCallback(() => {
    setErrorAction(null)
  }, [setErrorAction])

  // Get user-friendly error information for display
  const getErrorForDisplay = useCallback(() => {
    if (!error) return null

    return {
      message: error.message,
      code: error.code,
      context: error.context as AuthErrorContext | undefined,
      isOperational: error.isOperational ?? false,
      statusCode: error.statusCode,
    }
  }, [error])

  // Get error code
  const getErrorCode = useCallback(() => {
    return error?.code ?? null
  }, [error])

  // Check if error is authentication-related
  const isAuthError = useCallback(() => {
    return error?.code?.startsWith('AUTH/') ?? false
  }, [error])

  // Check if error is validation-related
  const isValidationError = useCallback(() => {
    return error?.code?.startsWith('VALIDATION/') ?? false
  }, [error])

  // Check if error is network-related
  const isNetworkError = useCallback(() => {
    return error?.code?.startsWith('NETWORK/') ?? false
  }, [error])

  return {
    clearError,
    getErrorForDisplay,
    getErrorCode,
    isAuthError,
    isValidationError,
    isNetworkError,
  }
}
