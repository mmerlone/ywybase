/**
 * @fileoverview Composition hook that unifies authentication state, actions,
 * and error utilities into a single `AuthContextType` value.
 *
 * This hook is consumed exclusively by `AuthProvider`; application code should
 * use `useAuthContext` from `@/components/providers` instead.
 *
 * @module hooks/useAuth
 * @internal
 */

'use client'

import { useCallback } from 'react'

import { authService } from '@/lib/actions/auth/client'
import { logger } from '@/lib/logger/client'
import type { AuthContextType, SerializableError, SignOutReason } from '@/types/auth.types'

import { useAuthActions } from './useAuthActions'
import { useAuthError } from './useAuthError'
import { useAuthState } from './useAuthState'

/**
 * Core authentication composition hook.
 *
 * Combines {@link useAuthState}, {@link useAuthActions}, and {@link useAuthError}
 * into a single value conforming to {@link AuthContextType}.  Also provides the
 * `refreshSession`, `hasRole`, and `isCurrentUser` utilities required by the
 * context contract.
 *
 * @internal Consumed only by `AuthProvider`. Use `useAuthContext` in components.
 *
 * @returns {AuthContextType} Full authentication context value.
 */
export function useAuth(): AuthContextType {
  // ── state ────────────────────────────────────────────────────────────
  const { authUser, session, isLoading, error, setError, setIsLoading, setSession, setAuthUser } = useAuthState()

  // ── refresh session ──────────────────────────────────────────────────
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const refreshed = await authService.refreshSession()
      if (refreshed) {
        setSession(refreshed)
        setAuthUser(refreshed.user ?? null)
      }
    } catch (err) {
      logger.error({ err, op: 'refreshSession' }, 'Failed to refresh session')
    }
  }, [setSession, setAuthUser])

  // ── actions ──────────────────────────────────────────────────────────
  const {
    signIn,
    signInWithProvider,
    signUpWithEmail,
    resetPassword,
    signOut: signOutBase,
  } = useAuthActions({
    setErrorAction: setError,
    setIsLoadingAction: setIsLoading,
    setSessionAction: setSession,
    setAuthUserAction: setAuthUser,
    refreshSessionAction: refreshSession,
  })

  // Wrap signOut to accept an optional reason parameter (AuthContextType contract)
  const signOut = useCallback(
    async (reason?: SignOutReason): Promise<{ error: SerializableError | null }> => {
      if (reason) {
        logger.info({ reason, op: 'signOut' }, 'Sign out initiated')
      }
      return signOutBase()
    },
    [signOutBase]
  )

  // ── error utilities ──────────────────────────────────────────────────
  const { clearError, getErrorForDisplay, getErrorCode, isAuthError, isValidationError, isNetworkError } = useAuthError(
    {
      error,
      setErrorAction: setError,
    }
  )

  // ── convenience helpers ──────────────────────────────────────────────

  /**
   * Check whether the current user has the given role.
   *
   * Roles are expected in `user.app_metadata.role` (set by Supabase or custom claims).
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      if (!authUser) return false
      const userRole = (authUser.app_metadata as Record<string, unknown> | undefined)?.role
      return userRole === role
    },
    [authUser]
  )

  /**
   * Check whether the given `userId` matches the currently authenticated user.
   */
  const isCurrentUser = useCallback(
    (userId: string): boolean => {
      return authUser?.id === userId
    },
    [authUser]
  )

  // ── compose ──────────────────────────────────────────────────────────
  return {
    // state
    authUser,
    session,
    error,
    isLoading,

    // actions
    signIn,
    signInWithProvider,
    signUpWithEmail,
    resetPassword,
    signOut,
    refreshSession,

    // utilities
    hasRole,
    isCurrentUser,

    // error boundary integration
    clearError,
    getErrorForDisplay,
    getErrorCode,
    isAuthError,
    isValidationError,
    isNetworkError,
  }
}
