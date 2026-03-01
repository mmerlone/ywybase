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
import type { SecurityEventType, SecuritySeverity } from '@/types/security.types'
import { logger } from '@/lib/logger/server'

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
   * @default ROUTES.AUTH.redirectIfAuthenticated
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
 * https://jbhkkxnssbivgznxdjyt.supabase.co/auth/v1/verify?token=pkce_afxxx&type=signup&redirect_to=http://localhost:3000/api/auth/confirm
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

  logger.debug({ url: request.url }, 'Processing supabase redirect')

  const {
    type,
    successMessage,
    successRedirectPath = ROUTES.AUTH.redirectIfAuthenticated,
    errorRedirectPath = '/error',
    logContext = {},
  } = options

  // Log authentication attempt
  const securityContext = extractSecurityContext(request, {
    details: { hasCode: Boolean(code), type, ...logContext },
  })

  const logEventType = type === AuthOperationsEnum.SIGN_UP ? 'email_verification' : 'password_reset'
  const operationLabel = type === AuthOperationsEnum.SIGN_UP ? 'email verification' : 'password reset'
  logSecurityEvent(logEventType, securityContext, `${operationLabel} attempt`)

  // Check for Supabase error in query params (e.g., ?error=access_denied&error_code=otp_expired)
  // This happens when clicking expired email links
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  const errorDescription = searchParams.get('error_description')

  // DEBUG: Log the incoming request details
  logger.debug(
    {
      url: request.url,
      code,
      codeLength: code?.length,
      codePrefix: code?.substring(0, 20),
      error,
      errorCode,
      errorDescription,
      hash,
    },
    'Email auth handler processing request'
  )

  // Check for missing or invalid code first - this is the primary validation
  const redirectLoopCodes = ['invalid_auth_link', 'auth_code_invalid', 'auth_link_expired']
  const hasValidCode = code && !redirectLoopCodes.includes(code)

  if (!hasValidCode) {
    logger.debug(
      {
        hasCode: Boolean(code),
        isRedirectLoopCode: code && redirectLoopCodes.includes(code),
        code,
        redirectLoopCodes,
      },
      'Invalid or missing authentication code detected'
    )
    // Get user data for bypass logic
    const userData = await supabase.auth.getUser()

    // Check if user is already authenticated/verified (bypass logic)
    if (userData.data.user) {
      const bypassReason = 'already_authenticated'
      const operationLabelMsg = 'already authenticated, bypassing error'

      logSecurityEvent(
        logEventType,
        extractSecurityContext(request, {
          userId: userData.data.user.id,
          details: { success: true, type, bypassReason, originalErrorCode: errorCode },
        }),
        `${operationLabel}: ${operationLabelMsg}`
      )

      const redirectUrl = new URL(successRedirectPath, origin)
      const response = NextResponse.redirect(redirectUrl)
      setFlashMessage(response, successMessage, 'success')
      return {
        success: true,
        response: applySecurityHeaders(response),
        userId: userData.data.user.id,
      }
    }

    // Determine error details for redirect
    const errorDescriptionMsg =
      errorDescription ??
      (code && redirectLoopCodes.includes(code) ? 'Invalid authentication code' : 'Authentication failed')

    // Determine event type and severity based on error condition
    const getEventTypeAndSeverity = (): { eventType: SecurityEventType; severity: SecuritySeverity } => {
      if (code && redirectLoopCodes.includes(code)) {
        return { eventType: 'suspicious_activity', severity: 'high' }
      }
      return { eventType: 'authentication_failure', severity: 'medium' }
    }

    const { eventType, severity } = getEventTypeAndSeverity()

    logSecurityEvent(
      eventType,
      extractSecurityContext(request, {
        details: {
          reason: error || errorCode ? 'supabase_error_in_query' : 'invalid_auth_code',
          error,
          errorCode,
          errorDescription,
          type,
          // Preserve original code for redirect loops
          ...(code && redirectLoopCodes.includes(code) && { code }),
        },
        severity,
      }),
      `${operationLabel}: Supabase error - ${errorDescription ?? error}`
    )

    const errorUrl = new URL(errorRedirectPath, origin)
    // Set error code based on condition type
    if (code && redirectLoopCodes.includes(code)) {
      errorUrl.searchParams.set('code', code) // Preserve original error code for redirect loops
    } else {
      errorUrl.searchParams.set('code', errorCode === 'otp_expired' ? 'auth_link_expired' : 'auth_code_invalid')
    }
    return {
      success: false,
      response: applySecurityHeaders(NextResponse.redirect(errorUrl)),
      error: errorDescriptionMsg,
    }
  }

  // If we have a valid code, proceed with code exchange
  logger.debug({ code, codePrefix: code?.substring(0, 20) }, 'Proceeding with code exchange')

  // Get user data for potential bypass logic during code exchange
  const userData = await supabase.auth.getUser()

  // Attempt code exchange
  try {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    logger.debug({ exchangeError, session: data.session }, 'Code exchange result')

    if (exchangeError || !data.session) {
      if (userData?.data?.user) {
        logSecurityEvent(
          logEventType,
          extractSecurityContext(request, {
            userId: userData.data.user.id,
            details: {
              success: true,
              type,
              bypassReason: 'code_exchange_failed_but_active_session',
              originalError: exchangeError?.message,
            },
          }),
          `${operationLabel}: code exchange failed but session active, bypassing`
        )

        const redirectUrl = new URL(successRedirectPath, origin)
        const response = NextResponse.redirect(redirectUrl)
        setFlashMessage(response, successMessage, 'success')
        return {
          success: true,
          response: applySecurityHeaders(response),
          userId: userData.data.user.id,
        }
      }

      // Log authentication failure
      logSecurityEvent(
        'authentication_failure',
        extractSecurityContext(request, {
          details: { error: exchangeError?.message, reason: 'auth_code_exchange_failed', type },
          severity: 'medium',
        }),
        `${operationLabel}: code exchange failed`
      )

      const errorUrl = new URL(errorRedirectPath, origin)
      errorUrl.searchParams.set('code', 'auth_code_invalid')
      return {
        success: false,
        response: applySecurityHeaders(NextResponse.redirect(errorUrl)),
        error: exchangeError?.message ?? 'Authentication failed',
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
  } catch (unexpectedError) {
    // Log unexpected error
    logSecurityEvent(
      'suspicious_activity',
      extractSecurityContext(request, {
        details: {
          error: unexpectedError instanceof Error ? unexpectedError.message : 'Unknown error',
          reason: 'auth_code_exchange_error',
          type,
        },
        severity: 'high',
      }),
      `${operationLabel}: unexpected error`
    )

    throw unexpectedError // Let error boundary handle it
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
