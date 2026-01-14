'use client'

import { useCallback } from 'react'

import { AuthContextType } from '../types'

import { useAuthState } from './useAuthState'
import { useAuthActions } from './useAuthActions'
import { useAuthError } from './useAuthError'

import { authService } from '@/lib/actions/auth/client'
import { handleClientError as handleError } from '@/lib/error'

/**
 * Authentication hook that provides comprehensive auth state management and operations.
 *
 * This hook combines three specialized hooks for better separation of concerns:
 * - `useAuthState`: Manages auth state (user, session, loading, errors)
 * - `useAuthActions`: Provides authentication actions (login, sign up, etc.)
 * - `useAuthError`: Utilities for error handling and display
 *
 * **Architecture**:
 * - Modular design with separate concerns for state, actions, and errors
 * - Integrates with centralized error handling system
 * - Provides structured error information for UI components
 * - Manages session lifecycle and auto-refresh
 *
 * @returns {AuthContextType} Authentication context containing:
 * - `authUser`: Current authenticated user or null
 * - `session`: Current session or null
 * - `isLoading`: Loading state for auth operations
 * - `error`: Structured error information or null
 * - `signIn`: Login with email and password
 * - `signInWithProvider`: Login with OAuth provider
 * - `signUpWithEmail`: Sign up with email and password
 * - `resetPassword`: Send password reset email
 * - `signOut`: Sign out current user
 * - `refreshSession`: Refresh current session
 * - `hasRole`: Check user role (placeholder for RBAC)
 * - `isCurrentUser`: Check if user ID matches current user
 * - `clearError`: Clear current error state
 * - `getErrorForDisplay`: Get user-friendly error information
 * - `getErrorCode`: Get current error code
 * - `isAuthError`: Check if error is auth-related
 * - `isValidationError`: Check if error is validation-related
 * - `isNetworkError`: Check if error is network-related
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const { signIn, isLoading, error } = useAuth();
 *
 *   const handleSubmit = async (email: string, password: string) => {
 *     const result = await signIn(email, password);
 *     if (result.error) {
 *       console.error('Login failed:', result.error.message);
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={(e) => handleSubmit(/ * form data * /)}>
 *       {/* Form fields * /}
 *       {error && <div>{error.message}</div>}
 *       <button disabled={isLoading}>Login</button>
 *     </form>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { authUser, signOut, isCurrentUser } = useAuth();
 *
 *   if (!authUser) return <div>Please login</div>;
 *
 *   return (
 *     <div>
 *       <h1>Welcome {authUser.email}</h1>
 *       <button onClick={() => signOut()}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useAuth = (): AuthContextType => {
  // Get auth state from useAuthState
  const { authUser, session, isLoading, error, setError, setIsLoading, setSession, setAuthUser } = useAuthState()

  // Refresh session
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null) // Clear previous errors

      const session = await authService.getSession()
      setSession(session)
      setAuthUser(session?.user ?? null)
    } catch (error) {
      const appError = handleError(error, {
        operation: 'refreshSession',
        unexpected: true,
        hook: 'useAuth',
      })
      setError(appError)
    } finally {
      setIsLoading(false)
    }
  }, [setError, setIsLoading, setSession, setAuthUser])

  // Get auth actions from useAuthActions
  const actions = useAuthActions({
    setErrorAction: setError,
    setIsLoadingAction: setIsLoading,
    setSessionAction: setSession,
    setAuthUserAction: setAuthUser,
    refreshSessionAction: refreshSession,
  })

  // Get error utilities from useAuthError
  const errorUtils = useAuthError({ error, setErrorAction: setError })

  // Additional utility functions
  const hasRole = useCallback((role: string): boolean => {
    // Role-based access control is not yet implemented
    // This is a placeholder for future RBAC functionality
    return !!role
  }, [])

  const isCurrentUser = useCallback(
    (userId: string): boolean => {
      return authUser?.id === userId
    },
    [authUser?.id]
  )

  return {
    authUser,
    session,
    isLoading,
    error,
    signIn: actions.signIn,
    signInWithProvider: actions.signInWithProvider,
    signUpWithEmail: actions.signUpWithEmail,
    resetPassword: actions.resetPassword,
    signOut: actions.signOut,
    refreshSession,
    hasRole,
    isCurrentUser,
    clearError: errorUtils.clearError,
    getErrorForDisplay: errorUtils.getErrorForDisplay,
    getErrorCode: errorUtils.getErrorCode,
    isAuthError: errorUtils.isAuthError,
    isValidationError: errorUtils.isValidationError,
    isNetworkError: errorUtils.isNetworkError,
  }
}

/**
 * Hook to get the auth service instance directly.
 *
 * Useful for advanced authentication operations that aren't covered by the
 * main useAuth() hook, such as custom authentication flows or direct service access.
 *
 * @returns {typeof authService} The authentication service instance
 *
 * @example
 * ```tsx
 * function CustomAuthComponent() {
 *   const authService = useAuthService();
 *   const [session, setSession] = useState(null);
 *
 *   useEffect(() => {
 *     authService.getSession().then(setSession);
 *   }, [authService]);
 *
 *   return <div>Custom auth logic</div>;
 * }
 * ```
 */
export const useAuthService = (): typeof authService => {
  return authService
}
