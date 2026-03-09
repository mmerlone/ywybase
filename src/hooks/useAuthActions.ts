'use client'

import type { AuthUser, Session } from '@supabase/supabase-js'
import { useCallback } from 'react'

import { authService } from '@/lib/actions/auth/client'
import {
  loginWithEmail,
  signUpWithEmail as signUpWithEmailAction,
  forgotPassword,
  signOut as signOutAction,
} from '@/lib/actions/auth/server'
import { handleError as handleError } from '@/lib/error/handlers/client.handler'
import type { AuthProvider, SerializableError } from '@/types/auth.types'

/**
 * Authentication actions hook.
 *
 * Provides all authentication action methods (login, sign up, sign out, etc.).
 * This hook contains the business logic for authentication operations without
 * managing the auth state itself.
 *
 * **Responsibilities**:
 * - Execute authentication operations
 * - Call server actions
 * - Handle operation-specific errors
 * - Return operation results
 *
 * @internal This hook is used internally by `useAuth` in `src/hooks/useAuth.ts`.
 * For authentication in components, use `useAuthContext` from `@/components/providers`.
 *
 * @param params - Configuration object
 * @param params.setErrorAction - Function to set error state
 * @param params.setIsLoadingAction - Function to set loading state
 * @param params.setSessionAction - Function to update session
 * @param params.setAuthUserAction - Function to update auth user
 * @param params.refreshSessionAction - Function to refresh current session
 *
 * @returns Authentication action functions:
 * - `signIn`: Login with email and password
 * - `signInWithProvider`: Login with OAuth provider
 * - `signUpWithEmail`: Sign up with email and password
 * - `resetPassword`: Send password reset email
 * - `signOut`: Sign out current user
 *
 * @example
 * ```tsx
 * // Used internally by useAuth hook
 * const actions = useAuthActions({
 *   setErrorAction: setErrorAction,
 *   setIsLoadingAction: setIsLoadingAction,
 *   setSessionAction: setSessionAction,
 *   setAuthUserAction: setAuthUserAction,
 *   refreshSessionAction: refreshSessionAction,
 * })
 *
 * // Execute login
 * const result = await actions.signIn('user@example.com', 'password')
 * if (result.error) {
 *   console.error('Login failed:', result.error.message)
 * }
 * ```
 *
 * @internal This hook is used internally by useAuth. Use useAuth for normal authentication needs.
 */
export const useAuthActions = ({
  setErrorAction,
  setIsLoadingAction,
  setSessionAction,
  setAuthUserAction,
  refreshSessionAction,
}: {
  setErrorAction: (error: SerializableError | null) => void
  setIsLoadingAction: (loading: boolean) => void
  setSessionAction: (session: Session | null) => void
  setAuthUserAction: (user: AuthUser | null) => void
  refreshSessionAction: () => Promise<void>
}): {
  signIn: (email: string, password: string) => Promise<{ error: SerializableError | null }>
  signInWithProvider: (provider: AuthProvider) => Promise<{ error: SerializableError | null }>
  signUpWithEmail: (
    email: string,
    password: string,
    confirmPassword: string,
    acceptTerms: boolean,
    options?: { name: string }
  ) => Promise<{ error: SerializableError | null }>
  resetPassword: (email: string) => Promise<{ error: SerializableError | null }>
  signOut: () => Promise<{ error: SerializableError | null }>
} => {
  // Login with email and password
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: SerializableError | null }> => {
      try {
        setIsLoadingAction(true)
        setErrorAction(null) // Clear previous errors

        const result = await loginWithEmail({ email, password })

        if (!result.success) {
          // Server actions return AppErrorJSON when there's an error
          const appError =
            typeof result.error === 'string'
              ? handleError(new Error(result.error), {
                  operation: 'login',
                  email,
                  hook: 'useAuthActions',
                })
              : (result.error ??
                handleError(new Error('Login failed'), { operation: 'login', email, hook: 'useAuthActions' }))
          setErrorAction(appError)
          return { error: appError }
        }

        // On success, refresh session and return no error
        await refreshSessionAction()
        return { error: null }
      } catch (error) {
        const appError = handleError(error, {
          operation: 'login',
          email,
          unexpected: true,
          hook: 'useAuthActions',
        })
        setErrorAction(appError)
        return { error: appError }
      } finally {
        setIsLoadingAction(false)
      }
    },
    [refreshSessionAction, setErrorAction, setIsLoadingAction]
  )

  // Login with OAuth provider
  const signInWithProvider = useCallback(
    async (provider: AuthProvider): Promise<{ error: SerializableError | null }> => {
      try {
        setIsLoadingAction(true)
        setErrorAction(null) // Clear previous errors

        await authService.signInWithProvider(provider as 'google' | 'github' | 'facebook')
        return { error: null }
      } catch (error) {
        const appError = handleError(error, {
          operation: 'signInWithProvider',
          provider,
          hook: 'useAuthActions',
        })
        return { error: appError }
      } finally {
        setIsLoadingAction(false)
      }
    },
    [setErrorAction, setIsLoadingAction]
  )

  // Sign up with email and password
  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      confirmPassword: string,
      acceptTerms: boolean,
      options?: { name: string }
    ): Promise<{ error: SerializableError | null }> => {
      try {
        setIsLoadingAction(true)
        setErrorAction(null) // Clear previous errors

        // Client-side validation
        if (password !== confirmPassword) {
          const error = handleError(new Error("Passwords don't match"), {
            operation: 'sign-up',
            email,
            hook: 'useAuthActions',
            code: 'VALIDATION/PASSWORD_MISMATCH',
          })
          setErrorAction(error)
          return { error }
        }

        if (!acceptTerms) {
          const error = handleError(new Error('You must accept the terms and conditions'), {
            operation: 'sign-up',
            email,
            hook: 'useAuthActions',
            code: 'VALIDATION/TERMS_NOT_ACCEPTED',
          })
          setErrorAction(error)
          return { error }
        }

        const result = await signUpWithEmailAction({
          email,
          password,
          name: options?.name ?? '',
          confirmPassword,
          acceptTerms,
        })
        if (!result.success) {
          const appError =
            typeof result.error === 'string'
              ? handleError(new Error(result.error), {
                  operation: 'sign-up',
                  email,
                  hook: 'useAuthActions',
                })
              : (result.error ??
                handleError(new Error('Registration failed'), { operation: 'sign-up', email, hook: 'useAuthActions' }))
          setErrorAction(appError)
          return { error: appError }
        }
        // Don't refresh session after signup - user is signed out and needs to verify email first
        // await refreshSessionAction()
        return { error: null }
      } catch (error) {
        const appError = handleError(error, {
          operation: 'sign-up',
          email,
          unexpected: true,
          hook: 'useAuthActions',
        })
        setErrorAction(appError)
        return { error: appError }
      } finally {
        setIsLoadingAction(false)
      }
    },
    [setErrorAction, setIsLoadingAction]
  )

  // Reset password
  const resetPassword = useCallback(
    async (email: string): Promise<{ error: SerializableError | null }> => {
      try {
        setIsLoadingAction(true)
        setErrorAction(null) // Clear previous errors

        const result = await forgotPassword({ email })
        if (!result.success) {
          const appError =
            typeof result.error === 'string'
              ? handleError(new Error(result.error), {
                  operation: 'forgot-password',
                  email,
                  hook: 'useAuthActions',
                })
              : (result.error ??
                handleError(new Error('Password reset failed'), {
                  operation: 'forgot-password',
                  email,
                  hook: 'useAuthActions',
                }))
          setErrorAction(appError)
          return { error: appError }
        }
        return { error: null }
      } catch (error) {
        const appError = handleError(error, {
          operation: 'forgot-password',
          email,
          unexpected: true,
          hook: 'useAuthActions',
        })
        setErrorAction(appError)
        return { error: appError }
      } finally {
        setIsLoadingAction(false)
      }
    },
    [setErrorAction, setIsLoadingAction]
  )

  // Sign out
  const signOut = useCallback(async (): Promise<{ error: SerializableError | null }> => {
    try {
      setIsLoadingAction(true)
      setErrorAction(null) // Clear previous errors

      const result = await signOutAction()
      if (!result.success) {
        const appError =
          typeof result.error === 'string'
            ? handleError(new Error(result.error), {
                operation: 'sign-out',
                hook: 'useAuthActions',
              })
            : (result.error ??
              handleError(new Error('Sign out failed'), { operation: 'sign-out', hook: 'useAuthActions' }))
        setErrorAction(appError)
        return { error: appError }
      }
      // Clear local state after successful sign out
      setSessionAction(null)
      setAuthUserAction(null)
      return { error: null }
    } catch (error) {
      const appError = handleError(error, {
        operation: 'sign-out',
        hook: 'useAuthActions',
      })
      setErrorAction(appError)
      return { error: appError }
    } finally {
      setIsLoadingAction(false)
    }
  }, [setErrorAction, setIsLoadingAction, setSessionAction, setAuthUserAction])

  return {
    signIn,
    signInWithProvider,
    signUpWithEmail,
    resetPassword,
    signOut,
  }
}
