/**
 * Security Headers Management
 *
 * Centralized security headers implementation using configuration from
 * src/config/security.ts. Replaces scattered header implementations.
 */

import { SECURITY_CONFIG } from '@/config/security'
import { buildLogger } from '@/lib/logger/client'
import type {
  SecurityHeadersOptions,
  SecurityHeadersReport,
  SecurityMiddleware,
  ValidationResult,
} from '@/types/security.types'
import { type NextRequest, NextResponse } from 'next/server'

const logger = buildLogger('security-headers')

interface SecurityHeaderMiddlewareOptions {
  nonce?: string
}

/**
 * Generate cryptographically secure random bytes using the most compatible API
 */
function generateRandomBytes(size: number): Uint8Array {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const array = new Uint8Array(size)
    globalThis.crypto.getRandomValues(array)
    return array
  }

  throw new Error('Secure randomness is not available in this environment')
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }

  if (typeof btoa === 'function') {
    let binary = ''
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte)
    })
    return btoa(binary)
  }

  throw new Error('Base64 encoding is not available in this environment')
}

/**
 * Generate a cryptographically secure nonce for CSP
 */
export function generateCSPNonce(): string {
  const randomBytes = generateRandomBytes(16)
  return bytesToBase64(randomBytes)
}

/**
 * Apply security headers to a response using centralized configuration
 */
export function applySecurityHeaders<T = unknown>(
  response: NextResponse<T>,
  options: SecurityHeadersOptions = {}
): NextResponse<T> {
  try {
    const { generateNonce = false, customHeaders = {}, nonce: providedNonce } = options

    // Generate nonce if requested or reuse provided/existing nonce
    const existingNonce = response.headers.get('X-CSP-Nonce') ?? undefined
    const nonce = providedNonce ?? existingNonce ?? (generateNonce ? generateCSPNonce() : undefined)

    // Get security headers from centralized config
    const securityHeaders = SECURITY_CONFIG.getSecurityHeaders(nonce ?? '')

    // Apply all security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        // Only set non-empty values
        response.headers.set(key, value)
      }
    })

    // Apply custom headers if provided
    Object.entries(customHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Store nonce in response headers for template access
    if (nonce !== undefined) {
      response.headers.set('X-CSP-Nonce', nonce)
    }

    // Remove X-Powered-By header for security
    response.headers.delete('X-Powered-By')

    return response
  } catch (err) {
    logger.error({ err }, 'Error applying security headers')
    return response
  }
}

/**
 * Set a secure cookie using centralized configuration
 */
export function setSecureCookie(
  response: NextResponse,
  name: string,
  value: string,
  type: keyof typeof SECURITY_CONFIG.cookies = 'session'
): void {
  try {
    const cookieConfig = SECURITY_CONFIG.cookies[type]

    response.cookies.set(name, value, cookieConfig)
  } catch (err) {
    logger.error({ err, cookieName: name }, 'Error setting secure cookie')
  }
}

/**
 * Clear a secure cookie
 */
export function clearSecureCookie(response: NextResponse, name: string): void {
  try {
    response.cookies.set(name, '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: SECURITY_CONFIG.isProduction,
      sameSite: 'lax',
    })
  } catch (err) {
    logger.error({ err, cookieName: name }, 'Error clearing secure cookie')
  }
}

/**
 * Middleware wrapper to apply security headers to all responses
 */
export function withSecurityHeaders<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
): (...args: T) => Promise<NextResponse> {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const response = await handler(...args)
      return applySecurityHeaders(response, { generateNonce: true })
    } catch (err) {
      logger.error({ err }, 'Error in security headers middleware')

      // Create error response with security headers
      const errorResponse = NextResponse.json({ error: 'Internal server error' }, { status: 500 })

      return applySecurityHeaders(errorResponse)
    }
  }
}

/**
 * Apply CORS headers using centralized configuration
 */
export function applyCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  try {
    const corsConfig = SECURITY_CONFIG.cors
    let allowedOrigin = false

    // Check if origin is allowed
    if (origin !== undefined && corsConfig.origins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      allowedOrigin = true
    } else if (corsConfig.origins.includes('*')) {
      // Only set wildcard if credentials are not enabled
      if (!corsConfig.credentials) {
        response.headers.set('Access-Control-Allow-Origin', '*')
        allowedOrigin = true
      }
    }

    if (allowedOrigin) {
      response.headers.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '))
      response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '))
      response.headers.set('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '))
      response.headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString())

      if (corsConfig.credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true')
      }
    }

    return response
  } catch (err) {
    logger.error({ err, origin }, 'Error applying CORS headers')
    return response
  }
}

/**
 * Security headers middleware for Next.js middleware
 */
export const securityHeadersMiddleware: SecurityMiddleware<SecurityHeaderMiddlewareOptions> = async (
  request: NextRequest,
  response: NextResponse,
  options
): Promise<NextResponse> => {
  try {
    // Don't apply security headers to API routes here
    // They should be applied individually with appropriate configurations
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return response
    }

    // Apply security headers to page responses
    const secureResponse = applySecurityHeaders(response, {
      generateNonce: options?.nonce === undefined,
      nonce: options?.nonce,
      strictCSP: SECURITY_CONFIG.isProduction,
    })

    // Apply CORS headers if needed
    const origin = request.headers.get('origin')
    if (origin !== null) {
      return applyCorsHeaders(secureResponse, origin)
    }

    return secureResponse
  } catch (err) {
    logger.error({ err, pathname: request.nextUrl.pathname }, 'Error in security headers middleware')
    return response
  }
}

/**
 * Validate security headers configuration
 */
export function validateSecurityHeaders(): ValidationResult {
  const issues: string[] = []

  try {
    // Test header generation
    const headers = SECURITY_CONFIG.getSecurityHeaders('')

    // Check required headers
    const requiredHeaders = ['Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy']

    requiredHeaders.forEach((header) => {
      if (headers[header] === undefined) {
        issues.push(`Missing required header: ${header}`)
      }
    })

    // Validate CSP
    const csp = headers['Content-Security-Policy']
    if (csp !== undefined) {
      if (csp.includes("'unsafe-eval'") && SECURITY_CONFIG.isProduction === true) {
        issues.push('CSP contains unsafe-eval in production')
      }

      if (!csp.includes('default-src')) {
        issues.push('CSP missing default-src directive')
      }
    }

    // Validate HSTS in production
    const hsts = headers['Strict-Transport-Security']
    if (SECURITY_CONFIG.isProduction === true && (hsts === undefined || hsts === 'max-age=0')) {
      issues.push('HSTS not properly configured for production')
    }

    return {
      isValid: issues.length === 0,
      issues,
    }
  } catch (error) {
    issues.push(`Error validating headers: ${error}`)
    return {
      isValid: false,
      issues,
    }
  }
}

/**
 * Get CSP nonce from response headers
 */
export function getCSPNonce(response: NextResponse): string | undefined {
  return response.headers.get('X-CSP-Nonce') ?? undefined
}

/**
 * Create a security headers report for debugging
 */
export function createSecurityHeadersReport(response: NextResponse): SecurityHeadersReport {
  const headers: Record<string, string> = {}
  const recommendations: string[] = []
  let securityScore = 0

  // Extract security-related headers
  const securityHeaderNames = [
    'Content-Security-Policy',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security',
    'Referrer-Policy',
    'Permissions-Policy',
  ]

  securityHeaderNames.forEach((headerName) => {
    const value = response.headers.get(headerName)
    if (value !== null) {
      headers[headerName] = value
      securityScore += 10
    } else {
      recommendations.push(`Add ${headerName} header`)
    }
  })

  // Check CSP quality
  const csp = headers['Content-Security-Policy']
  if (csp !== undefined) {
    if (csp.includes("'unsafe-inline'")) {
      recommendations.push('Remove unsafe-inline from CSP')
      securityScore -= 5
    }
    if (csp.includes("'unsafe-eval'")) {
      recommendations.push('Remove unsafe-eval from CSP')
      securityScore -= 5
    }
    if (csp.includes("'nonce-")) {
      securityScore += 5
    }
  }

  return {
    headers,
    securityScore: Math.max(0, Math.min(100, securityScore)),
    recommendations,
  }
}
