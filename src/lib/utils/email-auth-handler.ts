/**
 * Email Authentication Handler Utility
 *
 * Provides reusable logic for handling email-based authentication flows:
 * - Email verification (sign-up)
 * - Password reset
 *
 * Both flows use Supabase's PKCE code exchange mechanism to establish
 * authenticated sessions.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { type SupabaseClient } from '@supabase/supabase-js'

import { applySecurityHeaders } from '@/middleware/security/headers'
import { logSecurityEvent, extractSecurityContext } from '@/middleware/security/audit'
import { setFlashMessage } from '@/lib/utils/flash-messages.server'
import { ROUTES } from '@/config/routes'
import { AuthOperationsEnum } from '@/types/auth.types'
import type { Database } from '@/types/supabase'

/**
 * Email authentication flow types corresponding to AuthOperationsEnum
 * - 'sign-up': Email verification during user registration
 * - 'forgot-password': Password reset via email link
 */
export type EmailAuthType = typeof AuthOperationsEnum.SIGN_UP | typeof AuthOperationsEnum.FORGOT_PASSWORD

export interface EmailAuthHandlerOptions {
  /**
   * The type of email authentication flow
   */
  type: EmailAuthType

  /**
   * Custom success message to display
   */
  successMessage: string

  /**
   * Path to redirect to on success
   * @default ROUTES.AUTH.redirectIfAuthenticated || '/profile'
   */
  successRedirectPath?: string

  /**
   * Path to redirect to on failure
   * @default '/error'
   */
  errorRedirectPath?: string

  /**
   * Additional data to include in security logs
   */
  logContext?: Record<string, unknown>
}

export interface EmailAuthHandlerResult {
  success: boolean
  response: NextResponse
  userId?: string
  error?: string
}

/**
 * Handles email authentication code exchange and redirects
 *
 * @param request - The incoming Next.js request
 * @param supabase - Supabase client instance
 * @param options - Configuration options for the authentication flow
 * @returns NextResponse with appropriate redirect and security headers
 *
 * @example
 * ```typescript
 * // In a route handler
 * const supabase = await createClient()
 * const result = await handleEmailAuthCode(request, supabase, {
 *   type: 'signup',
 *   successMessage: 'Email verified successfully! Welcome to your profile.',
 * })
 * return result.response
 * ```
 */
export async function handleEmailAuthCode(
  request: NextRequest,
  supabase: SupabaseClient<Database>,
  options: EmailAuthHandlerOptions
): Promise<EmailAuthHandlerResult> {
  const { searchParams, origin, hash } = new URL(request.url)
  const code = searchParams.get('code')

  const {
    type,
    successMessage,
    successRedirectPath = ROUTES.AUTH.redirectIfAuthenticated || '/profile',
    errorRedirectPath = '/error',
    logContext = {},
  } = options

  // Log authentication attempt
  const securityContext = extractSecurityContext(request, {
    details: { hasCode: !!code, type, ...logContext },
  })

  const logEventType = type === AuthOperationsEnum.SIGN_UP ? 'email_verification' : 'password_reset'
  const operationLabel = type === AuthOperationsEnum.SIGN_UP ? 'email verification' : 'password reset'
  logSecurityEvent(logEventType, securityContext, `${operationLabel} attempt`)

  // Check for Supabase error in hash (e.g., #error=access_denied&error_code=otp_expired)
  // This prevents redirect loops when email links expire
  if (hash && hash.includes('error=')) {
    const hashParams = new URLSearchParams(hash.substring(1))
    const error = hashParams.get('error')
    const errorCode = hashParams.get('error_code')
    const errorDescription = hashParams.get('error_description')

    logSecurityEvent(
      'authentication_failure',
      extractSecurityContext(request, {
        details: {
          reason: 'supabase_error_in_hash',
          error,
          errorCode,
          errorDescription,
          type,
        },
        severity: 'medium',
      }),
      `${operationLabel}: Supabase error - ${errorDescription || error}`
    )

    const errorUrl = new URL(errorRedirectPath, origin)
    errorUrl.searchParams.set('code', errorCode === 'otp_expired' ? 'auth_link_expired' : 'auth_code_invalid')
    return {
      success: false,
      response: applySecurityHeaders(NextResponse.redirect(errorUrl)),
      error: errorDescription || 'Authentication failed',
    }
  }

  // Check if code is actually an error code (prevents redirect loops)
  if (code && (code === 'invalid_auth_link' || code === 'auth_code_invalid' || code === 'auth_link_expired')) {
    logSecurityEvent(
      'suspicious_activity',
      extractSecurityContext(request, {
        details: { reason: 'error_code_used_as_auth_code', code, type },
        severity: 'high',
      }),
      `${operationLabel}: redirect loop detected - error code used as auth code`
    )

    const errorUrl = new URL(errorRedirectPath, origin)
    errorUrl.searchParams.set('code', code)
    return {
      success: false,
      response: applySecurityHeaders(NextResponse.redirect(errorUrl)),
      error: 'Invalid authentication code',
    }
  }

  // Validate code parameter
  if (!code) {
    logSecurityEvent(
      'suspicious_activity',
      extractSecurityContext(request, {
        details: { reason: 'missing_auth_code', type },
        severity: 'medium',
      }),
      `${operationLabel}: missing authentication code`
    )

    const errorUrl = new URL(errorRedirectPath, origin)
    errorUrl.searchParams.set('code', 'invalid_auth_link')
    return {
      success: false,
      response: applySecurityHeaders(NextResponse.redirect(errorUrl)),
      error: 'Missing authentication code',
    }
  }

  // Attempt code exchange
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.session) {
      // Log authentication failure
      logSecurityEvent(
        'authentication_failure',
        extractSecurityContext(request, {
          details: { error: error?.message, reason: 'auth_code_exchange_failed', type },
          severity: 'medium',
        }),
        `${operationLabel}: code exchange failed`
      )

      const errorUrl = new URL(errorRedirectPath, origin)
      errorUrl.searchParams.set('code', 'auth_code_invalid')
      return {
        success: false,
        response: applySecurityHeaders(NextResponse.redirect(errorUrl)),
        error: error?.message || 'Authentication failed',
      }
    }

    // Log successful authentication
    logSecurityEvent(
      logEventType,
      extractSecurityContext(request, {
        userId: data.user?.id,
        details: { success: true, type },
      }),
      `${operationLabel}: successful`
    )

    // Create success redirect with flash message
    const redirectUrl = new URL(successRedirectPath, origin)
    const response = NextResponse.redirect(redirectUrl)

    setFlashMessage(response, successMessage, 'success')

    return {
      success: true,
      response: applySecurityHeaders(response),
      userId: data.user?.id,
    }
  } catch (error) {
    // Log unexpected error
    logSecurityEvent(
      'suspicious_activity',
      extractSecurityContext(request, {
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          reason: 'auth_code_exchange_error',
          type,
        },
        severity: 'high',
      }),
      `${operationLabel}: unexpected error`
    )

    throw error // Let error boundary handle it
  }
}

/**
 * Validates if a code parameter exists in the request URL
 *
 * @param request - The incoming Next.js request
 * @returns Object with validation result and error response if invalid
 */
export function validateAuthCode(request: NextRequest): {
  isValid: boolean
  code: string | null
  errorResponse?: NextResponse
} {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    const errorUrl = new URL('/error', origin)
    errorUrl.searchParams.set('code', 'invalid_auth_link')
    return {
      isValid: false,
      code: null,
      errorResponse: applySecurityHeaders(NextResponse.redirect(errorUrl)),
    }
  }

  return {
    isValid: true,
    code,
  }
}
