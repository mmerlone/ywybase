'use client'

/**
 * @fileoverview Read-only hook for accessing current authenticated user state.
 *
 * Provides a lightweight, read-only subset of the full authentication context
 * for components that only need to read user/session state without performing
 * auth operations.
 *
 * @module hooks/useCurrentUser
 */

import type { AuthUser, Session } from '@supabase/supabase-js'

import { useAuthContext } from '@/components/providers/AuthProvider'

/**
 * Return type for the useCurrentUser hook.
 */
export interface CurrentUserState {
  /** The currently authenticated user, or null if not authenticated. */
  user: AuthUser | null
  /** The current session, or null if no active session. */
  session: Session | null
  /** Whether the authentication state is still being resolved. */
  isLoading: boolean
}

/**
 * Read-only hook for accessing the current authenticated user.
 *
 * Use this hook when you only need to read user/session state without
 * performing auth operations. This provides a cleaner API for display
 * components like headers, profile cards, and conditional rendering.
 *
 * For auth operations (sign in, sign out, etc.) use `useAuthContext` instead.
 *
 * @returns {CurrentUserState} Read-only authentication state:
 * - `user`: The authenticated {@link AuthUser}, or `null` if not logged in
 * - `session`: The active {@link Session}, or `null` if no session
 * - `isLoading`: `true` while auth state is being resolved
 *
 * @throws {Error} If used outside of `AuthProvider`
 *
 * @example
 * ```tsx
 * function UserHeader() {
 *   const { user, isLoading } = useCurrentUser();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (!user) return <LoginButton />;
 *
 *   return <span>Welcome, {user.email}</span>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Access identities for OAuth provider data
 * function SocialLinksSection() {
 *   const { user } = useCurrentUser();
 *   const userId = user?.id ?? '';
 *   const identity = user?.identities?.find((id) => id.provider === 'github');
 * }
 * ```
 */
export function useCurrentUser(): CurrentUserState {
  const { authUser, session, isLoading } = useAuthContext()
  return { user: authUser, session, isLoading }
}
