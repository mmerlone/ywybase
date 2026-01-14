/**
 * CSRF Protection Utilities
 *
 * Cross-Site Request Forgery protection using token-based validation.
 * Provides additional security layer beyond SameSite cookies.
 */

import { randomBytes, createHmac, timingSafeEqual } from 'crypto'
import { SECURITY_CONFIG } from '@/config/security'
import { buildLogger } from '@/lib/logger/client'
import type { CsrfClientHelper, ValidationResult, SecurityMiddleware } from '@/types/security.types'
import { NextRequest, NextResponse } from 'next/server'

const logger = buildLogger('security-csrf')

/**
 * CSRF token configuration
 */
const CSRF_TOKEN_LENGTH = 32
const CSRF_SECRET =
  process.env.CSRF_SECRET ||
  ((): string => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CSRF_SECRET environment variable is required in production')
    }
    return 'default-csrf-secret-change-in-production'
  })()
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  try {
    const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex')

    // Create HMAC signature
    const hmac = createHmac('sha256', CSRF_SECRET)
    hmac.update(token)
    const signature = hmac.digest('hex')

    // Combine token and signature
    const csrfToken = `${token}.${signature}`

    logger.debug({ tokenLength: csrfToken.length }, 'CSRF token generated')

    return csrfToken
  } catch (err) {
    logger.error({ err }, 'Error generating CSRF token')
    throw new Error('Failed to generate CSRF token')
  }
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(token: string): boolean {
  try {
    if (!token || typeof token !== 'string') {
      return false
    }

    // Split token and signature
    const parts = token.split('.')
    if (parts.length !== 2) {
      return false
    }

    const [tokenPart, signature] = parts

    if (!tokenPart || !signature) {
      return false
    }

    // Verify signature
    const hmac = createHmac('sha256', CSRF_SECRET)
    hmac.update(tokenPart)
    const expectedSignature = hmac.digest('hex')

    // Constant-time comparison to prevent timing attacks
    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))
  } catch (error) {
    logger.error({ error }, 'Error validating CSRF token')
    return false
  }
}

/**
 * Extract CSRF token from request
 */
export function extractCsrfToken(request: NextRequest): string | null {
  // Try to get token from header first
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (headerToken) {
    return headerToken
  }

  // Try to get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  if (cookieToken) {
    return cookieToken
  }

  return null
}

/**
 * Set CSRF token cookie in response
 */
export function setCsrfTokenCookie(response: NextResponse, token: string): NextResponse {
  try {
    const cookieConfig = SECURITY_CONFIG.cookies.csrf

    response.cookies.set(CSRF_COOKIE_NAME, token, cookieConfig)

    logger.debug({ cookieName: CSRF_COOKIE_NAME }, 'CSRF token cookie set')

    return response
  } catch (err) {
    logger.error({ err }, 'Error setting CSRF token cookie')
    return response
  }
}

/**
 * Clear CSRF token cookie
 */
export function clearCsrfTokenCookie(response: NextResponse): NextResponse {
  try {
    const cookieConfig = SECURITY_CONFIG.cookies.csrf
    response.cookies.set(CSRF_COOKIE_NAME, '', {
      ...cookieConfig,
      expires: new Date(0),
    })

    logger.debug({ cookieName: CSRF_COOKIE_NAME }, 'CSRF token cookie cleared')

    return response
  } catch (err) {
    logger.error({ err }, 'Error clearing CSRF token cookie')
    return response
  }
}

/**
 * CSRF protection middleware
 */
export const csrfMiddleware: SecurityMiddleware = async (
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> => {
  try {
    const method = request.method
    const pathname = request.nextUrl.pathname

    // Skip CSRF check for safe methods
    const safeMethods = ['GET', 'HEAD', 'OPTIONS']
    if (safeMethods.includes(method)) {
      // Generate and set CSRF token for safe methods
      const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value

      if (!existingToken || !validateCsrfToken(existingToken)) {
        const newToken = generateCsrfToken()
        return setCsrfTokenCookie(response, newToken)
      }

      return response
    }

    // Skip CSRF check for API routes that use other authentication
    const skipPaths = ['/api/auth/callback', '/api/webhook']

    if (skipPaths.some((path) => pathname.startsWith(path))) {
      return response
    }

    // Validate CSRF token for state-changing methods
    const token = extractCsrfToken(request)

    if (!token) {
      logger.warn(
        {
          method,
          pathname,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
        'CSRF token missing'
      )

      return NextResponse.json(
        {
          error: {
            code: 'CSRF_TOKEN_MISSING',
            message: 'CSRF token is required for this request',
          },
        },
        { status: 403 }
      )
    }

    if (!validateCsrfToken(token)) {
      logger.warn(
        {
          method,
          pathname,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
        'CSRF token invalid'
      )

      return NextResponse.json(
        {
          error: {
            code: 'CSRF_TOKEN_INVALID',
            message: 'Invalid CSRF token',
          },
        },
        { status: 403 }
      )
    }

    logger.debug({ method, pathname }, 'CSRF token validated')

    return response
  } catch (error) {
    logger.error(
      {
        error,
        pathname: request.nextUrl.pathname,
        method: request.method,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      },
      'Error in CSRF middleware - failing closed'
    )

    return NextResponse.json(
      {
        error: {
          code: 'CSRF_VALIDATION_ERROR',
          message: 'CSRF validation failed due to server error',
        },
      },
      { status: 403 }
    )
  }
}

/**
 * Wrapper for API routes with CSRF protection
 */
export function withCsrfProtection(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Skip CSRF check for safe methods
      const safeMethods = ['GET', 'HEAD', 'OPTIONS']
      if (safeMethods.includes(request.method)) {
        return await handler(request)
      }

      // Validate CSRF token
      const token = extractCsrfToken(request)

      if (!token || !validateCsrfToken(token)) {
        logger.warn(
          {
            method: request.method,
            pathname: request.nextUrl.pathname,
            hasToken: !!token,
            ip: request.headers.get('x-forwarded-for') || 'unknown',
          },
          'CSRF validation failed in API route'
        )

        return NextResponse.json(
          {
            error: {
              code: 'CSRF_VALIDATION_FAILED',
              message: 'CSRF token validation failed',
            },
          },
          { status: 403 }
        )
      }

      // Execute handler
      return await handler(request)
    } catch (error) {
      logger.error({ error }, 'Error in CSRF protection wrapper')

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

/**
 * Get CSRF token for client-side use
 */
export function getCsrfToken(request: NextRequest): string | null {
  return extractCsrfToken(request)
}

/**
 * Validate CSRF configuration
 */
export function validateCsrfConfig(): ValidationResult {
  const issues: string[] = []

  try {
    // Check CSRF secret
    if (!process.env.CSRF_SECRET) {
      if (SECURITY_CONFIG.isProduction) {
        issues.push('CSRF_SECRET environment variable is required in production')
      } else {
        issues.push('CSRF_SECRET environment variable should be set (using default for development)')
      }
    } else if (process.env.CSRF_SECRET === 'default-csrf-secret-change-in-production') {
      if (SECURITY_CONFIG.isProduction) {
        issues.push('CSRF_SECRET must not use the default value in production')
      } else {
        issues.push('CSRF_SECRET should be changed from default value')
      }
    } else if (process.env.CSRF_SECRET.length < 32) {
      issues.push('CSRF_SECRET should be at least 32 characters long')
    }

    // Check cookie configuration
    const cookieConfig = SECURITY_CONFIG.cookies.csrf

    if (cookieConfig.httpOnly) {
      issues.push('CSRF cookie should not be httpOnly (needs to be accessible to JavaScript)')
    }

    if (cookieConfig.sameSite !== 'strict' && SECURITY_CONFIG.isProduction) {
      issues.push('CSRF cookie should use sameSite=strict in production')
    }

    return {
      isValid: issues.length === 0,
      issues,
    }
  } catch (error) {
    issues.push(`Error validating CSRF config: ${error}`)
    return {
      isValid: false,
      issues,
    }
  }
}

/**
 * Refresh CSRF token (for long-lived sessions)
 */
export function refreshCsrfToken(_request: NextRequest, response: NextResponse): NextResponse {
  try {
    const newToken = generateCsrfToken()
    return setCsrfTokenCookie(response, newToken)
  } catch (err) {
    logger.error({ err }, 'Error refreshing CSRF token')
    return response
  }
}

/**
 * Client-side CSRF token helper
 */
export const CSRF_CLIENT_HELPER: CsrfClientHelper = {
  cookieName: CSRF_COOKIE_NAME,
  headerName: CSRF_HEADER_NAME,

  getToken(): string | null {
    if (typeof document === 'undefined') return null

    const prefix = `${CSRF_COOKIE_NAME}=`
    const cookie = document.cookie.split('; ').find((row) => row.startsWith(prefix))

    if (!cookie) return null

    const value = cookie.substring(prefix.length)
    return value || null
  },

  addToHeaders(headers: HeadersInit = {}): HeadersInit {
    const token = this.getToken()
    if (!token) return headers

    return {
      ...headers,
      [CSRF_HEADER_NAME]: token,
    }
  },
}
