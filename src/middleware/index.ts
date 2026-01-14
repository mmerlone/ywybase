import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { buildLogger } from '@/lib/logger/client'
import { authenticateRequest } from './auth'
import { authorizeRequest } from './authorization'
import { createContext } from './utils/context'
import { getRouteByPath } from '@/config/routes'
import { securityMiddleware } from './security'
import { generateCSPNonce } from './security/headers'
import { requestLoggerMiddleware } from './request-logger'

import { forbidden } from './utils/responses'
import { handleMiddlewareError } from './utils/errors'

const logger = buildLogger('middleware')

/**
 * Modular Middleware Composition
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  logger.info({ pathname, url: request.url }, 'middleware.start')

  // 1. Create request context (initially null/undefined until inside try block)
  // Context creation moved inside try block for performance and error handling safety

  try {
    const requestHeaders = new Headers(request.headers)
    const cspNonce = generateCSPNonce()
    requestHeaders.set('x-nonce', cspNonce)

    let response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    response.headers.set('X-CSP-Nonce', cspNonce)

    const securityResult = await securityMiddleware(request, response, { nonce: cspNonce })
    response = securityResult.response

    if (securityResult.shortCircuitResponse) {
      logger.warn({ pathname, status: securityResult.shortCircuitResponse.status }, 'middleware.security.short-circuit')
      return securityResult.shortCircuitResponse
    }

    // Handle email confirmation links with PKCE code exchange
    // Skip if already in API route to prevent redirect loops
    // Also skip error pages to prevent loops with error codes
    if (!pathname.startsWith('/api/auth/') && !pathname.startsWith('/error')) {
      const searchParams = request.nextUrl.searchParams
      const code = searchParams.get('code')

      // Known error codes should not be treated as PKCE codes
      const errorCodes = ['invalid_auth_link', 'auth_code_invalid', 'auth_link_expired', 'verification_failed']
      const isErrorCode = code && errorCodes.includes(code)

      if (code && !isErrorCode) {
        // This is a PKCE auth code from email confirmation
        // Redirect to API route to handle the exchange
        const confirmUrl = new URL('/api/auth/confirm', request.url)
        confirmUrl.searchParams.set('code', code)

        logger.info({ pathname }, 'Redirecting auth code to confirmation API route')
        return NextResponse.redirect(confirmUrl)
      }
    }

    // 1. Create request context
    const ctx = await createContext(request)

    // 3. Request Logging
    // The response from requestLoggerMiddleware is not directly used here,
    // but the function might perform side effects (e.g., logging).
    // If it returns a response that should short-circuit, it should be handled.
    // For now, assuming it's for logging and doesn't return a response to short-circuit.
    await requestLoggerMiddleware(request, response)

    // 4. Get route config
    const routeConfig = getRouteByPath(pathname)

    // 5. Authentication
    const auth = await authenticateRequest(request)

    logger.info({ pathname, authenticated: !!auth.user }, 'middleware.auth.completed')

    // Handle authentication redirects/short-circuits
    if (auth.response) {
      logger.info({ pathname }, 'middleware.auth.short-circuit')
      return auth.response
    }

    // 6. Authorization
    const authz = await authorizeRequest(request, auth.user, routeConfig)

    if (authz.redirect) {
      logger.info({ pathname, redirect: authz.redirect }, 'middleware.authz.redirect')
      return NextResponse.redirect(new URL(authz.redirect, request.url))
    }

    if (authz.allowed === false) {
      logger.warn({ pathname }, 'middleware.authz.forbidden')
      return forbidden(authz.error?.message || 'Access Denied')
    }

    // 7. Proceed with the request
    // Add tracing/context headers
    response.headers.set('x-request-id', ctx.requestId)
    return response
  } catch (err: unknown) {
    logger.error({ err, pathname }, 'middleware.failed')
    return handleMiddlewareError(err, { pathname })
  }
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - healthcheck (health check endpoint)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|healthcheck).*)',
  ],
}
