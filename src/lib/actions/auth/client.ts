/**
 * Client-Side Authentication Service
 *
 * Provides read-only authentication operations and OAuth flows.
 * All write operations (login, signup, password management) use Server Actions.
 *
 * @remarks
 * **Available Operations**:
 * - getSession: Read current session (⚠️ Not validated)
 * - getUser: Read current user (✅ Server-validated)
 * - signInWithProvider: OAuth provider login
 * - refreshSession: Refresh session token
 * - onAuthStateChange: Subscribe to auth events
 *
 * **Security Note**:
 * Use getUser() for security-sensitive checks, not getSession().
 *
 * @module actions/auth/client
 */

import { createClient } from '@/lib/supabase/client'
import { buildLogger } from '@/lib/logger/client'
import type { AuthUser, Session, AuthError, SupabaseClient } from '@supabase/supabase-js'

const logger = buildLogger('auth-client')

/**
 * Handle invalid JWT token errors consistently across auth methods.
 * Clears the session and returns null without throwing.
 *
 * @param error - The error from Supabase auth operation
 * @param operation - The operation name for logging
 * @param supabase - Supabase client instance
 * @returns Always returns null
 */
const handleInvalidJwtError = async (error: AuthError, operation: string, supabase: SupabaseClient): Promise<null> => {
  // Don't clear session for missing session errors - this is normal
  if (error.name === 'AuthSessionMissingError') {
    return null
  }

  try {
    await supabase.auth.signOut({ scope: 'global' })
    logger.info(
      { operation, action: 'clear-invalid-session', error: error.message },
      'Cleared invalid client session due to JWT verification failure'
    )
  } catch (signOutError) {
    logger.warn({ err: signOutError }, 'Failed to clear invalid client session')
  }

  return null
}

/**
 * Client-side authentication service.
 * Provides read operations and OAuth flows for browser/client code.
 *
 * - Session/user reading
 * - OAuth redirects (require client-side)
 * - Auth state subscriptions
 */
export const authService = {
  /**
   * Get current session from local storage.
   *
   * ⚠️ **SECURITY WARNING**: This reads session directly from storage (cookies)
   * without server verification. The data may not be authentic.
   *
   * @returns Promise resolving to session or null
   * @throws {Error} If session fetch fails
   *
   * @remarks
   * **Safe for**:
   * - Client-side UI state
   * - Checking if session exists
   * - Getting session metadata
   *
   * **NOT safe for**:
   * - Server-side authentication
   * - Authorization decisions
   * - Security-sensitive operations
   *
   * **Alternative**: Use getUser() for validated data.
   *
   * @example
   * ```typescript
   * const session = await authService.getSession()
   * if (session) {
   *   console.log('Expires at:', session.expires_at)
   * }
   * ```
   */
  async getSession(): Promise<Session | null> {
    const supabase = createClient()
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      return handleInvalidJwtError(error, 'getSession', supabase)
    }

    return session
  },

  /**
   * Get current user with server validation.
   * Contacts Supabase Auth server to validate token.
   *
   * @returns Promise resolving to authenticated user or null
   * @throws {Error} If user fetch fails
   *
   * @remarks
   * **Security**: ✅ Token validated by auth server.
   * Use this for any security-sensitive operations.
   *
   * @example
   * ```typescript
   * const user = await authService.getUser()
   * if (user) {
   *   console.log('User ID:', user.id)
   *   console.log('Email:', user.email)
   * }
   * ```
   */
  async getUser(): Promise<AuthUser | null> {
    const supabase = createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      return handleInvalidJwtError(error, 'getUser', supabase)
    }

    return user
  },

  /**
   * Login with OAuth provider (Google, GitHub, Facebook).
   * Redirects to provider's login page.
   *
   * @param provider - OAuth provider name
   * @throws {Error} If OAuth initiation fails
   *
   * @remarks
   * **Flow**:
   * 1. Redirects to provider login
   * 2. User authorizes app
   * 3. Redirects to /auth/callback
   * 4. Callback exchanges code for session
   *
   * @example
   * ```typescript
   * // In a click handler
   * await authService.signInWithProvider('google')
   * // User will be redirected to Google login
   * ```
   */
  async signInWithProvider(provider: 'google' | 'github' | 'facebook'): Promise<void> {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      throw error
    }

    if (data?.url) {
      window.location.href = data.url
    }
  },

  /**
   * Refresh the current session.
   * Gets a new access token using the refresh token.
   *
   * @returns Promise resolving to refreshed session or null
   * @throws {Error} If refresh fails
   *
   * @remarks
   * Automatically called by Supabase client when token expires.
   * Manual refresh rarely needed.
   *
   * @example
   * ```typescript
   * const session = await authService.refreshSession()
   * if (session) {
   *   console.log('Session refreshed, expires:', session.expires_at)
   * }
   * ```
   */
  async refreshSession(): Promise<Session | null> {
    const supabase = createClient()
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession()

    if (error) {
      return handleInvalidJwtError(error, 'refreshSession', supabase)
    }

    return session
  },

  /**
   * Listen to authentication state changes.
   * Subscribe to events like login, logout, token refresh.
   *
   * @param callback - Function called on auth state change
   * @returns Unsubscribe function
   *
   * @remarks
   * **Events**:
   * - SIGNED_IN: User logged in
   * - SIGNED_OUT: User logged out
   * - TOKEN_REFRESHED: Token refreshed
   * - USER_UPDATED: User data updated
   *
   * **Cleanup**: Always call unsubscribe when component unmounts.
   *
   * @example
   * ```typescript
   * useEffect(() => {
   *   const unsubscribe = authService.onAuthStateChange(
   *     (event, session) => {
   *       console.log('Auth event:', event)
   *       if (event === 'SIGNED_IN') {
   *         console.log('User logged in:', session?.user)
   *       }
   *     }
   *   )
   *
   *   return () => unsubscribe()
   * }, [])
   * ```
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void): () => void {
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(callback)

    return () => subscription.unsubscribe()
  },
}
