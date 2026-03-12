/**
 * Security Middleware Index
 *
 * Composes security-related middleware including headers, rate limiting, and CSRF protection.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { buildLogger } from '@/lib/logger/client'
import { securityHeadersMiddleware } from './headers'
import { rateLimiter } from './rate-limit'

const logger = buildLogger('security-middleware')

export interface SecurityMiddlewareResult {
  response: NextResponse
  shortCircuitResponse?: NextResponse
}

/**
 * Unified security middleware
 *
 * Applies all security layers in sequence.
 */
interface SecurityMiddlewareOptions {
  nonce?: string
}

export async function securityMiddleware(
  request: NextRequest,
  initialResponse: NextResponse,
  options: SecurityMiddlewareOptions = {}
): Promise<SecurityMiddlewareResult> {
  const { pathname } = request.nextUrl
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip =
    (forwardedFor !== null ? forwardedFor.split(',')[0]?.trim() : null) ?? request.headers.get('x-real-ip') ?? 'unknown'

  try {
    let response = await securityHeadersMiddleware(request, initialResponse, { nonce: options.nonce })

    const shouldRateLimit = pathname.startsWith('/api') || pathname.startsWith('/auth')
    if (shouldRateLimit) {
      const rateLimitType = pathname.startsWith('/auth') || pathname.startsWith('/api/auth') ? 'auth' : 'api'
      response = await rateLimiter(request, response, rateLimitType)
    }

    if (shouldRateLimit && response.status === 429) {
      const rateLimitType = pathname.startsWith('/auth') || pathname.startsWith('/api/auth') ? 'auth' : 'api'
      logger.warn({ pathname, ip, rateLimitType }, 'Request rate limited')
      return { response, shortCircuitResponse: response }
    }

    return { response }
  } catch (err) {
    logger.error({ err, pathname, ip }, 'Error in security middleware chain')
    const failureResponse = new NextResponse('Internal Server Error', { status: 500 })
    return { response: failureResponse, shortCircuitResponse: failureResponse }
  }
}
