import { NextResponse, type NextRequest } from 'next/server'
import { buildLogger } from '@/lib/logger/client'
import { authenticateRequest } from './auth'
import { authorizeRequest } from './authorization'
import { createContext } from './utils/context'
import { getRouteByPath } from '@/config/routes'
import { securityMiddleware } from './security'
import { generateCSPNonce } from './security/headers'
import { requestLoggerMiddleware } from './request-logger'
import { updateSession } from './session'
import { setFlashMessageInMiddleware } from '@/lib/utils/flash-messages.server'
import { isSameOrSubpath } from '@/lib/utils/paths'

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

    // Session refresh — rotates access tokens via Supabase SSR and writes fresh
    // cookies to response. Must run before authentication so getUser() validates
    // a current token, not an about-to-expire one.
    response = await updateSession(request, response)

    // 1. Create request context
    const ctx = createContext(request)

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

    logger.info({ pathname, authenticated: Boolean(auth.user) }, 'middleware.auth.completed')

    // Handle authentication redirects/short-circuits
    if (auth.response) {
      logger.info({ pathname }, 'middleware.auth.short-circuit')
      return auth.response
    }

    // 6. Authorization
    const authz = await authorizeRequest(request, auth.user, routeConfig)

    if (authz.redirect !== undefined) {
      logger.info({ pathname, redirect: authz.redirect }, 'middleware.authz.redirect')
      return NextResponse.redirect(new URL(authz.redirect, request.url))
    }

    if (authz.allowed === false) {
      const isApiRoute = isSameOrSubpath(pathname, '/api')
      if (!isApiRoute) {
        const authzResponse = NextResponse.redirect(new URL('/', request.url))
        setFlashMessageInMiddleware(
          request,
          authzResponse,
          'You do not have permission to access that page.',
          'warning'
        )
        logger.info({ pathname, redirect: '/', reason: 'unauthorized' }, 'middleware.authz.redirect')
        return authzResponse
      }

      logger.warn({ pathname }, 'middleware.authz.forbidden')
      return forbidden(authz.error?.message ?? 'Access Denied')
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
