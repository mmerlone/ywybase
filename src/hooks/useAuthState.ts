'use client'

import type { AuthUser, Session } from '@supabase/supabase-js'
import { serialize } from 'cookie'
import { useEffect, useState } from 'react'

import { authService } from '@/lib/actions/auth/client'
import { signOut as signOutAction } from '@/lib/actions/auth/server'
import { handleClientError as handleError, AuthErrorTypeEnum } from '@/lib/error'
import { logger } from '@/lib/logger/client'
import type { SerializableError } from '@/types'

/**
 * Authentication state management hook.
 *
 * Handles the core authentication state including user, session, loading status,
 * and error state. Manages the auth state subscription and session verification.
 *
 * **Responsibilities**:
 * - Track current user and session
 * - Subscribe to auth state changes
 * - Verify session validity
 * - Handle refresh token errors
 * - Manage loading and error states
 *
 * @returns Authentication state containing:
 * - `authUser`: Current authenticated user or null
 * - `session`: Current session or null
 * - `isLoading`: Loading state indicator
 * - `error`: Structured error information or null
 * - `setError`: Function to set error state
 * - `setIsLoading`: Function to set loading state
 * - `setSession`: Function to update session
 * - `setAuthUser`: Function to update auth user
 *
 * @example
 * ```tsx
 * function AuthWrapper() {
 *   const { authUser, isLoading, error } = useAuthState()
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!authUser) return <LoginForm />
 *
 *   return <Dashboard user={authUser} />
 * }
 * ```
 *
 * @internal This hook is used internally by useAuth. Use useAuth for normal authentication needs.
 */
export const useAuthState = (): {
  authUser: AuthUser | null
  session: Session | null
  isLoading: boolean
  error: SerializableError | null
  setError: (error: SerializableError | null) => void
  setIsLoading: (loading: boolean) => void
  setSession: (session: Session | null) => void
  setAuthUser: (user: AuthUser | null) => void
} => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<SerializableError | null>(null)

  // Handle auth state changes
  useEffect(() => {
    let isMounted = true

    const checkSession = async (): Promise<void> => {
      try {
        setIsLoading(true)
        // Client-side: getSession() is used first for fast UI updates from local storage
        // This is safe on the client side for UI state management
        const session = await authService.getSession()

        if (!isMounted) return

        if (session?.user) {
          // Verify user authenticity by contacting auth server
          // This ensures the session data is legitimate
          const authUser = await authService.getUser()

          if (!authUser) {
            logger.warn({ userId: session.user?.id }, 'User not found in database, signing out')
            const result = await signOutAction()
            if (!result.success) {
              logger.warn({ message: result.error }, 'Sign out action failed during user-not-found cleanup')
            }
            if (isMounted) {
              setSession(null)
              setAuthUser(null)
            }
            document.cookie = serialize('signout-reason', 'user-not-found', {
              path: '/',
              maxAge: 5,
              sameSite: 'strict',
            })
            return
          }
        }

        if (isMounted && session !== null && session !== undefined) {
          setSession(session)
          setAuthUser(session?.user ?? null)

          const user = session?.user
          logger.info(
            {
              hasSession: true,
              hasUser: user !== null && user !== undefined,
              provider: user?.app_metadata?.provider,
            },
            'Session check completed'
          )
        }
      } catch (error) {
        // Enhanced error handling for refresh token scenarios
        const isRefreshTokenError =
          error instanceof Error &&
          (error.message.includes('refresh_token') ||
            error.message.includes('Refresh Token') ||
            error.message.includes('Invalid Refresh Token'))

        if (isRefreshTokenError) {
          logger.warn(
            {
              error: error instanceof Error ? error.stack : error,
              authErrorType: AuthErrorTypeEnum.REFRESH_TOKEN,
              timestamp: new Date().toISOString(),
            },
            'Refresh token error detected in useAuthState'
          )

          // For refresh token errors, clear auth state and let user login again
          if (isMounted) {
            setSession(null)
            setAuthUser(null)
            setError(null) // Don't show error for refresh token issues
          }
        } else {
          const appError = handleError(error, {
            operation: 'checkSession',
            hook: 'useAuthState',
            authErrorType: isRefreshTokenError ? AuthErrorTypeEnum.REFRESH_TOKEN : undefined,
          } as const)
          if (isMounted) {
            setError(appError)
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // Note: onAuthStateChange is safe for client-side reactive UI updates
    // The listener receives events directly from Supabase Auth when state changes
    // For server-side auth checks, always use getUser() instead
    const unsubscribe = authService.onAuthStateChange((event: string, session: Session | null): void => {
      logger.debug({ event }, 'Auth state changed')
      if (isMounted) {
        setSession(session)
        setAuthUser(session?.user ?? null)
        setIsLoading(false)
      }
    })

    checkSession()

    return (): void => {
      isMounted = false
      unsubscribe()
    }
  }, []) // Remove session dependency to prevent infinite loop

  return {
    authUser,
    session,
    isLoading,
    error,
    setError,
    setIsLoading,
    setSession,
    setAuthUser,
  }
}
