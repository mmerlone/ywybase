import { type NextRequest, type NextResponse } from 'next/server'

import { withApiErrorHandler } from '@/lib/error/server'
import { withRateLimit } from '@/middleware/security/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { handleEmailAuthCode } from '@/lib/utils/email-auth-handler'
import { AuthOperationsEnum } from '@/types/auth.types'

/**
 * Password Reset Confirmation Handler
 *
 * This route handles the password reset email link clicked by users.
 * It performs the following steps:
 *
 * 1. Validates the PKCE code from the email link
 * 2. Exchanges the code for an authenticated session
 * 3. Auto-logs in the user
 * 4. Redirects to /auth?op=set-password where user can set new password
 *
 * Flow:
 * User clicks email link → This handler → Auto-login → Redirect to password form
 * → User sets password → Password updated → Redirect to profile
 *
 * @route GET /api/auth/reset-password?code={pkce_code}
 */
export const GET = withRateLimit(
  'emailVerification', // Reuse same rate limit as email verification
  withApiErrorHandler(async (request: NextRequest): Promise<NextResponse> => {
    const supabase = await createClient()

    // Use shared email auth handler
    const result = await handleEmailAuthCode(request, supabase, {
      type: AuthOperationsEnum.FORGOT_PASSWORD,
      successMessage: 'Email verified! Please set your new password.',
      successRedirectPath: '/auth?op=set-password',
      logContext: {
        flow: 'password-reset',
      },
    })

    return result.response
  })
)
