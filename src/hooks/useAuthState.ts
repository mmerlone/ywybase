'use client'

import type { AuthUser, Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

import { authService } from '@/lib/actions/auth/client'
import { handleError as handleError } from '@/lib/error/handlers/client.handler'
import { AuthErrorTypeEnum } from '@/types/error.types'
import { logger } from '@/lib/logger/client'
import type { SerializableError } from '@/types/auth.types'

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
 * @internal This hook is used internally by `useAuth` in `src/hooks/useAuth.ts`.
 * For authentication in components, use `useAuthContext` from `@/components/providers`.
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

    const scheduleIdle = (fn: () => void): void => {
      if (typeof window === 'undefined') return

      const w = window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
        cancelIdleCallback?: (id: number) => void
      }

      if (typeof w.requestIdleCallback === 'function') {
        w.requestIdleCallback(fn, { timeout: 1500 })
      } else {
        window.setTimeout(fn, 0)
      }
    }

    const checkSession = async (): Promise<void> => {
      try {
        setIsLoading(true)
        // Client-side: getSession() is used first for fast UI updates from local storage
        // This is safe on the client side for UI state management
        const hasSession = await authService.getSession()

        if (!isMounted) return

        if (isMounted && hasSession !== null && hasSession !== undefined) {
          setSession(hasSession)
          setAuthUser(hasSession?.user ?? null)

          const user = hasSession?.user
          logger.info(
            {
              hasSession: true,
              hasUser: user !== null && user !== undefined,
              provider: user?.app_metadata?.provider,
            },
            'Session check completed'
          )
        }

        // Defer user verification so initial hydration isn't competing with a network call.
        // This is UI-only: server-side operations must still verify using getUser() on the server.
        if (hasSession?.user) {
          scheduleIdle(() => {
            const verify = async (): Promise<void> => {
              try {
                // Note: authService.getUser() already handles invalid JWT by signing out
                // The auth state listener will update UI accordingly
                await authService.getUser()
                if (!isMounted) return
              } catch (err) {
                logger.debug({ err }, 'Auth user verification failed')
              }
            }

            verify().catch((err) => {
              logger.error({ err }, 'Auth user verification failed')
            })
          })
        }
      } catch (err) {
        // Enhanced error handling for refresh token scenarios
        const isRefreshTokenError =
          err instanceof Error &&
          (err.message.includes('refresh_token') ||
            err.message.includes('Refresh Token') ||
            err.message.includes('Invalid Refresh Token'))

        if (isRefreshTokenError) {
          logger.warn(
            {
              error: err instanceof Error ? err.stack : err,
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
          const appError = handleError(err, {
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
    const unsubscribe = authService.onAuthStateChange((event: string, sessionToUnsubscribe: Session | null): void => {
      logger.debug({ event }, 'Auth state changed')
      if (isMounted) {
        setSession(sessionToUnsubscribe)
        setAuthUser(sessionToUnsubscribe?.user ?? null)
        setIsLoading(false)
      }
    })

    checkSession().catch(() => {
      // Already logged
    })

    return (): void => {
      isMounted = false
      unsubscribe()
    }
  }, []) // No dependencies needed - auth state changes handled by listener

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
