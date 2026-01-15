/**
 * Authentication Middleware
 *
 * Handles authentication and authorization checks using centralized route configuration.
 * Uses flash messages for cross-page notifications instead of URL parameters.
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildLogger } from '@/lib/logger/client'
import { createClient } from '@/lib/supabase/server'
import { ROUTES, PROTECTED_PATHS, AUTH_PATHS, VERIFIED_EMAIL_REQUIRED_PATHS, getRouteByPath } from '@/config/routes'
import { getSupabaseEnvStatus } from '@/config/supabase-public'
import { ConfigurationError } from '@/lib/error/errors'
import { User, Session } from '@supabase/supabase-js'
import { setFlashMessageInMiddleware } from '@/lib/utils/flash-messages.server'
import { AuthOperationsEnum } from '@/types/auth.types'

const logger = buildLogger('middleware-auth')

const unauthenticatedOnlyOperations = [
  AuthOperationsEnum.LOGIN,
  AuthOperationsEnum.SIGN_UP,
  AuthOperationsEnum.FORGOT_PASSWORD,
  // AuthOperationsEnum.SET_PASSWORD,
]

/**
 * Check if pathname matches path or is a subpath
 */
function isSameOrSubpath(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(path + '/')
}

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

  if (userError) {
    logger.error({ err: userError, path: pathname }, 'AUTH MIDDLEWARE: Failed to get authenticated user')

    // For protected routes, redirect to auth page on error
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
      hasSession: !!session,
      hasUser: !!user,
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
  const shouldRedirectIfAuthenticated = unauthenticatedOnlyOperations.includes(authOperation as AuthOperationsEnum)

  if (AUTH_PATHS.some((path) => isSameOrSubpath(pathname, path)) && shouldRedirectIfAuthenticated) {
    logger.info(
      {
        pathname,
        hasSession: !!session,
        hasUser: !!user,
        routeConfigPath: routeConfig?.path,
        hasRedirectProperty: routeConfig ? 'redirectIfAuthenticated' in routeConfig : false,
        redirectValue: routeConfig?.redirectIfAuthenticated,
        willRedirect: !!(
          session &&
          user &&
          routeConfig &&
          'redirectIfAuthenticated' in routeConfig &&
          routeConfig.redirectIfAuthenticated
        ),
      },
      'AUTH MIDDLEWARE: Checking auth route redirect'
    )

    if (
      session &&
      user &&
      routeConfig &&
      'redirectIfAuthenticated' in routeConfig &&
      routeConfig.redirectIfAuthenticated
    ) {
      logger.info(
        { pathname, redirectTo: routeConfig.redirectIfAuthenticated },
        'AUTH MIDDLEWARE: ⚠️ REDIRECTING authenticated user from auth page'
      )
      const redirectUrl = new URL(routeConfig.redirectIfAuthenticated, request.url)
      return { user, session, response: NextResponse.redirect(redirectUrl) }
    } else {
      logger.info({ pathname }, 'AUTH MIDDLEWARE: Not redirecting - conditions not met')
    }
  }

  // 3. Handle email verification requirements
  if (user && VERIFIED_EMAIL_REQUIRED_PATHS.some((path) => isSameOrSubpath(pathname, path))) {
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
 * Validates and sanitizes a redirect path to prevent open redirects
 * Only allows internal paths starting with '/' and disallows dangerous patterns
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
        if (safeRedirectPath) {
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
