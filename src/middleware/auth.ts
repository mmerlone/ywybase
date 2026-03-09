/**
 * Authentication Middleware
 *
 * Handles authentication and authorization checks using centralized route configuration.
 * Uses flash messages for cross-page notifications instead of URL parameters.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { buildLogger } from '@/lib/logger/client'
import { createClient } from '@/lib/supabase/server'
import { ROUTES, PROTECTED_PATHS, AUTH_PATHS, VERIFIED_EMAIL_REQUIRED_PATHS, getRouteByPath } from '@/config/routes'
import { getSupabaseEnvStatus } from '@/config/supabase-public'
import { ConfigurationError } from '@/lib/error/errors'
import { type User, type Session } from '@supabase/supabase-js'
import { setFlashMessageInMiddleware } from '@/lib/utils/flash-messages.server'
import { isSameOrSubpath } from '@/lib/utils/paths'
import { AuthOperationsEnum, type AuthOperations } from '@/types/auth.types'

const logger = buildLogger('middleware-auth')

/**
 * List of authentication operations that should redirect to home if user is already authenticated.
 * These are operations like login/signup that don't make sense for logged-in users.
 */
const unauthenticatedOnlyOperations: AuthOperations[] = [
  AuthOperationsEnum.LOGIN,
  AuthOperationsEnum.SIGN_UP,
  AuthOperationsEnum.FORGOT_PASSWORD,
  // AuthOperationsEnum.SET_PASSWORD,
]

/**
 * Authenticates the incoming request and retrieves user/session data.
 *
 * This function performs the core authentication logic:
 * 1. Checks Supabase configuration availability
 * 2. Creates a Supabase client with cookie support for token refresh
 * 3. Retrieves user via `getUser()` (secure server-side validation)
 * 4. Handles redirects for authenticated users on auth pages
 * 5. Handles email verification requirements
 *
 * @param request - The incoming Next.js request object
 * @returns Promise resolving to user, session, and optional redirect response
 *
 * @remarks
 * **Security**: Uses `getUser()` instead of `getSession()` to validate tokens
 * with the Supabase Auth server rather than trusting cookie data directly.
 *
 * **Auth Page Handling**: Authenticated users are redirected away from
 * login/signup forms, but can still access forgot-password, set-password,
 * and resend-verification operations.
 *
 * @example
 * ```typescript
 * const { user, session, response } = await authenticateRequest(request)
 * if (response) return response // Handle redirect
 * if (user) {
 *   // User is authenticated
 * }
 * ```
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  user: User | null
  session: Session | null
  response?: NextResponse
}> {
  const { pathname } = request.nextUrl
  const supabaseEnv = getSupabaseEnvStatus()

  if (!supabaseEnv.isConfigured) {
    logger.warn(
      { pathname, missingEnv: supabaseEnv.missing },
      'AUTH MIDDLEWARE: Supabase config missing, skipping auth checks'
    )

    if (
      PROTECTED_PATHS.some((path) => pathname.startsWith(path)) ||
      AUTH_PATHS.some((path) => pathname.startsWith(path))
    ) {
      const redirectUrl = new URL('/error?code=configuration_error', request.url)
      return { user: null, session: null, response: NextResponse.redirect(redirectUrl) }
    }

    return { user: null, session: null }
  }

  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    // Pass NextRequest to createClient() for full cookie support (token refresh)
    const created = await createClient()
    supabase = created
  } catch (error) {
    if (error instanceof ConfigurationError) {
      logger.error({ pathname, error }, 'AUTH MIDDLEWARE: Supabase configuration error')
      const redirectUrl = new URL('/error?code=configuration_error', request.url)
      return { user: null, session: null, response: NextResponse.redirect(redirectUrl) }
    }
    throw error
  }

  logger.info({ pathname, url: request.url }, 'AUTH MIDDLEWARE: Starting authentication check')

  // 1. Get user (authenticates with Supabase Auth server for security)
  // Note: Using getUser() instead of getSession() because getSession() reads from
  // storage (cookies) directly without verifying with the auth server, which could
  // be insecure. getUser() contacts the Supabase Auth server to validate the token.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  logger.debug({ user, userError }, 'AUTH MIDDLEWARE: User retrieved')
  // [2026-02-18T00:49:20.318Z] debug AUTH MIDDLEWARE: User retrieved module="middleware-auth" user=null userError={"__isAuthError":true,"name":"AuthSessionMissingError","status":400}

  if (userError) {
    // AuthSessionMissingError is expected for unauthenticated users - not a real error
    const isSessionMissing = userError.name === 'AuthSessionMissingError'

    if (isSessionMissing) {
      logger.debug({ pathname }, 'AUTH MIDDLEWARE: No session (unauthenticated user)')
    } else {
      // Log actual errors (e.g., network issues, invalid tokens)
      logger.error({ err: userError, path: pathname }, 'AUTH MIDDLEWARE: Failed to get authenticated user')
    }

    // For invalid JWT tokens or other auth errors, clear the session
    if (!isSessionMissing) {
      try {
        await supabase.auth.signOut({ scope: 'local' })
        logger.info(
          { pathname, module: 'middleware-auth', action: 'clear-invalid-session' },
          'AUTH MIDDLEWARE: Cleared invalid session'
        )
      } catch (signOutError) {
        // Don't fail if signOut fails, just log it
        logger.warn(
          { err: signOutError, pathname, module: 'middleware-auth', action: 'clear-invalid-session-failed' },
          'AUTH MIDDLEWARE: Failed to clear invalid session'
        )
      }
    }

    // For protected routes, redirect to auth page
    if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
      const response = NextResponse.redirect(new URL(ROUTES.AUTH.path, request.url))
      return { user: null, session: null, response }
    }

    // For non-protected routes, continue without user
    return { user: null, session: null }
  }

  // Get session for additional metadata if user exists
  const session = user ? (await supabase.auth.getSession()).data.session : null

  logger.info(
    {
      pathname,
      hasSession: Boolean(session),
      hasUser: Boolean(user),
      userId: user?.id,
    },
    'AUTH MIDDLEWARE: Session retrieved'
  )

  const routeConfig = getRouteByPath(pathname)

  // 2. Handle auth routes redirects (if already logged in)
  // Only redirect authenticated users from login and sign-up forms
  // Other operations (forgot-password, set-password, resend-verification) should be accessible
  const searchParams = request.nextUrl.searchParams
  const authOperation = searchParams.get('op')
  const shouldRedirectIfAuthenticated = unauthenticatedOnlyOperations.includes(authOperation as AuthOperations)

  if (AUTH_PATHS.some((path) => isSameOrSubpath(pathname, path))) {
    logger.info(
      {
        pathname,
        hasSession: Boolean(session),
        hasUser: Boolean(user),
        routeConfigPath: routeConfig?.path,
        hasRedirectProperty: routeConfig ? 'redirectIfAuthenticated' in routeConfig : false,
        redirectValue: routeConfig?.redirectIfAuthenticated,
        authOperation,
        shouldRedirectIfAuthenticated,
      },
      'AUTH MIDDLEWARE: Checking auth route redirect'
    )

    // For auth routes, always check if user should be redirected
    // This covers cases where op parameter is missing or invalid
    const isUnauthenticatedOnlyRoute =
      authOperation !== null ? unauthenticatedOnlyOperations.includes(authOperation as AuthOperations) : true // Default to redirect if no op specified (likely login page)

    if (
      session !== null &&
      user !== null &&
      routeConfig !== null &&
      'redirectIfAuthenticated' in routeConfig &&
      routeConfig.redirectIfAuthenticated !== undefined &&
      isUnauthenticatedOnlyRoute
    ) {
      logger.info(
        { pathname, redirectTo: routeConfig.redirectIfAuthenticated },
        'AUTH MIDDLEWARE: ⚠️ REDIRECTING authenticated user from auth page'
      )
      const redirectUrl = new URL(routeConfig.redirectIfAuthenticated, request.url)
      return { user, session, response: NextResponse.redirect(redirectUrl) }
    } else {
      logger.info(
        {
          pathname,
          hasSession: Boolean(session),
          hasUser: Boolean(user),
          isUnauthenticatedOnlyRoute,
          redirectCondition:
            session !== null &&
            user !== null &&
            routeConfig !== null &&
            'redirectIfAuthenticated' in routeConfig &&
            routeConfig.redirectIfAuthenticated !== undefined &&
            isUnauthenticatedOnlyRoute,
        },
        'AUTH MIDDLEWARE: Not redirecting - conditions not met'
      )
    }
  }

  // 3. Handle email verification requirements
  if (user !== null && VERIFIED_EMAIL_REQUIRED_PATHS.some((path) => isSameOrSubpath(pathname, path))) {
    if (!user.email_confirmed_at) {
      const redirectUrl = new URL('/', request.url)
      const response = NextResponse.redirect(redirectUrl)
      setFlashMessageInMiddleware(request, response, 'Please verify your email to access this page', 'warning')
      return { user, session, response }
    }
  }

  return { user, session }
}

/**
 * Validates and sanitizes a redirect path to prevent open redirect attacks.
 *
 * @param path - The path to validate
 * @returns The validated path if safe, or null if potentially malicious
 *
 * @remarks
 * **Security Checks**:
 * - Must start with '/' (relative path)
 * - Must not start with '//' (protocol-relative URL)
 * - Must not contain URL schemes (http:, javascript:, data:, etc.)
 * - Must not contain HTML/JS injection characters
 * - Must be under 2048 characters
 *
 * @example
 * ```typescript
 * validateRedirectPath('/profile')        // Returns '/profile'
 * validateRedirectPath('//evil.com')      // Returns null
 * validateRedirectPath('javascript:alert') // Returns null
 * ```
 */
function validateRedirectPath(path: string): string | null {
  // Must start with '/' but not with '//' (prevents protocol-relative URLs)
  if (!path.startsWith('/') || path.startsWith('//')) {
    return null
  }

  // Disallow URL schemes (http:, https:, javascript:, data:, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) {
    return null
  }

  // Disallow HTML/JS injection patterns
  if (/[<>"']/.test(path)) {
    return null
  }

  // Ensure it's a reasonable length
  if (path.length > 2048) {
    return null
  }

  return path
}

/**
 * Main authentication middleware function.
 *
 * Enforces authentication requirements for protected routes and handles
 * redirects based on route configuration. Fail-closed for protected paths.
 *
 * @param request - The incoming Next.js request object
 * @returns NextResponse - Either continues the request or redirects
 *
 * @remarks
 * **Route Handling**:
 * - Routes not in configuration are treated as public (continues)
 * - Protected routes redirect unauthenticated users to auth page
 * - Sets `x-user-id` header for authenticated requests to protected routes
 *
 * **Error Handling**: Fail-closed approach - errors on protected routes
 * result in redirect to auth page for security.
 *
 * @example
 * ```typescript
 * // In middleware.ts
 * export async function middleware(request: NextRequest) {
 *   return requireAuth(request)
 * }
 * ```
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Skip middleware for routes not in our configuration (implicitly public)
  const routeConfig = getRouteByPath(pathname)
  if (!routeConfig) {
    return NextResponse.next()
  }

  try {
    const { user, response } = await authenticateRequest(request)

    if (response) return response

    // For protected routes, check if user is authenticated
    if (PROTECTED_PATHS.some((path) => isSameOrSubpath(pathname, path))) {
      if (!user) {
        logger.info({ path: pathname }, 'Redirecting unauthenticated user to auth')
        const redirectUrl = new URL(ROUTES.AUTH.path, request.url)

        // Validate and sanitize the redirect path
        const safeRedirectPath = validateRedirectPath(pathname)
        if (safeRedirectPath !== null) {
          redirectUrl.searchParams.set('redirectedFrom', safeRedirectPath)
        }

        return NextResponse.redirect(redirectUrl)
      }

      // Add user info to request headers for server components
      const res = NextResponse.next()
      res.headers.set('x-user-id', user.id)
      return res
    }

    return NextResponse.next()
  } catch (error: unknown) {
    logger.error(
      { err: error instanceof Error ? error : new Error(String(error)), path: pathname },
      'Error in auth middleware'
    )

    // Fail-closed for protected paths
    if (PROTECTED_PATHS.some((path) => isSameOrSubpath(pathname, path))) {
      const redirectUrl = new URL(ROUTES.AUTH.path, request.url)
      return NextResponse.redirect(redirectUrl)
    }

    return NextResponse.next()
  }
}
